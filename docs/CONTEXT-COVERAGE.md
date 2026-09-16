# Context coverage notes

MindVault uses small, authored phrase families for ordinary conversation. They are deliberately reviewable and run after safety evidence has been extracted. They are not an attempt to claim an exhaustive vocabulary or to reproduce an internet corpus.

## Food and everyday chat

`packages/support-content/foodContext.ts` recognises meal reports, drinks, hunger, low appetite, cooking, food preferences and disappointing meals. The vocabulary is organised by meal context and broad food families so that a message such as “I had dosa for breakfast” receives a food-specific follow-up instead of a generic prompt. It does not calculate calories, diagnose nutrition problems or give medical diet advice.

The categories were checked against the public structure of [USDA FoodData Central](https://fdc.nal.usda.gov/about-us/), which describes multiple food-composition data types. MindVault uses that reference only as a sanity check for broad category coverage; it does not copy USDA records into the app.

## Relationships and breakups

`packages/support-content/relationshipContext.ts` covers breakup, rejection, being left or ghosted, betrayal, arguments, missing an ex, long-distance relationships and crushes. Replies acknowledge the feeling, preserve the user’s stated cause and offer one relevant next question. They avoid insulting a former partner or assuming the user’s gender.

The emotional framing is consistent with the [NHS guidance on relationships and mental wellbeing](https://www.nhs.uk/every-mind-matters/lifes-challenges/maintaining-healthy-relationships-and-mental-wellbeing/): difficult relationship experiences can affect wellbeing, boundaries matter and a trusted person outside the relationship can help. The app does not present that guidance as a diagnosis or a substitute for professional care.

## Safety precedence

Food and relationship matching never runs before safety extraction. Cutting or hurting oneself, suicidal wording, imminent danger, assault and overdose remain safety routes. A direct admission of current self-harm stays urgent until the person reports stopping and gives a clear injury or bleeding status. The design follows the principle in the [988 Suicide & Crisis Lifeline safety policy](https://988lifeline.org/wp-content/uploads/2024/09/988-Suicide-and-Crisis-Lifeline-Suicide-Safety-Policy-2024.pdf) that affirmative current action requires an immediate safety assessment. MindVault cannot call emergency services or monitor a person.

## Coverage boundary

These phrase families make common demonstrations more natural and reduce the old generic fallback. They do not understand every possible wording. LOW messages with a specific authored match keep that deterministic answer; MEDIUM support may use the local SLM for warmer wording; unseen LOW wording can use the SLM only when the authored layer returns a generic fallback. Safety and uncertainty continue to withhold generation. New examples should be added as tests before being presented as supported behavior.
