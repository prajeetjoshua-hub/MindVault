import type {
  Decision,
  Memory,
  ModelAdapter,
  Preferences,
  TraceEvent,
} from "../contracts/types.ts";
import { normalise } from "../normalisation/normalise.ts";
import { extractEvidence } from "../evidence/extractEvidence.ts";
import { evaluatePolicy } from "../policy/evaluatePolicy.ts";
import { isGenericFallback, respond } from "../support-content/respond.ts";
import { validateReplyQuality } from "../output-gate/validateReplyQuality.ts";
import { buildContext } from "./buildContext.ts";
import { selectMemories } from "../personalisation/selectMemories.ts";
import { safetyTransition } from "../policy/safetyTransition.ts";
import { isReplyFeedback } from "../support-content/conversation.ts";
import { modelPermission } from "../policy/modelPermission.ts";
import { analyseSentiment } from "../sentiment/analyseSentiment.ts";
import { companionInstruction } from "./companionInstruction.ts";

export class ConversationOrchestrator {
  private active?: AbortController;
  private unresolvedSafety = false;
  private acuteAction = false;
  private safetyChecks = 0;
  private previousUser = "";
  private previousReply = "";
  private recentUsers: string[] = [];
  private recentTurns: string[] = [];
  private dialogue: { role: "user" | "assistant"; content: string }[] = [];
  private noQuestions = false;
  private assaultPending = false;
  private selfHarmPending = false;
  private conversationGoal?: Preferences["goal"];
  private safetyReassurances = 0;
  constructor(
    private emit: (event: TraceEvent) => void,
    private model?: ModelAdapter,
  ) {}
  cancel() {
    this.active?.abort();
    void this.model?.cancel().catch(() => {});
  }
  reset() {
    this.cancel();
    this.previousUser = "";
    this.previousReply = "";
    this.recentUsers = [];
    this.recentTurns = [];
    this.dialogue = [];
    this.noQuestions = false;
    this.assaultPending = false;
    this.selfHarmPending = false;
    this.conversationGoal = undefined;
    this.safetyReassurances = 0;
    this.unresolvedSafety = false;
    this.acuteAction = false;
    this.safetyChecks = 0;
  }
  async process(
    input: string,
    preferences: Preferences,
    memories: Memory[] = [],
  ) {
    this.cancel();
    const controller = new AbortController();
    this.active = controller;
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    let sequence = 0;
    const event = (
      layer: string,
      status: TraceEvent["status"],
      details: TraceEvent["details"],
    ) => {
      try {
        this.emit({
          traceId,
          sequence: ++sequence,
          timestamp: new Date().toISOString(),
          layer,
          status,
          details,
        });
      } catch {
        /* Diagnostics must never prevent a local response. */
      }
    };
    const started = Date.now();
    try {
      event("input", "completed", {
        characters: input.length,
        mode: "text",
        persisted: false,
      });
      if (!input.trim()) throw new Error("Please enter a message.");
      const text = normalise(input);
      if (/stop asking|no questions/.test(text)) this.noQuestions = true;
      if (/ask me|questions are okay/.test(text)) this.noQuestions = false;
      if (
        /help me (?:decide|plan)|what (?:should|can) i do|give me (?:a plan|steps)/.test(
          text,
        )
      )
        this.conversationGoal = "plan";
      else if (/just listen|no advice/.test(text))
        this.conversationGoal = "listen";
      else if (/help me reflect/.test(text)) this.conversationGoal = "reflect";
      preferences = {
        ...preferences,
        goal: this.conversationGoal ?? preferences.goal,
      };
      event("normalisation", "completed", {
        characters: text.length,
        operation: "NFKC, punctuation, lowercase; no truncation",
      });
      event("evidence", "started", { characters: text.length });
      const extracted = await extractEvidence(
        text,
        controller.signal,
        (done, total) => {
          if (done === total || done % 8 === 0)
            event("coverage", "completed", { processed: done, total });
        },
      );
      const lexicalCoverage =
        /\b(i|my|me|we|hi|hello|hey|thanks|thank|feel|feeling|lonely|what|how|why|can|please|today|yesterday|tomorrow|it|this|that|they|their)\b/.test(
          text,
        );
      const assault = extracted.evidence.some(
        (e) => e.id === "physical-assault" && e.category === "safety",
      );
      if (
        extracted.evidence.some(
          (e) => e.id === "current-harm" && e.category === "safety",
        )
      )
        this.selfHarmPending = true;
      if (assault) this.assaultPending = true;
      const assaultResolved =
        this.assaultPending &&
        !this.selfHarmPending &&
        !this.acuteAction &&
        /\b(?:safe now|i am safe|i'm safe|safe i have come|away from them|somewhere safe)\b/.test(
          text,
        ) &&
        !extracted.evidence.some(
          (e) => e.category === "safety" || e.category === "uncertainty",
        ) &&
        !/\b(?:not|unsafe|coming to|still|but)\b/.test(text);
      if (assaultResolved) {
        this.assaultPending = false;
        this.unresolvedSafety = false;
        this.safetyChecks = 0;
      }
      // Pain after a reported assault keeps its cause, even across short follow-ups.
      const injuryFollowup =
        this.assaultPending &&
        /\b(?:hurts?|hurting|painful|pain|paining|slapped|face)\b/.test(text);
      const priorConversation = this.recentUsers.join("\n");
      const relationshipContext = /\b(?:break[- ]?up|broke up|relationship|left me|dumped me|partner)\b/.test(
        `${priorConversation} ${text}`,
      );
      const reassuranceNow =
        /\b(?:i(?: am|'m)? (?:totally |completely |now )?(?:safe|fine|okay|ok|good|alright)|i feel better|i am not in (?:any |immediate )?danger)\b/.test(
          text,
        );
      const urgentAssault =
        this.assaultPending &&
        /\b(?:coming to hit|about to hit|help(?: me+)?|save me)\b/.test(text);
      if (urgentAssault)
        extracted.evidence.push({
          id: "danger",
          category: "safety",
          start: 0,
          end: text.length,
          contribution: 0,
        });
      if (injuryFollowup && !assault)
        extracted.evidence.push({
          id: "physical-assault",
          category: "safety",
          start: 0,
          end: text.length,
          contribution: 0,
        });
      const transition = safetyTransition(
        text,
        extracted.evidence,
        this.unresolvedSafety,
        this.acuteAction,
        this.safetyReassurances,
      );
      this.unresolvedSafety = transition.pending;
      this.acuteAction = transition.acuteAction;
      const activeSafety = transition.evidence.some(
        (e) => e.category === "safety",
      );
      if (transition.resolved) this.safetyReassurances = 0;
      else if (reassuranceNow && !activeSafety)
        this.safetyReassurances = Math.min(2, this.safetyReassurances + 1);
      else this.safetyReassurances = 0;
      const decision: Decision = evaluatePolicy(
        transition.evidence,
        extracted.topic,
        this.unresolvedSafety,
        lexicalCoverage,
      );
      if (transition.clarify && !transition.acuteAction) {
        decision.route = "CLARIFY";
        decision.reasons = ["safety-check-pending"];
      }
      if (transition.resolved) {
        this.assaultPending = false;
        this.selfHarmPending = false;
        this.acuteAction = false;
        decision.reasons.push("user-reported-safe");
        this.safetyChecks = 0;
      }
      if (transition.contextFirst)
        decision.reasons.push("context-first-safety-check");
      if (decision.route === "SAFETY") this.unresolvedSafety = true;
      event("context", "completed", {
        topic: extracted.topic,
        previousContextUsed: Boolean(this.previousUser),
        ruleMatches: extracted.evidence.map((e) => e.id),
        lexicalCoverage,
      });
      event("policy", "completed", {
        route: decision.route,
        score: decision.score,
        ...decision.contributions,
        reasons: decision.reasons,
        version: decision.policyVersion,
        clinicalProbability: false,
      });
      const permission = modelPermission(decision, this.unresolvedSafety);
      const sentiment = permission.allowed
        ? await analyseSentiment(input, controller.signal)
        : undefined;
      const privacyQuestion =
        /\b(?:watching|seeing|viewing|accessing|reading|monitoring|looking at|checking)\b.*\b(?:chat|conversation|messages)\b|\b(?:chat|conversation|messages)\b.*\b(?:private|stored|shared|seen|viewed|accessed)\b/.test(
          text,
        );
      const identityQuestion =
        /\b(?:you|u)\b.*\b(?:eat|ate|breakfast)|\bdo you eat\b/.test(text);
      const eligible =
        permission.allowed &&
        !transition.resolved &&
        !assaultResolved &&
        !privacyQuestion &&
        !identityQuestion &&
        Boolean(this.model?.ready());
      const relevantMemories = eligible ? selectMemories(text, memories) : [];
      event("personalisation", "completed", {
        memoryIds: relevantMemories.map((m) => m.id),
        goal: preferences.goal,
        detail: preferences.detail,
        training: false,
      });
      let output = respond(
        decision,
        text,
        preferences,
        this.recentUsers.join("\n"),
        this.previousReply,
      );
      const safetyReassurance = reassuranceNow;
      const selfHarmMethod =
        /\b(?:cut(?:ting)?|slash(?:ing)?)\s+(?:myself|my\s+(?:hand|arm|wrist))\b/.test(
          text,
        );
      if (transition.contextFirst)
        output =
          selfHarmMethod
            ? relationshipContext
              ? "I’m really sorry this breakup is hurting so much. Please don’t cut yourself—someone leaving does not decide your worth. Put down anything sharp and move near a trusted person now. Have you already hurt your hand, or are you feeling the urge to do it?"
              : "I’m really sorry this is hurting so much. Please don’t cut yourself. Put down anything sharp and move near a trusted person now. Have you already hurt your hand, or are you feeling the urge to do it?"
            : isReplyFeedback(text)
            ? "You’re right to question that response. I should take your words seriously instead of sounding as if I could leave the conversation. Are you safe right now, and are you thinking about ending your life or have you already hurt yourself?"
            : "That sounds painful, and I’m taking what you said seriously. Are you thinking about ending your life, or describing how overwhelmed you feel?";
      if (transition.clarify) {
        if (this.acuteAction) {
          output =
            this.safetyChecks++ === 0
              ? "I hear you, but because you said you were hurting yourself, I need one clear check: have you stopped, and are you injured or bleeding right now? Move away from anything sharp and get a trusted person with you. If you are bleeding or badly hurt, use Help & support or contact local emergency services now."
              : "I’m still concerned because you said you were hurting yourself. Please tell me whether you have stopped and whether you need medical help. You can keep this short; if you may hurt yourself again, move near someone you trust and use Help & support now.";
        } else if (safetyReassurance) {
          this.safetyChecks++;
          output =
            "I hear you saying you feel better. Are you sure you’re safe right now? You can tell me anything that is bothering you, and I’ll stay with what you want to talk through. You deserve support, and you don’t have to make a permanent decision in a painful moment.";
        } else {
          output =
            this.safetyChecks++ === 0
              ? "I hear you. Just to clarify what you said earlier: are you safe right now, and have you avoided hurting yourself? You can tell me plainly; I won’t treat feeling better as something to argue with."
              : "I’m still listening. I want to make sure I understood the safety concern before we move on: are you safe right now, and have you avoided hurting yourself? You can answer that directly, and then we can return to what you wanted to talk about.";
        }
        if (isReplyFeedback(text))
          output = "I hear that my replies aren’t helping. " + output;
      }
      if (transition.resolved)
        output = relationshipContext
          ? "Thanks for clarifying that you’re safe. We can move on—I won’t keep repeating the emergency message. Do you want to tell me more about what happened in the breakup?"
          : /\bmonitor\b/.test(`${priorConversation} ${text}`)
            ? "Thanks for clarifying that you’re safe. We can move on—I won’t keep repeating the emergency message. How are you enjoying your monitor?"
            : "Thanks for clarifying that you’re safe. We can move on—I won’t keep repeating the emergency message. What would you like to talk about now?";
      if (
        transition.clarify &&
        !this.acuteAction &&
        this.safetyChecks > 1 &&
        /\b(?:talk|about|monitor|movies)\b/.test(text)
      ) {
        output = respond(
          { ...decision, route: "LOW" },
          text,
          preferences,
          this.recentUsers.join("\n"),
          this.previousReply,
        );
        decision.reasons.push("topic-change-with-safety-unconfirmed");
      }
      const selfHarmNow = extracted.evidence.some(
        (e) => e.category === "safety" && e.id === "current-harm",
      );
      if (selfHarmNow && !transition.contextFirst) {
        output =
          "I’m really sorry you’re in this much pain. You said you are hurting yourself, so please put down anything sharp and get a trusted person beside you now. Are you bleeding or seriously injured? If you are, or you may hurt yourself again, use Help & support or contact local emergency services immediately. This app cannot call for you.";
        decision.route = "SAFETY";
      } else if (urgentAssault && !selfHarmNow) {
        output =
          "You’re asking for help after being hit. If you can do so safely, get away from the person hurting you and reach a trusted adult, neighbour, or nearby person now. Open Help & support to call emergency services. This app cannot send help or call for you. You do not need to keep typing here before seeking help.";
        decision.route = "SAFETY";
      } else if ((assault || injuryFollowup) && !selfHarmNow) {
        output =
          injuryFollowup && !assault
            ? "You said you were hit, and now it hurts. I’m taking that seriously. Please reach a trusted person who can help you get medical attention, especially if the pain is severe or worsening. Are you somewhere away from the person who hit you? If you are in immediate danger, use Help & support to call emergency services."
            : "I’m sorry you were hit. Being hit is not your fault, and you deserve to be safe. Are you away from the person who hit you right now? If you are injured or in immediate danger, reach a trusted person and use Help & support for urgent help.";
      } else if (transition.clarify && this.assaultPending && !selfHarmNow) {
        output =
          "After what you described, I want to check whether you are somewhere safe from being hit again. You can keep talking; you don’t have to explain the whole incident again. Help & support is available if you need someone nearby.";
      }
      if (assaultResolved) {
        output =
          "I’m glad you’ve reached somewhere safe. You don’t need to keep confirming it. Being hit was not your fault. If you’re still hurting, please ask someone you trust to help you get medical attention. We can talk about what you need next, at your pace.";
        decision.reasons.push("user-reported-safe-from-assault");
      }
      if (this.noQuestions && !["SAFETY", "CLARIFY"].includes(decision.route))
        output =
          output
            .split(/(?<=[.!?])\s+/)
            .filter((sentence) => !sentence.includes("?"))
            .join(" ") ||
          "I hear you. There’s no need to answer another question right now.";
      // MEDIUM distress can benefit from the local model's warmer wording. LOW
      // messages use it only when the authored layer returned a generic fallback.
      const modelEligible =
        eligible && (decision.route === "MEDIUM" || isGenericFallback(output));
      let source: "template" | "local-model" = "template";
      event("model-gate", modelEligible ? "completed" : "skipped", {
        eligible: modelEligible,
        reason: modelEligible
          ? permission.reason
          : permission.allowed
            ? eligible
              ? "authored-specific-response"
              : "model-unavailable"
            : "policy-disallows-generation",
      });
      if (modelEligible) {
        event("model", "started", {
          model: this.model?.modelName ?? "local-model-unspecified",
          contextMode: "all-passages-hierarchical-summary",
        });
        try {
          const snippets = await buildContext(
            input,
            this.model!,
            controller.signal,
            (processed, total) =>
              event("model-context", "completed", {
                processed,
                total,
                summarised: input.length > 2800,
              }),
          );
          const dialogue =
            this.dialogue.reduce(
              (size, turn) => size + turn.content.length,
              0,
            ) <= 5000
              ? this.dialogue
              : undefined;
          const contextNotes = await buildContext(
            `${dialogue ? "" : this.recentTurns.join("\n")}\nUser-approved memories: ${relevantMemories.map((m) => m.text).join("; ")}`,
            this.model!,
            controller.signal,
            (processed, total) =>
              event("personalisation-context", "completed", {
                processed,
                total,
              }),
          );
          const candidate = await this.model!.generate({
            turns: dialogue,
            input: snippets,
            context: `${contextNotes}\nPreferences: ${preferences.goal}, ${preferences.detail}, ${preferences.style}\nAdvisory VADER section polarity: ${JSON.stringify(sentiment)}. This is not emotion certainty or risk. Prefer the person's stated feelings and preserve mixed emotions; do not mention these scores to the user.`,
            instruction: companionInstruction(this.noQuestions, preferences.goal),
            signal: controller.signal,
          });
          controller.signal.throwIfAborted();
          const validation = validateReplyQuality(
            candidate,
            this.previousReply,
            preferences,
            this.noQuestions,
          );
          event("output-gate", validation.accepted ? "completed" : "failed", {
            ...validation,
          });
          if (validation.accepted) {
            output = candidate;
            source = "local-model";
          }
          event("model", "completed", { source });
        } catch (error) {
          controller.signal.throwIfAborted();
          event("model", "failed", {
            reason: "runtime-failed",
            fallback: "authored-template",
          });
        }
      }
      controller.signal.throwIfAborted();
      if (
        privacyQuestion &&
        !extracted.evidence.some((e) => e.category === "safety")
      ) {
        output =
          "No live counsellor or emergency responder is watching this chat through MindVault. In this desktop preview, the conversation stays in this browser session; an optional local model runs on this computer, and the paired dashboard receives diagnostic events rather than conversation text. Someone with access to your unlocked screen could still read it.";
        source = "template";
      }
      this.previousUser = text;
      this.recentUsers = [...this.recentUsers, text].slice(-20);
      this.recentTurns = [
        ...this.recentTurns,
        `User: ${text}\nCompanion: ${output}`,
      ].slice(-20);
      this.previousReply = output;
      this.dialogue = [
        ...this.dialogue,
        { role: "user" as const, content: input },
        { role: "assistant" as const, content: output },
      ].slice(-40);
      event("response", "completed", {
        source,
        characters: output.length,
        durationMs: Date.now() - started,
      });
      return {
        text: output,
        decision,
        source,
        traceId,
        nextSequence: sequence + 1,
      };
    } catch (error) {
      event("pipeline", "failed", {
        reason: controller.signal.aborted ? "cancelled" : "processing-error",
        durationMs: Date.now() - started,
      });
      throw error;
    }
  }
}
