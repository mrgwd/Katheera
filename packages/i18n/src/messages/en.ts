// English message catalog — the shape authority. ar.ts must satisfy the
// `Messages` type below, so missing/extra keys fail at compile time.
// (Values are widened strings: only the key structure is enforced.)

const en = {
  meta: {
    title: "Katheera - Smart Sebha",
    description:
      "A smart sebha that uses AI to count your zikr for you while you are working, studying, or focusing on something else.",
  },
  locale: {
    en: "English",
    ar: "العربية",
  },
  marketing: {
    common: {
      logoAlt: "Katheera logo",
    },
    header: {
      home: "Home",
      privacy: "Privacy",
      contribute: "Contribute",
      contact: "Contact",
    },
    hero: {
      title: "Turn your <muted>silence</muted> into <brand>rewards</brand>",
      quote:
        "O you who have believed, remember Allah with much remembrance",
      cite: "— Quran 33:41",
      ctaPrimary: "Get the extension",
      ctaSecondary: "Try it now",
      badges: "Free • Privacy-first • Open source",
    },
    features: {
      eyebrow: "Features",
      title: "Everything you need, <grad>nothing you don't</grad>",
      items: [
        {
          title: "Hands-Free Counting",
          description:
            "No need to tap a counter. Simply speak and Katheera counts automatically.",
        },
        {
          title: "Works Offline",
          description:
            "The AI model runs entirely in your browser — no internet required after install.",
        },
        {
          title: "Privacy-First",
          description:
            "Your voice never leaves your device. No servers, no storage, no tracking.",
        },
        {
          title: "Lightweight",
          description:
            "Optimized to run quietly in the background without affecting browsing speed.",
        },
        {
          title: "Simple Interface",
          description:
            "A clean minimal popup shows your zikr counts at a glance, anytime.",
        },
        {
          title: "Built with Care",
          description:
            "Crafted by a Muslim developer for the Muslim community — with love.",
        },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Frequently Asked Questions",
      items: [
        {
          question: "Does Katheera record my voice?",
          answer:
            "No. Katheera processes all audio on your device using on-device AI. Your voice is never recorded, stored, or sent to external servers. Everything stays private and on your computer.",
        },
        {
          question: "Does it work offline?",
          answer:
            "Yes! Katheera works completely offline. The AI model runs locally on your device, so you can count your zikr even without an internet connection.",
        },
        {
          question: "What phrases are supported?",
          answer:
            "Currently, Katheera supports: Subhan'Allah (سبحان الله), Al-Hamdulillah (الحمد لله). We're continuously improving phrase recognition based on user feedback.",
        },
        {
          question: "How accurate is the detection?",
          answer:
            "Katheera uses on-device AI for phrase detection. Accuracy improves over time as the model learns.",
        },
        {
          question: "Is Katheera free?",
          answer:
            "Yes! Katheera is completely free to use. It's an open-source project built by the community for the community.",
        },
        {
          question: "Can I sync my count across devices?",
          answer:
            "Currently, your count is stored locally in the extension. We might explore optional cloud sync features in the future for users who want to track their zikr across multiple devices.",
        },
        {
          question: "Does it work in all languages?",
          answer:
            "Katheera currently focuses on Arabic zikr phrases. English transliterations are supported for better learning and accessibility.",
        },
        {
          question: "What if it misdetects my speech?",
          answer:
            "If you experience accuracy issues, you can adjust microphone sensitivity settings. You can also provide feedback to help improve the model.",
        },
      ],
      stillTitle: "Still have questions?",
      stillBody:
        "Feel free to open an issue on GitHub or reach out to the developer directly.",
      contact: "Contact",
    },
    footer: {
      tagline:
        "Transform your silent moments into spiritual rewards with hands-free zikr counting.",
      product: "Product",
      community: "Community",
      legal: "Legal",
      chromeStore: "Chrome Web Store",
      howItWorks: "How It Works",
      faq: "FAQ",
      github: "GitHub",
      reportIssue: "Report an Issue",
      contribute: "Contribute",
      privacyPolicy: "Privacy Policy",
    },
    promo: {
      title: "Katheera Demo Video",
    },
    privacy: {
      lastUpdated: "Last updated: 2026",
      title: "Privacy Policy",
      introA:
        "Katheera is a Chrome extension designed to help users perform zikr (remembrance of Allah) by automatically detecting supported spoken zikr phrases and counting them.",
      introB: "Your privacy is extremely important to us.",
      introC: "This Privacy Policy explains how Katheera handles user data.",
      sections: [
        {
          title: "Data Collection",
          content:
            "Katheera does not collect, store, transmit, or sell any personal data.",
          listLabel: "The extension does not collect:",
          list: [
            "Personally identifiable information",
            "Browsing history",
            "Location data",
            "Audio recordings",
            "Usage analytics",
            "Any other personal data",
          ],
        },
        {
          title: "Microphone Usage",
          content:
            "Katheera requires microphone access in order to detect spoken zikr phrases.",
          listLabel: "Important notes:",
          list: [
            "Audio is processed locally on the user's device",
            "Audio is not recorded",
            "Audio is not stored",
            "Audio is never transmitted to any server",
          ],
          note: "The detection is performed using a lightweight on-device AI model running entirely inside the browser.",
        },
        {
          title: "Local Storage",
          content:
            "Katheera uses the browser's local storage to save zikr counters and user preferences. This data remains on the user's device and is never transmitted externally.",
        },
        {
          title: "Third-Party Services",
          content:
            "Katheera does not use any third-party analytics services, tracking systems, or external APIs. All functionality runs locally within the browser.",
        },
        {
          title: "Offline Functionality",
          content:
            "Katheera can operate without an internet connection. All detection and counting features work locally on the device.",
        },
        {
          title: "Changes to This Privacy Policy",
          content:
            'This policy may be updated from time to time. Any updates will be posted on this page with a revised "Last updated" date.',
        },
      ],
      contactTitle: "Contact",
      contactBodyA:
        "If you have questions about this Privacy Policy, you can contact the developer at:",
      contribTitle: "Voice Contribution Program",
      contribIntroA: "The",
      contribLink: "/contribute",
      contribIntroB:
        "page is an entirely separate, opt-in program and operates under a different data policy from the Katheera extension. Participation is voluntary and independent of using the extension.",
      contribWarn:
        "Unlike the extension — which never sends audio to a server — contributing explicitly uploads your voice recordings.",
      collectedTitle: "What is collected",
      collectedItems: [
        "Raw audio recordings (your voice clips)",
        "The text prompt displayed during recording",
        "Tone variation instruction (e.g. quiet, fast)",
        "A random session identifier (UUID) generated in your browser — not linked to your identity",
        "Timestamp of submission",
      ],
      notCollectedTitle: "What is NOT collected",
      notCollectedItems: [
        "No name, email, or account",
        "No device identifiers or IP address stored",
        "No browser fingerprinting",
      ],
      storageTitle: "Storage & access",
      storageBody:
        "Audio files are stored in Supabase (encrypted at rest). Only the project maintainer can access them for review and model training. Files are retained indefinitely so that future improvements to the processing pipeline can be applied to past recordings.",
      withdrawTitle: "Right to withdraw",
      withdrawBodyA:
        "Once submitted, recordings cannot be automatically deleted because they are anonymous. If you submitted recordings in error and want them removed, contact",
      withdrawBodyB:
        "with your session's approximate date/time and we will do our best to locate and delete them.",
    },
  },
};

export type Messages = typeof en;

export default en;
