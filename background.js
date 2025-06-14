// background.js (Based on Gemini AI feedback for focus and prompt handling)
console.log("Gemini Omnibox - background.js loaded (URL-param version).");

// Listen for the user to press "Enter" in the omnibox
chrome.omnibox.onInputEntered.addListener((text) => {
  console.log(`Gemini Omnibox (Background) - Omnibox input: '${text}'`);
  // Encode the user's prompt to be safely used in a URL
  const prompt = encodeURIComponent(text);
  const newURL = `https://gemini.google.com/app?prompt=${prompt}`;
  console.log(`Gemini Omnibox (Background) - New URL: ${newURL}`);

  // Get the current tab to update its URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        console.log(`Gemini Omnibox (Background) - Updating tab ID: ${activeTab.id}`);
        chrome.tabs.update(activeTab.id, { url: newURL }, (updatedTab) => {
          if (chrome.runtime.lastError) {
            console.error(`Gemini Omnibox (Background) - Error updating tab: ${chrome.runtime.lastError.message}`);
          } else {
            console.log(`Gemini Omnibox (Background) - Tab update initiated for tab ID: ${updatedTab ? updatedTab.id : 'unknown'}.`);
          }
        });
      } else {
        console.error("Gemini Omnibox (Background) - Could not get active tab ID.");
      }
    } else {
      console.error("Gemini Omnibox (Background) - No active tab found.");
    }
  });
});

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab has finished loading and the URL is the one we want
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('https://gemini.google.com/app')) {
    console.log(`Gemini Omnibox (Background) - Tab ${tabId} updated and complete. URL: ${tab.url}`);
    const url = new URL(tab.url);
    const promptFromParam = url.searchParams.get('prompt');

    // Only run the script if our special "prompt" parameter exists
    if (promptFromParam) {
      console.log(`Gemini Omnibox (Background) - Prompt parameter found: '${promptFromParam}'. Injecting content script into tab ${tabId}.`);
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }, (injectionResults) => {
        if (chrome.runtime.lastError) {
            console.error(`Gemini Omnibox (Background) - Error injecting script: ${chrome.runtime.lastError.message}`);
            return;
        }
        if (!injectionResults || injectionResults.length === 0 || !injectionResults[0].result) {
            // This check is more for file-based injection results, but good to be cautious
            console.log("Gemini Omnibox (Background) - Content script injected (or already present). Proceeding to send message.");
        } else {
            console.log("Gemini Omnibox (Background) - Content script injected successfully. Result:", injectionResults);
        }

        // After injecting the script, send the prompt to it
        // A small delay can sometimes help ensure the content script's listener is ready,
        // though with executeScript's callback it should be fine.
        setTimeout(() => {
            console.log(`Gemini Omnibox (Background) - Sending NEW_PROMPT message to tab ${tabId} with prompt: '${promptFromParam}'`);
            chrome.tabs.sendMessage(tabId, {
              type: "NEW_PROMPT",
              prompt: promptFromParam // Send the decoded prompt from URL param
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error(`Gemini Omnibox (Background) - Error sending message: ${chrome.runtime.lastError.message}. This might happen if the content script didn't load or its listener isn't set up correctly.`);
              } else {
                console.log(`Gemini Omnibox (Background) - Response from content script:`, response);
              }
            });
        }, 100); // 100ms delay as a precaution
      });
    } else {
      console.log(`Gemini Omnibox (Background) - Tab ${tabId} is Gemini, but no 'prompt' URL parameter found.`);
    }
  }
});
