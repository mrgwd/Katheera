const sections = [
  {
    title: "Data Collection",
    content:
      "Katheera does not collect, store, transmit, or sell any personal data.",
    list: [
      "Personally identifiable information",
      "Browsing history",
      "Location data",
      "Audio recordings",
      "Usage analytics",
      "Any other personal data",
    ],
    listLabel: "The extension does not collect:",
  },
  {
    title: "Microphone Usage",
    content:
      "Katheera requires microphone access in order to detect spoken zikr phrases.",
    list: [
      "Audio is processed locally on the user's device",
      "Audio is not recorded",
      "Audio is not stored",
      "Audio is never transmitted to any server",
    ],
    listLabel: "Important notes:",
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
];

export default function Privacy() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* <Navbar /> */}

      <main className="layout pt-32 pb-24">
        {/* Header */}
        <div
          className="animate-fade mb-12 opacity-0"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-muted-foreground mb-3 text-sm">
            Last updated: 2026
          </p>
          <h1 className="text-foreground mb-4 text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Katheera is a Chrome extension designed to help users perform zikr
            (remembrance of Allah) by automatically detecting supported spoken
            zikr phrases and counting them.{" "}
            <span className="text-foreground font-medium">
              Your privacy is extremely important to us.
            </span>{" "}
            This Privacy Policy explains how Katheera handles user data.
          </p>
        </div>

        {/* Divider */}
        <div
          className="border-border animate-fade mb-12 border-t opacity-0"
          style={{ animationDelay: "200ms" }}
        />

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <div
              key={i}
              className="animate-fade opacity-0"
              style={{ animationDelay: `${i * 100 + 100}ms` }}
            >
              <h2 className="text-foreground mb-3 text-lg font-semibold">
                {section.title}
              </h2>
              <p className="text-muted-foreground mb-3 leading-relaxed">
                {section.content}
              </p>

              {section.listLabel && (
                <p className="text-muted-foreground mb-2 text-sm">
                  {section.listLabel}
                </p>
              )}

              {section.list && (
                <ul className="mb-3 space-y-2">
                  {section.list.map((item, j) => (
                    <li
                      key={j}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.note && (
                <p className="text-muted-foreground/80 border-primary/30 mt-3 border-l-2 pl-4 text-sm leading-relaxed italic">
                  {section.note}
                </p>
              )}
            </div>
          ))}

          {/* Contact */}
          <div>
            <h2 className="text-foreground mb-3 text-lg font-semibold">
              Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, you can contact
              the developer at:{" "}
              <a
                href="mailto:hi@mohamedramadan.dev"
                className="text-primary underline-offset-4 transition-colors hover:underline"
              >
                hi@mohamedramadan.dev
              </a>
            </p>
          </div>

          {/* Contributors section */}
          <div
            id="contributors"
            className="border-border scroll-mt-20 rounded-xl border p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 text-xl">🎙️</span>
              <div>
                <h2 className="text-foreground mb-1 text-lg font-semibold">
                  Voice Contribution Program
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The{" "}
                  <a
                    href="/contribute"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    /contribute
                  </a>{" "}
                  page is an{" "}
                  <strong className="text-foreground">
                    entirely separate, opt-in program
                  </strong>{" "}
                  and operates under a different data policy from the Katheera
                  extension. Participation is voluntary and independent of using
                  the extension.
                </p>
              </div>
            </div>

            <div className="border-border mb-4 rounded-lg border bg-amber-50/60 p-4 dark:bg-amber-900/10">
              <p className="text-foreground text-sm font-medium">
                ⚠️ Unlike the extension — which never sends audio to a server —
                contributing explicitly uploads your voice recordings.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-foreground mb-1 font-medium">
                  What is collected
                </p>
                <ul className="text-muted-foreground space-y-1">
                  {[
                    "Raw audio recordings (your voice clips)",
                    "The text prompt displayed during recording",
                    "Tone variation instruction (e.g. quiet, fast)",
                    "A random session identifier (UUID) generated in your browser — not linked to your identity",
                    "Timestamp of submission",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">
                  What is NOT collected
                </p>
                <ul className="text-muted-foreground space-y-1">
                  {[
                    "No name, email, or account",
                    "No device identifiers or IP address stored",
                    "No browser fingerprinting",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">
                  Storage & access
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Audio files are stored in Supabase (encrypted at rest). Only
                  the project maintainer can access them for review and model
                  training. Files are retained indefinitely so that future
                  improvements to the processing pipeline can be applied to past
                  recordings.
                </p>
              </div>

              <div>
                <p className="text-foreground mb-1 font-medium">
                  Right to withdraw
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Once submitted, recordings cannot be automatically deleted
                  because they are anonymous. If you submitted recordings in
                  error and want them removed, contact{" "}
                  <a
                    href="mailto:hi@mohamedramadan.dev"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    hi@mohamedramadan.dev
                  </a>{" "}
                  with your session's approximate date/time and we will do our
                  best to locate and delete them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* <FooterSection /> */}
    </div>
  );
}
