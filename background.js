// background.js
console.log("Background script loaded. (Current Tab Nav Version)");

let pendingQuery = null;
let targetTabId = null; // To store the ID of the tab we are updating

chrome.omnibox.onInputEntered.addListener((text) => {
  console.log(`Omnibox input entered: ${text}`);
  pendingQuery = text;
  const geminiUrl = `https://gemini.google.com/`;

  // Get the current active tab to update it
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const currentTab = tabs[0];
      targetTabId = currentTab.id;
      console.log(`Updating current tab ${targetTabId} to Gemini. Pending query: ${pendingQuery}`);
      chrome.tabs.update(targetTabId, { url: geminiUrl }, (updatedTab) => {
        if (chrome.runtime.lastError) {
          console.error(`Error updating tab: ${chrome.runtime.lastError.message}`);
          // Reset pending states if tab update fails
          pendingQuery = null;
          targetTabId = null;
        } else {
          // Note: The chrome.tabs.onUpdated listener will handle injecting the script
          // once this updated tab finishes loading the Gemini URL.
          console.log(`Tab ${updatedTab.id} update initiated to ${geminiUrl}.`);
        }
      });
    } else {
      console.error("No active tab found to update.");
      // If no active tab, perhaps fallback to creating a new tab or handle error
      // For now, just log and clear pending state
      pendingQuery = null;
      targetTabId = null;
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === targetTabId && changeInfo.status === 'complete' && tab.url && tab.url.startsWith('https://gemini.google.com/')) {
    console.log(`Tab ${tabId} updated and complete. URL: ${tab.url}`);
    if (pendingQuery) {
      console.log(`Attempting to inject content script into tab ${tabId} for query: "${pendingQuery}"`);
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).then(() => {
        console.log(`Successfully injected content.js into tab ${tabId}.`);
        setTimeout(() => {
          console.log(`Sending message to tab ${tabId} with query: "${pendingQuery}"`);
          chrome.tabs.sendMessage(tabId, { query: pendingQuery }, (response) => {
            if (chrome.runtime.lastError) {
              console.error(`Error sending message to content script in tab ${tabId}: ${chrome.runtime.lastError.message}`);
            } else {
              console.log(`Response from content script in tab ${tabId}:`, response);
            }
          });
          pendingQuery = null;
          targetTabId = null;
        }, 1000);
      }).catch(err => {
        console.error(`Failed to inject content script into tab ${tabId}:`, err);
        pendingQuery = null;
        targetTabId = null;
      });
    } else {
      // This condition might be met if the user manually navigates the target tab to Gemini
      // or if the tab reloads after the query has been processed.
      console.log(`Tab ${tabId} (our target) completed loading Gemini, but no pending query, or query already processed.`);
    }
  } else if (tabId === targetTabId && tab.url && !tab.url.startsWith('https://gemini.google.com/')) {
    // If our target tab navigates away from Gemini before we could inject.
    console.log(`Target tab ${tabId} navigated away from Gemini. Clearing pending query.`);
    pendingQuery = null;
    targetTabId = null;
  }
});
