// content.js
// Version: URL Reader + Optimized with MutationObserver (V12 - Timer Fix)
console.log("Gemini Omnibox - content.js (URL Reader, V12 Logic - Timer Fix) loaded.");

const processQueryFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query || query.trim() === "") {
        console.log("No valid 'q' parameter in URL. Halting.");
        return;
    }

    console.log(`Query found in URL: "${query}"`);

    // --- STAGE 1: OBSERVE FOR THE PROMPT INPUT BOX ---

    // --- FIX: Capture the timer ID ---
    const fallbackTimer = setTimeout(() => {
        promptBoxObserver.disconnect();
        console.error("(V12 Logic) - Fallback: Timed out after 15 seconds waiting for prompt box.");
    }, 15000); // 15-second safety net

    const findPromptBoxCallback = (mutationsList, observer) => {
        const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');

        if (promptInputBox) {
            // --- FIX: The timer is no longer needed, so cancel it ---
            clearTimeout(fallbackTimer);

            console.log("(V12 Logic) - Prompt input box found via MutationObserver.");
            observer.disconnect();
            interactWithForm(promptInputBox, query);
        }
    };

    const promptBoxObserver = new MutationObserver(findPromptBoxCallback);
    promptBoxObserver.observe(document.body, { childList: true, subtree: true });
};

const interactWithForm = (promptInputBox, query) => {
    // --- STEP 2: POPULATE THE INPUT BOX ---
    promptInputBox.innerHTML = `<p>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
    promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query, inputType: 'insertText' }));

    console.log(`(V12 Logic) - Query "${query}" entered into prompt box.`);

    // --- STAGE 3: OBSERVE FOR THE SEND BUTTON TO BECOME ENABLED ---
    const sendButton = document.querySelector('button[aria-label="Send message"]');
    if (!sendButton) {
        console.error("(V12 Logic) - Could not find the send button after finding the prompt box.");
        return;
    }

    // --- FIX: Capture the timer ID ---
    const fallbackTimer = setTimeout(() => {
        buttonObserver.disconnect();
        console.error("(V12 Logic) - Fallback: Timed out after 10 seconds waiting for send button to enable.");
    }, 10000); // 10-second safety net

    const clickButtonCallback = (mutationsList, observer) => {
        const isDisabled = sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true';

        if (!isDisabled) {
             // --- FIX: The timer is no longer needed, so cancel it ---
            clearTimeout(fallbackTimer);

            console.log("(V12 Logic) - Send button is enabled. Clicking and assuming success.");
            observer.disconnect();

            sendButton.click();
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log("(V12 Logic) - URL cleaned to prevent refresh-resubmit.");
        }
    };

    const buttonObserver = new MutationObserver(clickButtonCallback);
    buttonObserver.observe(sendButton, {
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled']
    });
};

// Start the process
processQueryFromUrl();