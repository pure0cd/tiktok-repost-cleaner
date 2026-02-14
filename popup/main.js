/**
 * Main Popup Script
 * Initializes the Repost Remover feature and sets up message handling
 */

import { RemoveRepostFeature } from '../features/remove-repost/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const removeRepost = new RemoveRepostFeature();
        removeRepost.init();
        chrome.runtime.onMessage.addListener((_request, _sender, _sendResponse) => {
            return true;
        });
    }, 100); // dom - delay
});
