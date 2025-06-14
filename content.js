// content.js
console.log("Gemini Omnibox - content.js loaded. Version 6."); // Updated version

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Gemini Omnibox (V6) - Message received:", request);
  if (request.query) {
    const query = request.query;
    console.log(`Gemini Omnibox (V6) - Query to process: "${query}"`);

    // --- Start of V4 DOM interaction logic ---
    const MAX_RETRIES = 20; // Approx 10 seconds (20 * 500ms)
    let attempts = 0;

    const findAndInteract = () => {
      attempts++;
      console.log(`Gemini Omnibox (V6) - Attempt ${attempts} to find elements.`);

      const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');
      const sendButtonInitial = document.querySelector('button[aria-label="Send message"]'); // Query for button at start

      if (promptInputBox && sendButtonInitial) {
        console.log("Gemini Omnibox (V6) - Prompt input box and initial send button found.");
        // Sanitize query for HTML injection
        promptInputBox.innerHTML = `<p>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;

        // Dispatch events to simulate user input
        promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
        promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query, inputType: 'insertText' }));
        promptInputBox.dispatchEvent(new Event('change', { bubbles: true }));
        promptInputBox.dispatchEvent(new Event('blur', { bubbles: true }));
        console.log(`Gemini Omnibox (V6) - Query "${query}" entered into prompt box.`);

        let buttonEnableAttempts = 0;
        const maxButtonEnableRetries = 15; // Approx 7.5 seconds

        const clickSendButtonWhenEnabled = () => {
          buttonEnableAttempts++;
          // Re-query elements in case the button gets re-rendered
          const currentSendButton = document.querySelector('button[aria-label="Send message"]');
          const currentSendButtonIcon = document.querySelector('button[aria-label="Send message"] mat-icon[fonticon="send"]');

          if (!currentSendButton) {
            console.error("Gemini Omnibox (V6) - Send button lost from DOM during enable check.");
            sendResponse({ status: "error", message: "V6: Send button disappeared." });
            return;
          }

          const isDisabled = currentSendButton.disabled || currentSendButton.getAttribute('aria-disabled') === 'true';
          console.log(`Gemini Omnibox (V6) - Button enable check attempt ${buttonEnableAttempts}/${maxButtonEnableRetries}. Button disabled: ${isDisabled}. Classes: "${currentSendButton.className}". Aria-disabled: ${currentSendButton.getAttribute('aria-disabled')}`);

          if (!isDisabled) {
            console.log("Gemini Omnibox (V6) - Send button is enabled. Preparing to click.");
            let clickedSuccessfully = false;

            if (currentSendButtonIcon) {
              console.log("Gemini Omnibox (V6) - Attempting to click the send button's mat-icon.");
              try {
                currentSendButtonIcon.click();
                clickedSuccessfully = true;
                console.log("Gemini Omnibox (V6) - mat-icon click attempted.");
              } catch (e) {
                console.error("Gemini Omnibox (V6) - Error clicking mat-icon:", e);
              }
            } else {
              console.log("Gemini Omnibox (V6) - Send button icon not found.");
            }

            if (!clickedSuccessfully) {
              console.log("Gemini Omnibox (V6) - Attempting to click the button itself (fallback or if icon click failed).");
              try {
                currentSendButton.click();
                clickedSuccessfully = true;
                console.log("Gemini Omnibox (V6) - Button click attempted.");
              } catch (e) {
                console.error("Gemini Omnibox (V6) - Error clicking button:", e);
              }
            }

            console.log(`Gemini Omnibox (V6) - Click attempted. clickedSuccessfully: ${clickedSuccessfully}. Proceeding to verification setTimeout.`);

            // Verification step
            setTimeout(() => {
              console.log("Gemini Omnibox (V6) - Entered verification setTimeout.");
              const finalButtonState = document.querySelector('button[aria-label="Send message"]');
              if (finalButtonState && (finalButtonState.disabled || finalButtonState.getAttribute('aria-disabled') === 'true')) {
                console.log("Gemini Omnibox (V6) - Send button became disabled after click, assuming submission started.");
                sendResponse({ status: "success", message: "V6: Query submitted (button click initiated and seemed to register)." });
              } else if (finalButtonState) {
                console.warn("Gemini Omnibox (V6) - Send button did NOT become disabled after click.");
                if (clickedSuccessfully) {
                    console.log("Gemini Omnibox (V6) - Attempting robust MouseEvent dispatch as simple click didn't disable button.");
                    try {
                        const event = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                        currentSendButton.dispatchEvent(event); // Dispatch on the main button
                        console.log("Gemini Omnibox (V6) - Dispatched robust MouseEvent click.");
                        sendResponse({ status: "pending", message: "V6: Query submission attempted with robust click." });
                    } catch (e_robust) {
                        console.error("Gemini Omnibox (V6) - Error during robust MouseEvent dispatch:", e_robust);
                        sendResponse({ status: "error", message: "V6: Error during robust click dispatch." });
                    }
                } else {
                    console.log("Gemini Omnibox (V6) - Skipping robust click as initial click attempts failed or were not marked successful.");
                    sendResponse({ status: "error", message: "V6: Initial click attempts failed, cannot verify with robust click." });
                }
              } else {
                console.warn("Gemini Omnibox (V6) - Send button not found after click attempt for verification.");
                sendResponse({ status: "error", message: "V6: Send button not found post-click for verification." });
              }
            }, 750);

          } else if (buttonEnableAttempts < maxButtonEnableRetries) {
            console.log(`Gemini Omnibox (V6) - Send button still disabled. Retrying in 500ms.`);
            setTimeout(clickSendButtonWhenEnabled, 500);
          } else {
            console.error("Gemini Omnibox (V6) - Send button remained disabled after multiple attempts.");
            sendResponse({ status: "error", message: "V6: Send button remained disabled." });
          }
        };

        clickSendButtonWhenEnabled(); // Start the click process

      } else { // if promptInputBox or sendButtonInitial not found
        if (attempts < MAX_RETRIES) {
          console.log(`Gemini Omnibox (V6) - Elements not found yet. Retrying in 500ms (Attempt ${attempts}/${MAX_RETRIES})`);
          if (!promptInputBox) console.log("Gemini Omnibox (V6) - Prompt input (div.ql-editor[data-placeholder='Ask Gemini']) not found this attempt.");
          if (!sendButtonInitial) console.log("Gemini Omnibox (V6) - Initial Send button (button[aria-label='Send message']) not found this attempt.");
          setTimeout(findAndInteract, 500);
        } else {
          console.error("Gemini Omnibox (V6) - Failed to find prompt input box or send button after multiple retries.");
          if (!promptInputBox) console.error("Gemini Omnibox (V6) - Final attempt failed: Prompt input box was not found.");
          if (!sendButtonInitial) console.error("Gemini Omnibox (V6) - Final attempt failed: Initial Send button was not found.");
          sendResponse({ status: "error", message: "V6: Required page elements not found after multiple retries." });
        }
      }
    }; // End of findAndInteract

    findAndInteract(); // Start the find and interact process
    // --- End of V4 DOM interaction logic ---

    return true; // Indicates that the response will be sent asynchronously.
  } else { // if !request.query
    console.log("Gemini Omnibox (V6) - Message received, but no query found.");
    sendResponse({ status: "error-v6", message: "V6: No query provided." });
  }
});

console.log("Gemini Omnibox (V6) - Listener set up."); // Log that listener setup is complete
