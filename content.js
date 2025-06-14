// content.js - Hash-based version (simpler approach)
console.log("Gemini Omnibox - content.js (Hash-based) loaded.");

const processQueryFromHash = () => {
    const hash = window.location.hash.substring(1); // Remove the '#'
    const query = decodeURIComponent(hash);

    if (!query || query.trim() === "") {
        console.log("No valid query in hash. Halting.");
        return;
    }

    console.log(`Query found in hash: "${query}"`);
    
    // Clear the hash immediately
    window.history.replaceState({}, document.title, window.location.pathname);

    // Find and interact with the form
    const fallbackTimer = setTimeout(() => {
        promptBoxObserver.disconnect();
        console.error("Fallback: Timed out waiting for prompt box.");
    }, 15000);

    const findPromptBoxCallback = (mutationsList, observer) => {
        const promptInputBox = document.querySelector('div.ql-editor[data-placeholder="Ask Gemini"]');

        if (promptInputBox) {
            clearTimeout(fallbackTimer);
            console.log("Prompt input box found.");
            observer.disconnect();
            interactWithForm(promptInputBox, query);
        }
    };

    const promptBoxObserver = new MutationObserver(findPromptBoxCallback);
    promptBoxObserver.observe(document.body, { childList: true, subtree: true });
};

const interactWithForm = (promptInputBox, query) => {
    // Populate and submit
    promptInputBox.innerHTML = `<p>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    promptInputBox.dispatchEvent(new Event('focus', { bubbles: true }));
    promptInputBox.dispatchEvent(new InputEvent('input', { 
        bubbles: true, 
        data: query, 
        inputType: 'insertText' 
    }));

    // Find and click send button when enabled
    const sendButton = document.querySelector('button[aria-label="Send message"]');
    if (!sendButton) {
        console.error("Could not find send button.");
        return;
    }

    const buttonObserver = new MutationObserver(() => {
        const isDisabled = sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true';
        if (!isDisabled) {
            buttonObserver.disconnect();
            sendButton.click();
            console.log("Message sent successfully.");
        }
    });

    buttonObserver.observe(sendButton, {
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled']
    });
};

// Start the process
processQueryFromHash();