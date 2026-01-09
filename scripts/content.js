
const STORAGE_KEY = 'focusExtensionEnabled';

const observerCallback = (mutationsList, observer) => {

    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'ytd-rich-shelf-renderer' && node.hasAttribute('is-shorts')) {
                    node.remove();
                    continue;
                }

                if (
                    node.nodeType === Node.ELEMENT_NODE && 
                    (
                        node.tagName.toLowerCase() === 'ytd-mini-guide-entry-renderer' || 
                        node.tagName.toLowerCase() === 'ytd-guide-entry-renderer'
                    ) && 
                    node.firstElementChild?.getAttribute('title') === 'Shorts'
                ) {
                    node.remove();
                    continue;
                }
            }
        }
    }
}

let observer = null;

// Check if extension is enabled and start observer accordingly
async function initializeExtension() {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
        const isEnabled = result[STORAGE_KEY] !== false;
        if (isEnabled) {
            startObserver();
        }
    });
}

// Start the mutation observer
function startObserver() {
    if (!observer) {
        const config = { childList: true, subtree: true };
        observer = new MutationObserver(observerCallback);
        observer.observe(document.body, config);
        console.log('Focus extension is active');
    }
}

// Stop the mutation observer
function stopObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
        console.log('Focus extension is inactive');
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extensionStateChanged') {
        if (request.enabled) {
            startObserver();
        } else {
            stopObserver();
        }
        sendResponse({ success: true });
    }
});

// Initialize the extension on load
initializeExtension();