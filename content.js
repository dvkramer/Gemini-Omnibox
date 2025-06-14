// content.js
console.log("Gemini Omnibox - content.js loaded. Version 9."); // Updated version

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Gemini Omnibox (V9) - Message received:", request);
  if (request.query) {
    const query = request.query;
    console.log(`Gemini Omnibox (V9) - Query to process: "${query}"`);

    const MAX_RETRIES = 20;
    let attempts = 0;

    const findAndInteract = () => {
      attempts++;
      console.log(`Gemini Omnibox (V9) - Attempt ${attempts} to find elements.`);

      const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');
      const sendButtonInitial = document.querySelector('button[aria-label="Send message"]');

      if (promptInputBox && sendButtonInitial) {
        console.log("Gemini Omnibox (V9) - Prompt input box and initial send button found.");
        promptInputBox.innerHTML = `<p>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;

        promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
        promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query, inputType: 'insertText' }));
        promptInputBox.dispatchEvent(new Event('change', { bubbles: true }));
        promptInputBox.dispatchEvent(new Event('blur', { bubbles: true })); // This blur was in V6, keep it.
        console.log(`Gemini Omnibox (V9) - Query "${query}" entered into prompt box.`);

        let buttonEnableAttempts = 0;
        const maxButtonEnableRetries = 15;

        const clickSendButtonWhenEnabled = () => {
          buttonEnableAttempts++;
          const currentSendButton = document.querySelector('button[aria-label="Send message"]');
          const currentSendButtonIcon = document.querySelector('button[aria-label="Send message"] mat-icon[fonticon="send"]');

          if (!currentSendButton) {
            console.error("Gemini Omnibox (V9) - Send button lost from DOM during enable check.");
            sendResponse({ status: "error", message: "V9: Send button disappeared." });
            return;
          }

          const isDisabled = currentSendButton.disabled || currentSendButton.getAttribute('aria-disabled') === 'true';
          console.log(`Gemini Omnibox (V9) - Button enable check attempt ${buttonEnableAttempts}/${maxButtonEnableRetries}. Button disabled: ${isDisabled}. Classes: "${currentSendButton.className}". Aria-disabled: ${currentSendButton.getAttribute('aria-disabled')}`);

          if (!isDisabled) {
            console.log("Gemini Omnibox (V9) - Send button is enabled. Preparing to click.");
            let clickedSuccessfully = false;

            if (currentSendButtonIcon) {
              console.log("Gemini Omnibox (V9) - Attempting to click the send button's mat-icon.");
              try {
                currentSendButtonIcon.click();
                clickedSuccessfully = true;
                console.log("Gemini Omnibox (V9) - mat-icon click attempted.");
              } catch (e) {
                console.error("Gemini Omnibox (V9) - Error clicking mat-icon:", e);
              }
            } else {
              console.log("Gemini Omnibox (V9) - Send button icon not found.");
            }

            if (!clickedSuccessfully) {
              console.log("Gemini Omnibox (V9) - Attempting to click the button itself (fallback or if icon click failed).");
              try {
                currentSendButton.click();
                clickedSuccessfully = true;
                console.log("Gemini Omnibox (V9) - Button click attempted.");
              } catch (e) {
                console.error("Gemini Omnibox (V9) - Error clicking button:", e);
              }
            }

            console.log(`Gemini Omnibox (V9) - Click attempted. clickedSuccessfully: ${clickedSuccessfully}. Proceeding to verification setTimeout.`);

            setTimeout(() => {
              console.log("Gemini Omnibox (V9) - Entered verification setTimeout.");
              const finalButtonState = document.querySelector('button[aria-label="Send message"]');
              if (finalButtonState && (finalButtonState.disabled || finalButtonState.getAttribute('aria-disabled') === 'true')) {
                console.log("Gemini Omnibox (V9) - Send button became disabled after click, assuming submission started.");
                sendResponse({ status: "success", message: "V9: Query submitted (button click initiated and seemed to register)." });
              } else if (finalButtonState) {
                console.warn("Gemini Omnibox (V9) - Send button did NOT become disabled after click.");
                if (clickedSuccessfully) {
                    console.log("Gemini Omnibox (V9) - Attempting robust MouseEvent dispatch as simple click didn't disable button.");
                    try {
                        const event = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                        currentSendButton.dispatchEvent(event);
                        console.log("Gemini Omnibox (V9) - Dispatched robust MouseEvent click.");
                        sendResponse({ status: "pending", message: "V9: Query submission attempted with robust click." });
                    } catch (e_robust) {
                        console.error("Gemini Omnibox (V9) - Error during robust MouseEvent dispatch:", e_robust);
                        sendResponse({ status: "error", message: "V9: Error during robust click dispatch." });
                    }
                } else {
                    console.log("Gemini Omnibox (V9) - Skipping robust click as initial click attempts failed or were not marked successful.");
                    sendResponse({ status: "error", message: "V9: Initial click attempts failed, cannot verify with robust click." });
                }
              } else {
                console.warn("Gemini Omnibox (V9) - Send button not found after click attempt for verification.");
                sendResponse({ status: "error", message: "V9: Send button not found post-click for verification." });
              }
            }, 750);

          } else if (buttonEnableAttempts < maxButtonEnableRetries) {
            console.log(`Gemini Omnibox (V9) - Send button still disabled. Retrying in 500ms.`);
            setTimeout(clickSendButtonWhenEnabled, 500);
          } else {
            console.error("Gemini Omnibox (V9) - Send button remained disabled after multiple attempts.");
            sendResponse({ status: "error", message: "V9: Send button remained disabled." });
          }
        };

        clickSendButtonWhenEnabled();

      } else {
        if (attempts < MAX_RETRIES) {
          console.log(`Gemini Omnibox (V9) - Elements not found yet. Retrying in 500ms (Attempt ${attempts}/${MAX_RETRIES})`);
          if (!promptInputBox) console.log("Gemini Omnibox (V9) - Prompt input (div.ql-editor[data-placeholder='Ask Gemini']) not found this attempt.");
          if (!sendButtonInitial) console.log("Gemini Omnibox (V9) - Initial Send button (button[aria-label='Send message']) not found this attempt.");
          setTimeout(findAndInteract, 500);
        } else {
          console.error("Gemini Omnibox (V9) - Failed to find prompt input box or send button after multiple retries.");
          if (!promptInputBox) console.error("Gemini Omnibox (V9) - Final attempt failed: Prompt input box was not found.");
          if (!sendButtonInitial) console.error("Gemini Omnibox (V9) - Final attempt failed: Initial Send button was not found.");
          sendResponse({ status: "error", message: "V9: Required page elements not found after multiple retries." });
        }
      }
    };

    findAndInteract();
    return true;
  } else {
    console.log("Gemini Omnibox (V9) - Message received, but no query found.");
    sendResponse({ status: "error-v9", message: "V9: No query provided." });
  }
});

console.log("Gemini Omnibox (V9) - Listener set up.");
