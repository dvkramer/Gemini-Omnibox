// content.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.query) {
    const query = request.query;
    console.log("Query received in content script:", query);

    // Function to find elements and interact with them
    const interactWithPage = () => {
      // More specific selector for the input area's editable div
      const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');
      // Selector for the send button
      const sendButton = document.querySelector('button[aria-label="Send message"]');

      if (promptInputBox && sendButton) {
        // Check if the button is disabled
        if (sendButton.disabled) {
          // If the button is disabled, it usually means the input box is empty or there's an ongoing action.
          // We will directly set the text and then try to enable the button or wait for it to be enabled.
          promptInputBox.innerHTML = `<p>${query}</p>`; // Set the text using innerHTML as it's a rich text editor

          // Dispatch input events to simulate user typing, which might enable the button
          promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
          promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query }));
          promptInputBox.dispatchEvent(new Event('blur', { bubbles: true }));

          console.log("Query entered into prompt box:", query);

          // Re-check the button state after a short delay, as Angular might take time to update
          setTimeout(() => {
            const updatedSendButton = document.querySelector('button[aria-label="Send message"]'); // Re-query the button
            if (updatedSendButton && !updatedSendButton.disabled) {
              updatedSendButton.click();
              console.log("Submit button clicked.");
              sendResponse({ status: "success", message: "Query submitted" });
            } else if (updatedSendButton && updatedSendButton.disabled) {
              console.error("Submit button is still disabled after attempting to input text.");
              sendResponse({ status: "error", message: "Submit button remained disabled." });
            } else {
               console.error("Submit button not found after delay.");
               sendResponse({ status: "error", message: "Submit button not found after delay." });
            }
          }, 1000); // Increased delay to allow for UI updates
        } else {
          // If button is already enabled (e.g., if there's already text or it doesn't disable)
          promptInputBox.innerHTML = `<p>${query}</p>`;
          promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
          promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query }));
          promptInputBox.dispatchEvent(new Event('blur', { bubbles: true }));
          console.log("Query entered into prompt box (button was enabled):", query);
          sendButton.click();
          console.log("Submit button clicked (button was enabled).");
          sendResponse({ status: "success", message: "Query submitted" });
        }
      } else {
        if (!promptInputBox) {
          console.error("Prompt input box not found with selector 'div.ql-editor[data-placeholder="Ask Gemini"]'.");
        }
        if (!sendButton) {
          console.error("Send button not found with selector 'button[aria-label="Send message"]'.");
        }
        sendResponse({ status: "error", message: "Required elements not found on the page." });
      }
    };

    // Wait for the page to be fully loaded, or at least for the relevant elements
    // Using a MutationObserver to wait for the specific elements to appear if they are not immediately available.
    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');
      const sendButton = document.querySelector('button[aria-label="Send message"]');
      if (promptInputBox && sendButton) {
        observerInstance.disconnect(); // Stop observing once elements are found
        interactWithPage();
      }
    });

    // Start observing the document body for added nodes
    observer.observe(document.body, { childList: true, subtree: true });

    // Also try to interact immediately in case the elements are already there
    interactWithPage();

    return true; // Indicates that the response will be sent asynchronously
  }
});

console.log("Gemini content script loaded and listening for messages.");
