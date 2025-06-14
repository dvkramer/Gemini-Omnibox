// background.js
console.log("Background script loaded. (Current Tab Nav Version + Re-activate Attempt)");

let pendingQuery = null;
let targetTabId = null;

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  console.log(`Omnibox input entered: ${text}, disposition: ${disposition}`);
  pendingQuery = text; // Storing query for content script
  const geminiUrl = `https://gemini.google.com/`;

  switch (disposition) {
    case "currentTab":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const currentTab = tabs[0];
          targetTabId = currentTab.id;
          console.log(`Updating current tab ${targetTabId} to Gemini. Pending query: ${pendingQuery}`);
          chrome.tabs.update(targetTabId, { url: geminiUrl }, (updatedTab) => {
            if (chrome.runtime.lastError) {
              console.error(`Error updating tab ${targetTabId} to ${geminiUrl}: ${chrome.runtime.lastError.message}`);
              pendingQuery = null;
              targetTabId = null;
            } else if (updatedTab) {
              console.log(`Tab ${updatedTab.id} URL update initiated to ${geminiUrl}.`);
            } else {
              console.warn(`Tab update to ${geminiUrl} (currentTab) called back without an updatedTab object.`);
            }
          });
        } else {
          console.error("No active tab found to update for currentTab disposition.");
          pendingQuery = null; // Clear pending query if no tab to update
        }
      });
      break;
    case "newForegroundTab":
      console.log(`Opening Gemini in new foreground tab. Pending query: ${pendingQuery}`);
      chrome.tabs.create({ url: geminiUrl, active: true }, (newTab) => {
        if (chrome.runtime.lastError) {
          console.error(`Error creating new foreground tab for ${geminiUrl}: ${chrome.runtime.lastError.message}`);
          pendingQuery = null;
        } else if (newTab) {
          targetTabId = newTab.id;
          console.log(`Created new foreground tab ${newTab.id} for Gemini. Target ID set.`);
        } else {
           console.warn(`Tab creation (newForegroundTab) for ${geminiUrl} called back without a newTab object.`);
        }
      });
      break;
    case "newBackgroundTab":
      console.log(`Opening Gemini in new background tab. Pending query: ${pendingQuery}`);
      chrome.tabs.create({ url: geminiUrl, active: false }, (newTab) => {
        if (chrome.runtime.lastError) {
          console.error(`Error creating new background tab for ${geminiUrl}: ${chrome.runtime.lastError.message}`);
          pendingQuery = null;
        } else if (newTab) {
          targetTabId = newTab.id;
          console.log(`Created new background tab ${newTab.id} for Gemini. Target ID set.`);
        } else {
          console.warn(`Tab creation (newBackgroundTab) for ${geminiUrl} called back without a newTab object.`);
        }
      });
      break;
    default:
      console.log(`Unhandled disposition: ${disposition}. Defaulting to current tab behavior.`);
      // Fallback to current tab logic or handle error
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          targetTabId = tabs[0].id;
          chrome.tabs.update(targetTabId, { url: geminiUrl });
        } else {
          console.error("No active tab found for default disposition.");
          pendingQuery = null;
        }
      });
      break;
  }
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
