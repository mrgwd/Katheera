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
        <div className="mb-12">
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
        <div className="border-border mb-12 border-t" />

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <div key={i}>
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
        </div>
      </main>

      {/* <FooterSection /> */}
    </div>
  );
}
