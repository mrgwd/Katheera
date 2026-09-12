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
  app: {
    katheera: "Katheera",
    meta: {
      title: "Katheera - Web App",
      description:
        "A smart sebha that uses AI to count your zikr for you while you are working, studying, or focusing on something else. You say the zikr, and Katheera will count it for you.",
    },
    mic: {
      start: "Start listening",
      stop: "Stop listening",
    },
    title: {
      listening: "Listening...",
    },
    floating: {
      listening: "Listening",
      stop: "Stop listening",
    },
    settings: {
      toggle: "Settings",
      language: "Language",
      darkMode: "Dark Mode",
      confidence: "Confidence Threshold:",
      confidenceTip:
        "How confident the model must be before counting a zikr. Higher = fewer false positives but may miss soft speech.",
      target: "Target Volume:",
      targetTip:
        "Loudness the audio is normalized to before the model runs. Lower values amplify quieter speech more.",
      silence: "Silence Threshold:",
      silenceTip:
        "Audio frames quieter than this are treated as silence and skipped entirely.",
    },
    zikr: {
      back: "Back",
      notFound: "Not found",
      descTemplate:
        "Learn about {label} — meaning, sources, and repeated recitation with Katheera.",
    },
  },
  contribute: {
    meta: {
      title: "Contribute — Katheera",
      description:
        "Help Katheera recognize more voices. Donate a few voice samples to train the AI model and earn ongoing rewards (sadaqah jariyah).",
    },
    steps: {
      about: "About",
      consent: "Consent",
      micCheck: "Mic check",
      recording: "Recording",
      done: "Done",
    },
    landing: {
      heroTitle: "Help Katheera hear every voice",
      heroBody:
        "Katheera's AI model was trained on a limited set of voices. To recognize azkar accurately — across accents, microphones, and environments — it needs to hear from people like you.",
      warnTitle: "This page uploads your recordings",
      warnBody:
        "Unlike the Katheera extension — which processes audio entirely on-device and never sends anything to a server — this contribution page intentionally uploads your voice recordings to train the AI model. This is strictly opt-in.",
      warnLink: "Read the full Contributor Privacy Notice →",
      verseTranslation:
        '"O you who have believed, remember Allah with much remembrance."',
      verseCite: "— Surah Al-Ahzab 33:41",
      cards: [
        {
          title: "Sadaqah Jariyah",
          body: "Every person who uses Katheera to remember Allah — their extra dhikr flows back as ongoing reward to those who made it possible.",
        },
        {
          title: "Sharing Good",
          body: '"Whoever points to something good gets a reward similar to the one who does it." — The Prophet ﷺ',
        },
        {
          title: "Katheeran",
          body: "The name Katheera (كثيرًا) comes from Allah's command to make dhikr abundant. Your voice helps more people do exactly that.",
        },
      ],
      todoTitle: "What this takes (~5 minutes)",
      todos: [
        "Say each of the three main azkar 6 times — each time in a slightly different way (quiet, fast, slow…)",
        "Read ~10 everyday Arabic phrases to help the model learn what non-zikr speech sounds like",
        "Each recording is short (~2 seconds), and you can replay and re-record before submitting",
      ],
      cta: "I want to contribute",
    },
    consent: {
      title: "Before we start",
      body: "Please confirm the following — all three are required.",
      itemUpload:
        "I understand my voice recordings will be uploaded to a server and stored for AI model training purposes.",
      itemAnon:
        "I understand this is anonymous — no personal information is collected alongside my recordings, and I can stop at any time.",
      itemPolicy:
        "I have read and agree to the <link>Contributor Privacy Notice</link>.",
      cta: "Start Recording",
      foot: "You can stop at any point — any recordings already submitted still count and help the model.",
    },
    mic: {
      title: "Microphone check",
      body: "We need microphone access to record your voice samples.",
      waiting: "Waiting for microphone permission…",
      waitingHint:
        "Look for the permission prompt in your browser's address bar or a pop-up dialog.",
      ready: "Microphone ready",
      testLabel: "Say something to test your microphone:",
      levelNone: "No sound detected",
      levelOk: "Sound detected ✓",
      levelLoud: "Loud — try speaking a bit softer",
      cta: "My mic sounds good",
      deniedTitle: "Microphone access denied",
      deniedBody: "To contribute, please allow microphone access:",
      deniedBullets: [
        "• Click the 🔒 or 🎙️ icon in your browser's address bar",
        '• Set Microphone to "Allow"',
        "• Reload this page",
      ],
      deniedCta: "Reload and try again",
      errorTitle: "Couldn't access microphone",
      errorBody:
        "Make sure no other app is using your microphone and try reloading.",
    },
    recording: {
      progress: "{current} of {total}",
      milestoneHalf: "Halfway there! 🌟 Keep going!",
      milestoneLast5: "Last 5! You're almost done 💪",
      milestoneAll: "That's all of them! 🎉",
      badgeZikr: "Zikr",
      badgeOpen: "🎤 Free speech",
      badgeNoise: "📝 Read aloud",
      noiseHint:
        "Read naturally in your own accent/dialect — no need to be exact",
      success: "Uploaded!",
      tryAgain: "Try again ({remaining} left)",
      useThis: "Use this",
      uploading: "Uploading…",
      uploadError: 'Upload failed — tap "Use this" to retry',
      hintRecording: "Recording… tap to stop",
      hintRecorded: "Listen back, then decide",
      hintIdle: "Tap the mic to start recording",
      skip: "Skip this prompt",
      tones: {
        normal: "Say it in your natural voice",
        quiet: "Say it softly, almost a whisper",
        fast: "Say it a bit faster than usual",
        slow: "Say it slowly and clearly",
        deep: "Say it with a deeper voice",
        far: "Hold the mic further away as you speak",
      },
    },
    complete: {
      title: "بارك الله فيك — JazakAllah Khayran",
      submittedPrefix: "You submitted",
      count: "{count, plural, one {# voice sample} other {# voice samples}}",
      submittedNote: "That's a real contribution to the model.",
      impactTitle: "What happens next?",
      impacts: [
        "Your recordings will be reviewed, then added to the training dataset.",
        "The model will be retrained and released to all users.",
        "Every extra dhikr counted by someone using this model — you helped make that happen.",
      ],
      hadithCite: "— Sahih Muslim",
      hadithTranslation:
        '"Whoever points to something good gets a reward similar to the one who does it."',
      share: "Share with others",
      copied: "Copied!",
      again: "Contribute another session",
      shareText:
        "I just donated my voice to help Katheera — a free, on-device AI dhikr counter — become smarter. If you make dhikr, you can help too: https://katheera.mohamedramadan.dev/contribute",
    },
  },
  errors: {
    notFound: {
      title: "Page not found",
      body: "The page you are looking for doesn't exist or was moved.",
      home: "Back home",
    },
    error: {
      title: "Something went wrong",
      body: "Please try again — if the problem persists, let us know.",
      retry: "Try again",
      home: "Back home",
    },
  },
  extension: {
    status: {
      idle: "Click the button to activate.",
      running: "Mic is running in the background (offscreen).",
      stopped: "Mic stopped.",
      error: "Error: {message}",
      permError: "Error checking permission: {message}",
    },
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
      quote: "O you who have believed, remember Allah with much remembrance",
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
