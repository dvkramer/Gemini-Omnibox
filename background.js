// background.js
console.log("Background script loaded. (Current Tab Nav Version + Re-activate Attempt)");

let pendingQuery = null;
let targetTabId = null;

chrome.omnibox.onInputEntered.addListener((text) => {
  console.log(`Omnibox input entered: ${text}`);
  pendingQuery = text;
  const geminiUrl = `https://gemini.google.com/`;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const currentTab = tabs[0];
      targetTabId = currentTab.id;
      console.log(`Updating current tab ${targetTabId} to Gemini. Pending query: ${pendingQuery}`);

      chrome.tabs.update(targetTabId, { url: geminiUrl }, (updatedTab) => {
        if (chrome.runtime.lastError) {
          console.error(`Error updating tab to ${geminiUrl}: ${chrome.runtime.lastError.message}`);
          pendingQuery = null;
          targetTabId = null;
        } else {
          if (updatedTab) { // updatedTab might be undefined if error occurred (though lastError should catch it)
            console.log(`Tab ${updatedTab.id} URL update initiated to ${geminiUrl}. Attempting to re-activate.`);
            // Attempt to explicitly re-activate the tab
            chrome.tabs.update(updatedTab.id, { active: true }, () => {
              if (chrome.runtime.lastError) {
                console.error(`Error re-activating tab ${updatedTab.id}: ${chrome.runtime.lastError.message}`);
              } else {
                console.log(`Gemini Omnibox (Background) - Attempted to re-activate tab ${updatedTab.id} after URL update.`);
              }
            });
          } else {
            // This case should ideally be caught by chrome.runtime.lastError, but as a fallback:
             console.warn(`Tab update to ${geminiUrl} called back without an updatedTab object.`);
          }
        }
      });
    } else {
      console.error("No active tab found to update.");
      pendingQuery = null;
      targetTabId = null;
    }
  });
});

// The chrome.tabs.onUpdated listener remains the same as in "Current Tab Nav Version"
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
      console.log(`Tab ${tabId} (our target) completed loading Gemini, but no pending query, or query already processed.`);
    }
  } else if (tabId === targetTabId && changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('https://gemini.google.com/')) {
    // Added 'changeInfo.status === 'complete'' here to avoid premature clearing if just the URL changes during loading
    console.log(`Target tab ${tabId} navigated away from Gemini (URL: ${tab.url}). Clearing pending query.`);
    pendingQuery = null;
    targetTabId = null;
  }
});
