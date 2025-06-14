// content.js
// Version: URL Reader + Robust Submission (Warning Removed)
console.log("Gemini Omnibox - content.js (URL Reader, V10 Logic - No Warning) loaded.");

const processQueryFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query || query.trim() === "") {
        console.log("No valid 'q' parameter in URL. Halting.");
        return;
    }

    console.log(`Query found in URL: "${query}"`);

    const MAX_RETRIES = 20;
    let attempts = 0;

    const findAndInteract = () => {
        attempts++;
        console.log(`(V10 Logic) - Attempt ${attempts} to find elements.`);

        const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');

        if (promptInputBox) {
            console.log("(V10 Logic) - Prompt input box found.");
            promptInputBox.innerHTML = `<p>${query.replace(/</g, "<").replace(/>/g, ">")}</p>`;

            promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
            promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query, inputType: 'insertText' }));
            promptInputBox.dispatchEvent(new Event('change', { bubbles: true }));
            promptInputBox.dispatchEvent(new Event('blur', { bubbles: true }));
            console.log(`(V10 Logic) - Query "${query}" entered into prompt box.`);

            let buttonEnableAttempts = 0;
            const maxButtonEnableRetries = 15;

            const clickSendButtonWhenEnabled = () => {
                buttonEnableAttempts++;
                const currentSendButton = document.querySelector('button[aria-label="Send message"]');
                
                if (!currentSendButton) {
                    console.error("(V10 Logic) - Send button lost from DOM during enable check.");
                    return;
                }

                const isDisabled = currentSendButton.disabled || currentSendButton.getAttribute('aria-disabled') === 'true';
                
                if (!isDisabled) {
                    console.log("(V10 Logic) - Send button is enabled. Clicking and assuming success.");
                    
                    // THE FIX: Click the button and don't check for anything after.
                    // We trust that it works, as you confirmed.
                    currentSendButton.click(); 

                    // Clean the URL to prevent resubmission on refresh.
                    console.log("(V10 Logic) - URL cleaned to prevent refresh-resubmit.");
                    window.history.replaceState({}, document.title, window.location.pathname);

                    // THE FAULTY VERIFICATION BLOCK THAT CAUSED THE WARNING HAS BEEN REMOVED.

                } else if (buttonEnableAttempts < maxButtonEnableRetries) {
                    console.log(`(V10 Logic) - Send button still disabled. Retrying in 500ms.`);
                    setTimeout(clickSendButtonWhenEnabled, 500);
                } else {
                    console.error("(V10 Logic) - Send button remained disabled after multiple attempts.");
                }
            };

            clickSendButtonWhenEnabled();

        } else {
            if (attempts < MAX_RETRIES) {
                console.log(`(V10 Logic) - Elements not found yet. Retrying in 500ms...`);
                setTimeout(findAndInteract, 500);
            } else {
                console.error("(V10 Logic) - Failed to find prompt input box after multiple retries.");
            }
        }
    };

    findAndInteract();
};

processQueryFromUrl();