// content.js
console.log("Gemini Omnibox - content.js loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Gemini Omnibox - Message received:", request);
  if (request.query) {
    const query = request.query;
    console.log(`Gemini Omnibox - Query to process: "${query}"`);

    const MAX_RETRIES = 20; // Approx 10 seconds (20 * 500ms)
    let attempts = 0;

    const findAndInteract = () => {
      attempts++;
      console.log(`Gemini Omnibox - Attempt ${attempts} to find elements.`);

      // Using the specific div that is contenteditable
      const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');
      // The send button
      const sendButton = document.querySelector('button[aria-label="Send message"]');

      if (promptInputBox && sendButton) {
        console.log("Gemini Omnibox - Prompt input box and send button found.");

        // Set the text
        // For rich text editors (like Quill, which Gemini appears to use based on 'ql-editor'),
        // directly setting innerHTML or textContent might not always trigger underlying event handlers.
        // Setting the text via paragraph ensures it's treated as a block of text.
        promptInputBox.innerHTML = `<p>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`; // Basic sanitization for HTML

        // Dispatch events to simulate user input, which might be necessary for the page to recognize the change
        promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
        promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query, inputType: 'insertText' }));
        promptInputBox.dispatchEvent(new Event('change', { bubbles: true })); // Some frameworks might listen for change
        promptInputBox.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log(`Gemini Omnibox - Query "${query}" entered into prompt box.`);

        // Now, wait for the send button to become enabled
        let buttonEnableAttempts = 0;
        const maxButtonEnableRetries = 10; // Approx 5 seconds (10 * 500ms)

        const clickSendButtonWhenEnabled = () => {
          buttonEnableAttempts++;
          const currentSendButtonState = document.querySelector('button[aria-label="Send message"]'); // Re-query, state might change
          if (currentSendButtonState && !currentSendButtonState.disabled) {
            console.log("Gemini Omnibox - Send button is enabled. Clicking.");
            currentSendButtonState.click();
            sendResponse({ status: "success", message: "Query submitted to Gemini." });
          } else if (buttonEnableAttempts < maxButtonEnableRetries) {
            console.log(`Gemini Omnibox - Send button still disabled. Attempt ${buttonEnableAttempts}/${maxButtonEnableRetries}. Retrying in 500ms.`);
            setTimeout(clickSendButtonWhenEnabled, 500);
          } else {
            console.error("Gemini Omnibox - Send button remained disabled after multiple attempts.");
            sendResponse({ status: "error", message: "Send button remained disabled." });
          }
        };

        clickSendButtonWhenEnabled();

      } else {
        if (attempts < MAX_RETRIES) {
          console.log(`Gemini Omnibox - Elements not found yet. Retrying in 500ms (Attempt ${attempts}/${MAX_RETRIES})`);
          if (!promptInputBox) console.log("Gemini Omnibox - Prompt input (div.ql-editor[data-placeholder='Ask Gemini']) not found.");
          if (!sendButton) console.log("Gemini Omnibox - Send button (button[aria-label='Send message']) not found.");
          setTimeout(findAndInteract, 500);
        } else {
          console.error("Gemini Omnibox - Failed to find prompt input box or send button after multiple retries.");
          if (!promptInputBox) console.error("Gemini Omnibox - Final attempt failed: Prompt input box (div.ql-editor[data-placeholder='Ask Gemini']) was not found.");
          if (!sendButton) console.error("Gemini Omnibox - Final attempt failed: Send button (button[aria-label='Send message']) was not found.");
          sendResponse({ status: "error", message: "Required page elements not found after multiple retries." });
        }
      }
    };

    findAndInteract(); // Start the process

    return true; // Indicates that the response will be sent asynchronously.
  } else {
    console.log("Gemini Omnibox - Message received, but no query found.", request);
    sendResponse({ status: "error", message: "No query provided in the message." });
  }
});
