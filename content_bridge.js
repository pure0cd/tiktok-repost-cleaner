/**
 * Content Bridge Script
 * Acts as a secure message broker between the main page context and the isolated extension context
 */

// Listen for messages from the main world (injected script)
window.addEventListener("message", (event) => {
    // We only care about messages from our own window
    if (event.source !== window) return;

    const data = event.data;
    // Check if it's a message we expect from the repost remover
    if (data && (
        data.type === "SEC_UID_RESULT" ||
        data.type === "GET_REPOST_ITEMS_RESULT" ||
        data.type === "REMOVE_REPOST_ITEM_RESULT" ||
        (typeof data.type === 'string' && data.type.endsWith("_ERROR"))
    )) {
        // Relay to the extension (popup)
        try {
            chrome.runtime.sendMessage(data)
                .catch(error => {
                    // Handle extension context invalidation gracefully
                    if (error && error.message && error.message.includes("Extension context invalidated")) {
                        // Popup may have closed - this is expected behavior
                    } else {
                        console.error("Bridge send failed:", error);
                    }
                });
        } catch (e) {
            console.error("Bridge send failed:", e);
        }
    }
});