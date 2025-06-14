// background.js

// Store the query globally to pass it to the content script
let userQuery = '';

// Listen for omnibox input
chrome.omnibox.onInputEntered.addListener((text) => {
  userQuery = text;
  const geminiUrl = `https://gemini.google.com/`;
  chrome.tabs.create({ url: geminiUrl });
});

// Listen for tab updates to inject the content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('https://gemini.google.com')) {
    // Ensure userQuery is available and the script hasn't been injected multiple times rapidly
    if (userQuery) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).then(() => {
        console.log("Content script injected.");
        // Send the query to the content script
        setTimeout(() => { // Adding a small delay to ensure content script is ready
          chrome.tabs.sendMessage(tabId, { query: userQuery }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError.message);
            } else {
              console.log("Message sent to content script, response:", response);
            }
          });
          userQuery = ''; // Clear the query after sending
        }, 500);
      }).catch(err => console.error("Failed to inject content script:", err));
    }
  }
});
