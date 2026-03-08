// This is the background service worker

// Path to the offscreen document
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

// Icon paths
const ICONS = {
  default: {
    16: "icons/default16.png",
    32: "icons/default32.png",
  },
  listening: {
    16: "icons/listening16.png",
    32: "icons/listening32.png",
  },
};

// Badge background color (Zikr Green)
const BADGE_COLOR = "#4CAF50";

// Set initial badge background color
chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });

// Function to update extension icon
async function updateIcon(isListening) {
  const path = isListening ? ICONS.listening : ICONS.default;
  await chrome.action.setIcon({ path });
}

// Function to update badge text
function updateBadge(text) {
  chrome.action.setBadgeText({ text: text || "" });
}

// Function to setup the offscreen document
async function setupOffscreenDocument() {
  // Check if an offscreen document is already active
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });

  if (existingContexts.length > 0) {
    console.log("Offscreen document already exists.");
    return;
  }

  // Create the offscreen document
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["USER_MEDIA"],
    justification: "To capture microphone audio for keyword spotting.",
  });
  console.log("Offscreen document created.");
}

// Listen for messages from the popup or offscreen document
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startMic") {
    // Start the process
    console.log("Received startMic message");
    setupOffscreenDocument()
      .then(() => {
        updateIcon(true);
        sendResponse({ success: true });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });

    // Return true to indicate we will send a response asynchronously
    return true;
  } else if (request.action === "checkMicStatus") {
    // Check if the offscreen document is open
    chrome.runtime
      .getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
      })
      .then((contexts) => {
        const isActive = contexts.length > 0;
        updateIcon(isActive);
        if (!isActive) {
          updateBadge(""); // Clear badge if inactive
        }
        sendResponse({ isActive });
      });
    return true;
  } else if (request.action === "wordDetected") {
    console.log("Word detected in background:", request.word);
    const word = request.word;

    // Update storage
    chrome.storage.local.get([word], (result) => {
      const newCount = (result[word] || 0) + 1;
      chrome.storage.local.set({ [word]: newCount }, () => {
        // Update the badge with the new count (last detected)
        updateBadge(newCount.toString());
      });
    });
  } else if (request.action === "stopMic") {
    // Stop the process
    console.log("Received stopMic message");
    chrome.runtime
      .getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
      })
      .then((contexts) => {
        if (contexts.length > 0) {
          chrome.offscreen.closeDocument();
          updateIcon(false);
          updateBadge(""); // Clear badge on stop
          sendResponse({ success: true });
        } else {
          sendResponse({
            success: false,
            error: "Offscreen document not found.",
          });
        }
      });
    return true;
  }
});


