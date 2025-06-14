// content.js
// Version: URL Reader + Optimized with MutationObserver
console.log("Gemini Omnibox - content.js (URL Reader, V11 Logic - MutationObserver) loaded.");

const processQueryFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query || query.trim() === "") {
        console.log("No valid 'q' parameter in URL. Halting.");
        return;
    }

    console.log(`Query found in URL: "${query}"`);

    // --- STAGE 1: OBSERVE FOR THE PROMPT INPUT BOX ---

    // This is our callback function - it runs ONLY when the DOM changes.
    const findPromptBoxCallback = (mutationsList, observer) => {
        // We are just looking for the prompt box to appear.
        const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');

        if (promptInputBox) {
            console.log("(V11 Logic) - Prompt input box found via MutationObserver.");
            
            // The element exists! Stop watching for it to avoid unnecessary work.
            observer.disconnect(); 

            // Now that we have the box, interact with it.
            interactWithForm(promptInputBox, query);
        }
    };

    // Create an observer instance linked to the callback function
    const promptBoxObserver = new MutationObserver(findPromptBoxCallback);

    // Start observing the document body for added/removed nodes in the entire subtree
    promptBoxObserver.observe(document.body, { childList: true, subtree: true });

    // Set a timeout as a fallback in case the observer fails for some reason
    setTimeout(() => {
        promptBoxObserver.disconnect();
        console.error("(V11 Logic) - Fallback: Timed out after 15 seconds waiting for prompt box.");
    }, 15000); // 15-second safety net
};

const interactWithForm = (promptInputBox, query) => {
    // --- STEP 2: POPULATE THE INPUT BOX ---
    // This logic remains the same as it's already robust.
    promptInputBox.innerHTML = `<p>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
    promptInputBox.dispatchEvent(new InputEvent('input', { bubbles: true, data: query, inputType: 'insertText' }));
    // ... other events if needed

    console.log(`(V11 Logic) - Query "${query}" entered into prompt box.`);

    // --- STAGE 3: OBSERVE FOR THE SEND BUTTON TO BECOME ENABLED ---
    const sendButton = document.querySelector('button[aria-label="Send message"]');
    if (!sendButton) {
        console.error("(V11 Logic) - Could not find the send button after finding the prompt box.");
        return;
    }

    const clickButtonCallback = (mutationsList, observer) => {
        // We are watching for the 'disabled' attribute to change.
        const isDisabled = sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true';

        if (!isDisabled) {
            console.log("(V11 Logic) - Send button is enabled. Clicking and assuming success.");
            
            // The button is enabled! Stop watching its attributes.
            observer.disconnect();

            // Click the button and clean the URL
            sendButton.click();
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log("(V11 Logic) - URL cleaned to prevent refresh-resubmit.");
        }
    };
    
    // Create a new, highly targeted observer for just the button.
    const buttonObserver = new MutationObserver(clickButtonCallback);

    // Start observing ONLY the sendButton for attribute changes.
    buttonObserver.observe(sendButton, { 
        attributes: true, 
        attributeFilter: ['disabled', 'aria-disabled'] 
    });
    
    // Fallback for the button observer
    setTimeout(() => {
        buttonObserver.disconnect();
        console.error("(V11 Logic) - Fallback: Timed out after 10 seconds waiting for send button to enable.");
    }, 10000); // 10-second safety net
};


// Start the process
processQueryFromUrl();