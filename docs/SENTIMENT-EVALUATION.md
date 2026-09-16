# Advisory sentiment evaluation

Installed vader-sentiment 1.1.3, the Apache-2.0 JavaScript port of VADER. Package source and licence are shipped with the dependency: https://github.com/vaderSentiment/vaderSentiment-js. Original research: Hutto and Gilbert (2014), VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text; https://github.com/cjhutto/vaderSentiment.

The adapter preserves case and processes the complete input in bounded sections. Mean/min/max describe section polarity; the mean is a project-specific approximation, not an official whole-document VADER compound calculation. These are neither confidence values nor clinical risk probabilities. Word-boundary handling of unusually long unbroken tokens remains approximate.

The pipeline computes advisory sentiment only after the safety policy allows ordinary processing. It supplies the summary to eligible local generation alongside actual conversation context. It does not alter safety rules or automatically diagnose emotions. Existing authored response rules still handle supported situations. The selected JS port is old; simple negation and mixed-section fixtures do not establish parity with current Python VADER or performance on real distress.

Next evaluation: indirect emotions, sarcasm, quoted speech, mixed feelings, slang, family context and user preference adherence. A known rule match is not proof of sufficient understanding. Do not choose a reply or suppress model fallback solely because VADER reports neutral or positive polarity.
