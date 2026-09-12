// permission.js — mic-permission onboarding gate (static page, no bundler).
// Localizes itself from the persisted `language` setting (shared key with
// the app settings module) with an embedded en/ar dictionary.

const STR = {
  en: {
    dir: "ltr",
    docTitle: "Katheera | Microphone Permission",
    imgAlt: "Katheera mic permission",
    title: "Microphone Access Required",
    body: 'Katheera needs microphone access. Please click the button below and click "<strong>Allow while visiting the site</strong>" in the browser prompt',
    button: "Grant Permission",
    footA: "Your voice is not leaving your browser. ",
    footLink: "Privacy policy",
    granted: "Permission Granted!",
    countdown: (s) =>
      `You can now close this tab. It will close automatically in ${s}s.`,
    denied: "Permission denied. Please try again and click 'Allow'.",
  },
  ar: {
    dir: "rtl",
    docTitle: "كثيرا | إذن الميكروفون",
    imgAlt: "إذن ميكروفون كثيرا",
    title: "السماح بالوصول إلى الميكروفون",
    body: 'تعتمد "كثيرا" على الميكروفون للتعرف على أذكارك تلقائيًا. اضغط الزر أدناه ثم اختر "<strong>السماح</strong>" عند ظهور نافذة المتصفح.',
    button: "منح الإذن",
    footA: "صوتك لا يغادر متصفحك. ",
    footLink: "سياسة الخصوصية",
    granted: "تم منح الإذن!",
    countdown: (s) =>
      `يمكنك الآن إغلاق هذه الصفحة. ستُغلق تلقائيًا بعد ${s} ثوانٍ.`,
    denied: "تعذر تفعيل الميكروفون. يرجى المحاولة مرة أخرى واختيار 'سماح'.",
  },
};

async function loadLocale() {
  try {
    const res = await chrome.storage.local.get(["katheera_settings"]);
    const lang = JSON.parse(res.katheera_settings || "{}").language;
    return lang === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

(async () => {
  const locale = await loadLocale();
  const s = STR[locale];

  document.documentElement.lang = locale;
  document.documentElement.dir = s.dir;
  document.title = s.docTitle;
  document.querySelector("img").alt = s.imgAlt;
  document.querySelector("h1").textContent = s.title;
  document.querySelector("p").innerHTML = s.body;
  document.getElementById("grantButton").textContent = s.button;
  document.querySelector("span").innerHTML =
    `${s.footA}<a href="https://katheera.mohamedramadan.dev/privacy" target="_blank">${s.footLink}</a>`;

  document.getElementById("grantButton").addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      // Permission granted!
      document.querySelector("h1").textContent = s.granted;
      document.querySelector("span").style.display = "none";
      document.getElementById("grantButton").style.display = "none";

      let timeLeft = 3;
      const p = document.querySelector("p");
      const updateText = () => {
        p.textContent = s.countdown(timeLeft);
      };
      updateText();
      const countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          window.close();
        } else {
          updateText();
        }
      }, 1000);

      // Notify background or just close after a delay
      setTimeout(() => {
        window.close();
      }, 3000);
    } catch (err) {
      console.error("Permission denied:", err);
      alert(s.denied);
    }
  });
})();
