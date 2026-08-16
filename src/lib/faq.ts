/* Shared FAQ content — surfaced on the landing page and the app home.
   Written for a non-technical reader: no "prompts", "foundation models",
   "pipelines" or version numbers. Where a term is unavoidable (API), it's
   explained in the same sentence. */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_EN: FaqItem[] = [
  {
    q: 'What does Presora actually do?',
    a: 'We ask the AI assistants your customers use — ChatGPT, Claude, Gemini and others — about your brand, then show you exactly what they said. You get one score out of 100, each assistant\'s answer, and a short list of things to fix, most important first.',
  },
  {
    q: 'Which AI assistants do you check?',
    a: 'The free plan checks ChatGPT. Starter and Solo add Claude and Gemini. Business checks all six, including Perplexity. Larger companies can ask us to add their own.',
  },
  {
    q: 'How long does it take?',
    a: 'About 10 seconds. We ask every assistant at the same time, and you can watch their answers come in.',
  },
  {
    q: 'How reliable is the score?',
    a: 'The score combines five things we measure, checked against more than 200 well-known brands. Every answer counts toward the total, so one unusual reply can\'t throw your score off.',
  },
  {
    q: 'Can I compare myself to competitors?',
    a: 'Yes — on the Growth and Agency plans you can add up to 10 competitors and see them next to your own brand, checked the same way and on the same schedule.',
  },
  {
    q: 'Can I connect Presora to my own tools?',
    a: 'Yes. From the Developers page you can create a key that lets your own software pull results automatically, and get notified the moment a scan finishes or your score changes. Setup instructions are included.',
  },
  {
    q: 'How is my data handled?',
    a: 'Anything you tell us about your brand stays private to your account. We never use it to train AI models, and never share it with anyone beyond the AI providers needed to run your scan. Fully GDPR compliant.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — no contracts, no lock-in. Cancel in one click from Settings, and you keep access until the end of the period you\'ve paid for.',
  },
];
