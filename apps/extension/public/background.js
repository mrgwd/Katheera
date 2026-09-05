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
const BADGE_COLOR = "#368c39ff";

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

// Function to close the offscreen document if one exists
async function closeOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });

  if (existingContexts.length > 0) {
    await chrome.offscreen.closeDocument();
    console.log("Offscreen document closed.");
  }
}

// Mic lifecycle state — tracks the REAL stream state reported by the
// offscreen document (micStarted/micError), not just whether the document
// exists. checkMicStatus/startMic responses are based on this.
let micState = "idle"; // "idle" | "starting" | "active" | "error"
let micErrorMessage = "";
let pendingStarts = [];
const START_TIMEOUT_MS = 20000;

function flushPendingStarts(response) {
  const pending = pendingStarts;
  pendingStarts = [];
  pending.forEach((sendResponse) => {
    try {
      sendResponse(response);
    } catch {
      // Receiver (popup) is gone — nothing to do.
    }
  });
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
    if (micState === "active") {
      sendResponse({ success: true });
      return false;
    }

    pendingStarts.push(sendResponse);

    if (micState !== "starting") {
      micState = "starting";
      micErrorMessage = "";
      // Always start fresh: close a stale document first so a half-open
      // mic (e.g. after a service worker restart) can't linger.
      closeOffscreenDocument()
        .catch(() => {})
        .then(() => setupOffscreenDocument())
        .then(() => {
          setTimeout(() => {
            if (micState === "starting") {
              micState = "error";
              micErrorMessage = "Microphone did not start in time.";
              updateIcon(false);
              flushPendingStarts({ success: false, error: micErrorMessage });
            }
          }, START_TIMEOUT_MS);
        })
        .catch((err) => {
          micState = "error";
          micErrorMessage = err.message;
          flushPendingStarts({ success: false, error: err.message });
        });
    }

    // Return true to indicate we will send a response asynchronously
    return true;
  } else if (request.action === "micStarted") {
    // Sent by the offscreen document once getUserMedia + worklet are live.
    micState = "active";
    micErrorMessage = "";
    updateIcon(true);
    flushPendingStarts({ success: true });
    return false;
  } else if (request.action === "micError") {
    // Sent by the offscreen document when the mic fails to start.
    micState = "error";
    micErrorMessage = request.error || "Failed to access microphone.";
    updateIcon(false);
    flushPendingStarts({ success: false, error: micErrorMessage });
    return false;
  } else if (request.action === "checkMicStatus") {
    // Report the tracked stream state, not just document existence.
    const isActive = micState === "active";
    updateIcon(isActive);
    if (!isActive) {
      updateBadge(""); // Clear badge if inactive
    }
    sendResponse({ isActive, error: micErrorMessage || undefined });
    return false;
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
    return false;
  } else if (request.action === "stopMic") {
    // Stop the process. Already-stopped counts as success — the desired
    // end state (silent mic) is what matters, not how we got there.
    console.log("Received stopMic message");
    micState = "idle";
    micErrorMessage = "";
    flushPendingStarts({ success: false, error: "Stopped." });
    closeOffscreenDocument()
      .catch(() => {})
      .then(() => {
        updateIcon(false);
        updateBadge(""); // Clear badge on stop
        sendResponse({ success: true });
      });
    return true;
  }
  return false;
});


