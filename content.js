// content.js (Based on Gemini AI feedback for focus and prompt handling)
console.log("Gemini Omnibox - content.js loaded (URL-param/message version).");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Gemini Omnibox (Content) - Message received:", message);
  if (message.type === "NEW_PROMPT" && message.prompt) {
    const promptText = message.prompt; // Already decoded by background script's URLSearchParams
    console.log(`Gemini Omnibox (Content) - Prompt to process: "${promptText}"`);

    // Use a delay to help ensure the page's JavaScript has fully initialized elements
    setTimeout(() => {
      console.log("Gemini Omnibox (Content) - Initial setTimeout fired. Looking for elements...");

      // Selector for the rich text input area.
      // Based on original user-provided HTML: div.ql-editor[data-placeholder="Ask Gemini"]
      // Gemini AI suggestion: div[role="textbox"]
      // Let's try the more specific one first, then fallback.
      let inputElement = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');
      if (!inputElement) {
        console.log("Gemini Omnibox (Content) - Did not find 'div.ql-editor[data-placeholder="Ask Gemini"]'. Trying 'div[role="textbox"]'.");
        inputElement = document.querySelector('div[role="textbox"]');
      }

      if (inputElement) {
        console.log("Gemini Omnibox (Content) - Input element found:", inputElement);

        // Set the text content. For a div acting as a rich text editor,
        // creating a paragraph element or directly setting innerHTML might be more robust.
        // The initial Gemini HTML showed <p><br></p> when empty.
        // Setting textContent is simpler if it works for Gemini's input handler.
        // If complex formatting is needed, innerHTML = `<p>${promptText}</p>` might be better.
        inputElement.innerHTML = `<p>${promptText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`; // Using innerHTML for safety
        console.log("Gemini Omnibox (Content) - Prompt text inserted into input element.");

        // Dispatch events to make the page recognize the input
        inputElement.dispatchEvent(new Event('focus', { bubbles: true })); // Focus before input event
        inputElement.dispatchEvent(new InputEvent('input', { bubbles: true, data: promptText, inputType: 'insertText' }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        // Not blurring here, as focus should remain.

        // Crucially, set the focus on the input element!
        // This should be called *after* text is inserted and events dispatched,
        // as some frameworks might shift focus during input.
        inputElement.focus();
        console.log("Gemini Omnibox (Content) - Called focus() on input element. Active element:", document.activeElement);

        // Selector for the submit button
        const submitButton = document.querySelector('button[aria-label="Send message"]');

        if (submitButton) {
          console.log("Gemini Omnibox (Content) - Submit button found:", submitButton);
          // It's good practice to wait a tick for the UI to update after setting text
          setTimeout(() => {
            console.log("Gemini Omnibox (Content) - Submit button setTimeout fired. Clicking submit.");
            submitButton.click();
            sendResponse({ status: "success", message: "Content script processed prompt and clicked submit." });
          }, 200); // Increased delay slightly for button click
        } else {
          console.error("Gemini Omnibox (Content) - Could not find submit button with selector 'button[aria-label="Send message"]'.");
          sendResponse({ status: "error", message: "Submit button not found." });
        }
      } else {
        console.error("Gemini Omnibox (Content) - Could not find input textbox with tried selectors.");
        sendResponse({ status: "error", message: "Input textbox not found." });
      }
    }, 600); // Increased initial delay slightly for page readiness

    return true; // Indicates you wish to send a response asynchronously
  } else {
    console.log("Gemini Omnibox (Content) - Message received, but not NEW_PROMPT type or no prompt text.", message);
    sendResponse({ status: "error", message: "Invalid message type or no prompt text." });
    return false; // No async response needed
  }
});

console.log("Gemini Omnibox (Content) - Listener set up for NEW_PROMPT messages.");
