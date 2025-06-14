// content.js
console.log("Gemini Omnibox - content.js loaded. Version 7."); // Updated version

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Gemini Omnibox (V7) - Message received:", request);
  if (request.query) {
    const query = request.query;
    console.log(`Gemini Omnibox (V7) - Query to process: "${query}"`);

    const MAX_RETRIES = 20;
    let attempts = 0;

    const findAndInteract = () => {
      attempts++;
      console.log(`Gemini Omnibox (V7) - Attempt ${attempts} to find elements.`);

      const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');
      const sendButtonInitial = document.querySelector('button[aria-label="Send message"]');

      if (promptInputBox && sendButtonInitial) {
        console.log("Gemini Omnibox (V7) - Prompt input box and initial send button found.");
        promptInputBox.innerHTML = `<p>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
        promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query, inputType: 'insertText' }));
        promptInputBox.dispatchEvent(new Event('change', { bubbles: true }));
        promptInputBox.dispatchEvent(new Event('blur', { bubbles: true }));
        console.log(`Gemini Omnibox (V7) - Query "${query}" entered into prompt box.`);

        let buttonEnableAttempts = 0;
        const maxButtonEnableRetries = 15;

        const clickSendButtonWhenEnabled = () => {
          buttonEnableAttempts++;
          const currentSendButton = document.querySelector('button[aria-label="Send message"]');
          const currentSendButtonIcon = document.querySelector('button[aria-label="Send message"] mat-icon[fonticon="send"]');

          if (!currentSendButton) {
            console.error("Gemini Omnibox (V7) - Send button lost from DOM.");
            sendResponse({ status: "error", message: "V7: Send button disappeared." });
            return;
          }

          const isDisabled = currentSendButton.disabled || currentSendButton.getAttribute('aria-disabled') === 'true';
          console.log(`Gemini Omnibox (V7) - Button enable check ${buttonEnableAttempts}/${maxButtonEnableRetries}. Disabled: ${isDisabled}`);

          if (!isDisabled) {
            console.log("Gemini Omnibox (V7) - Send button enabled. Preparing to click.");
            let clickedSuccessfully = false;

            if (currentSendButtonIcon) {
              console.log("Gemini Omnibox (V7) - Clicking mat-icon.");
              try {
                currentSendButtonIcon.click();
                clickedSuccessfully = true;
                console.log("Gemini Omnibox (V7) - mat-icon click attempted.");
              } catch (e) { console.error("Gemini Omnibox (V7) - Error clicking mat-icon:", e); }
            }

            if (!clickedSuccessfully) {
              console.log("Gemini Omnibox (V7) - Clicking button itself.");
              try {
                currentSendButton.click();
                clickedSuccessfully = true;
                console.log("Gemini Omnibox (V7) - Button click attempted.");
              } catch (e) { console.error("Gemini Omnibox (V7) - Error clicking button:", e); }
            }

            console.log(`Gemini Omnibox (V7) - Click attempted. Success: ${clickedSuccessfully}. Verifying...`);

            setTimeout(() => {
              console.log("Gemini Omnibox (V7) - Entered verification setTimeout.");
              const finalButtonState = document.querySelector('button[aria-label="Send message"]');
              let submissionRegistered = false;

              if (finalButtonState && (finalButtonState.disabled || finalButtonState.getAttribute('aria-disabled') === 'true')) {
                console.log("Gemini Omnibox (V7) - Send button disabled post-click. Submission likely started.");
                sendResponse({ status: "success", message: "V7: Query submitted (button disabled)." });
                submissionRegistered = true;
              } else if (finalButtonState) {
                console.warn("Gemini Omnibox (V7) - Send button NOT disabled post-click.");
                if (clickedSuccessfully) {
                    console.log("Gemini Omnibox (V7) - Attempting robust MouseEvent.");
                    try {
                        const event = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                        currentSendButton.dispatchEvent(event);
                        console.log("Gemini Omnibox (V7) - Dispatched robust click.");
                        sendResponse({ status: "pending", message: "V7: Robust click dispatched." });
                        submissionRegistered = true; // Assume it worked for focus purposes
                    } catch (e_robust) {
                        console.error("Gemini Omnibox (V7) - Error robust dispatch:", e_robust);
                        sendResponse({ status: "error", message: "V7: Robust click error." });
                    }
                } else {
                    sendResponse({ status: "error", message: "V7: Initial clicks failed." });
                }
              } else {
                sendResponse({ status: "error", message: "V7: Send button not found post-click." });
              }

              // --- SHIFT FOCUS ---
              if (submissionRegistered) {
                console.log("Gemini Omnibox (V7) - Attempting to shift focus to page.");
                setTimeout(() => { // Slight delay for focus shift
                    const mainInput = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');
                    if (mainInput) {
                        mainInput.focus();
                        console.log("Gemini Omnibox (V7) - Focused main input area.");
                    } else {
                        document.body.focus();
                        console.log("Gemini Omnibox (V7) - Focused document body.");
                    }
                }, 100); // 100ms delay after submission registered
              }
              // --- END SHIFT FOCUS ---

            }, 750);

          } else if (buttonEnableAttempts < maxButtonEnableRetries) {
            setTimeout(clickSendButtonWhenEnabled, 500);
          } else {
            console.error("Gemini Omnibox (V7) - Button remained disabled.");
            sendResponse({ status: "error", message: "V7: Button remained disabled." });
          }
        };
        clickSendButtonWhenEnabled();
      } else {
        if (attempts < MAX_RETRIES) {
          setTimeout(findAndInteract, 500);
        } else {
          sendResponse({ status: "error", message: "V7: Elements not found." });
        }
      }
    };
    findAndInteract();
    return true;
  } else {
    sendResponse({ status: "error-v7", message: "V7: No query." });
  }
});
console.log("Gemini Omnibox (V7) - Listener set up.");
