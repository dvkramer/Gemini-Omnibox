// background.js
console.log("Background script loaded.");

// Store the query and the tab ID to ensure message is sent to the correct tab
let pendingQuery = null;
let targetTabId = null;

chrome.omnibox.onInputEntered.addListener((text) => {
  console.log(`Omnibox input entered: ${text}`);
  pendingQuery = text;
  const geminiUrl = `https://gemini.google.com/`;
  chrome.tabs.create({ url: geminiUrl }, (tab) => {
    targetTabId = tab.id;
    console.log(`Created tab ${targetTabId} for Gemini. Pending query: ${pendingQuery}`);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if this is the tab we opened and if it's fully loaded
  if (tabId === targetTabId && changeInfo.status === 'complete' && tab.url && tab.url.startsWith('https://gemini.google.com/')) {
    console.log(`Tab ${tabId} updated and complete. URL: ${tab.url}`);
    if (pendingQuery) {
      console.log(`Attempting to inject content script into tab ${tabId} for query: "${pendingQuery}"`);
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).then(() => {
        console.log(`Successfully injected content.js into tab ${tabId}.`);
        // Send the query to the content script after a short delay
        setTimeout(() => {
          console.log(`Sending message to tab ${tabId} with query: "${pendingQuery}"`);
          chrome.tabs.sendMessage(tabId, { query: pendingQuery }, (response) => {
            if (chrome.runtime.lastError) {
              console.error(`Error sending message to content script in tab ${tabId}: ${chrome.runtime.lastError.message}`);
            } else {
              console.log(`Response from content script in tab ${tabId}:`, response);
            }
          });
          pendingQuery = null; // Clear the query after attempting to send
          targetTabId = null; // Clear the target tab ID
        }, 1000); // Delay to give content script time to set up listener
      }).catch(err => {
        console.error(`Failed to inject content script into tab ${tabId}:`, err);
        pendingQuery = null; // Clear query if injection fails
        targetTabId = null;
      });
    } else {
      console.log(`Tab ${tabId} loaded, but no pending query or targetTabId does not match.`);
    }
  }
});
