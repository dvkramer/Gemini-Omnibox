// content.js
console.log("Gemini Omnibox - content.js loaded. Version 5-debug.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Gemini Omnibox (V5-debug) - Message received:", request);
  if (request.query) {
    console.log(`Gemini Omnibox (V5-debug) - Query received: "${request.query}"`);
    // Intentionally not doing anything with the DOM yet.
    sendResponse({ status: "success-debug", message: "V5-debug received query." });
  } else {
    console.log("Gemini Omnibox (V5-debug) - Message received, but no query found.");
    sendResponse({ status: "error-debug", message: "V5-debug: No query provided." });
  }
  return true; // Keep channel open for async response, though not strictly needed here.
});

console.log("Gemini Omnibox - content.js (V5-debug) - Listener set up.");
