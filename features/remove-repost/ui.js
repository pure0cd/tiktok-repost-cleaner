/**
 * UI Controller for the Repost Removal Feature
 * Manages the user interface and communicates with the content script
 */
export class RemoveRepostFeature {
    /**
     * Initialize the feature with default values
     */
    constructor() {
        this.reposts = [];              // Array of repost items to delete
        this.isDeleting = false;        // Flag to track deletion state
        this.container = null;          // Container element reference
        this.scanBtn = null;            // Scan button reference
        this.deleteAllBtn = null;       // Delete button reference
        this.statusDiv = null;          // Status display element
        this.statusIndicator = null;    // Status indicator element
        this.totalToDelete = 0;         // Total items to delete
        this.deletedCount = 0;          // Successfully deleted items
        this.failedCount = 0;           // Failed deletion attempts

        this.handleScan = this.handleScan.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    /**
     * Initialize the UI elements and event listeners
     */
    init() {
        // Find elements after DOM is ready
        this.container = document.querySelector('#remove-repost-module');
        this.scanBtn = this.container.querySelector('.scan-btn');
        this.deleteAllBtn = this.container.querySelector('.delete-btn');
        this.statusDiv = this.container.querySelector('.status-text');
        this.statusIndicator = this.container.querySelector('.status-indicator .status-dot');

        if (this.scanBtn) {
            this.scanBtn.addEventListener('click', this.handleScan);
        }

        if (this.deleteAllBtn) {
            this.deleteAllBtn.addEventListener('click', this.handleDelete);
        }

        chrome.runtime.onMessage.addListener(this.handleMessage);
        chrome.storage.local.get(['repost_items'], (result) => {
            if (result.repost_items && result.repost_items.length > 0) {
                this.reposts = result.repost_items;
                this.updateUIWithReposts();
                this.updateStatus(`Restored ${this.reposts.length} items from previous scan`, 'info');
            } else {
                this.updateStatus('Ready to scan');
            }
        });
    }

    /**
     * Update the UI based on the number of reposts found
     */
    updateUIWithReposts() {
        if (this.reposts.length > 0) {
            this.deleteAllBtn.disabled = false;
            this.deleteAllBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                </svg>
                Delete ${this.reposts.length} Reposts
            `;
        } else {
            this.deleteAllBtn.disabled = true;
            this.deleteAllBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                </svg>
                No Reposts Found
            `;
        }
    }

    /**
     * Update the status display with text and type
     * @param {string} text - Status message to display
     * @param {string} type - Type of status ('info', 'success', 'error', 'warning')
     */
    updateStatus(text, type = 'info') {
        this.statusDiv.textContent = text;
        this.statusDiv.className = `status-text ${type}`;
        this.statusIndicator.className = `status-dot ${type === 'error' ? 'error' : type === 'warning' ? 'processing' : 'ready'}`;
    }

    /**
     * Send a message to the content script via chrome scripting API
     * @param {Object} message - Message to send to content script
     */
    async sendMessageToContent(message) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url.includes("tiktok.com")) {
            this.updateStatus("Error: Please open TikTok", 'error');
            return;
        }

        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (msg) => window.postMessage(msg, "*"),
                args: [message]
            });
        } catch (err) {
            this.updateStatus("Connection Error", 'error');
        }
    }

    /**
     * Handle messages received from the content script
     * @param {Object} request - Message from content script
     */
    handleMessage(request) {
        if (request.type === "GET_REPOST_ITEMS_RESULT") {
            const result = request.result;
            if (result && Array.isArray(result.items)) {
                this.reposts = result.items;

                try {
                    chrome.storage.local.set({ 'repost_items': this.reposts });
                } catch(e) {
                    console.warn("Could not save to storage:", e);
                }

                this.updateStatus(`Found ${this.reposts.length} reposts`, 'success');
                this.updateUIWithReposts();
            } else {
                this.updateStatus("Scan Failed", 'error');
            }
            this.scanBtn.disabled = false;
            this.scanBtn.classList.remove('loading');
        }
        else if (request.type === "REMOVE_REPOST_ITEM_RESULT") {
            this.deletedCount++;
            if (this.totalToDelete > 0) {
                this.updateStatus(`Deleted ${this.deletedCount}/${this.totalToDelete}...`, 'info');
            }
            
            if (this.deletedCount + this.failedCount >= this.totalToDelete) {
                this.completeDeletionProcess();
            }
        }
        else if (request.type && request.type.endsWith("_ERROR")) {
            this.failedCount++;
            if (!this.isDeleting) {
                this.updateStatus(`Error: ${request.error}`, 'error');
            } else {
                if (this.totalToDelete > 0) {
                    this.updateStatus(`Processing... ${this.failedCount} failed so far`, 'warning');
                }
            }
            
            if (this.deletedCount + this.failedCount >= this.totalToDelete) {
                this.completeDeletionProcess();
            }
        }
    }
    
    /**
     * Complete the deletion process and reset state
     */
    completeDeletionProcess() {
        this.isDeleting = false;
        this.scanBtn.disabled = false;
        this.deleteAllBtn.disabled = false;
        this.deleteAllBtn.classList.remove('loading');
        
        if (this.failedCount > 0) {
            this.updateStatus(`Completed. ${this.failedCount} of ${this.totalToDelete} failed. Rescanning...`, 'warning');
        } else {
            this.updateStatus("All items deleted successfully. Rescanning...", 'success');
        }
        
        this.reposts = [];
        chrome.storage.local.remove('repost_items');
        this.handleScan();
    }

    /**
     * Handle the scan button click event
     */
    handleScan() {
        this.updateStatus("Scanning...", 'info');
        this.scanBtn.disabled = true;
        this.scanBtn.classList.add('loading');
        this.sendMessageToContent({ type: "GET_REPOST_ITEMS", cursor: "0", requestId: Date.now() });
    }

    /**
     * Handle the delete button click event
     */
    async handleDelete() {
        if (this.isDeleting || this.reposts.length === 0) return;
        if (!confirm(`Delete ${this.reposts.length} reposts? This cannot be undone.`)) return;
        
        this.isDeleting = true;
        this.scanBtn.disabled = true;
        this.deleteAllBtn.disabled = true;
        this.deleteAllBtn.classList.add('loading');
        this.totalToDelete = this.reposts.length;
        this.deletedCount = 0;
        this.failedCount = 0;
        
        for (const item of this.reposts) {
            if (!this.isDeleting) break;

            this.sendMessageToContent({ type: "REMOVE_REPOST_ITEM", itemId: item.id, requestId: Date.now() });
            
            // Use config value if available, otherwise default to 1000ms base + random 575ms
            const baseDelay = window.RepostConfig?.deleteDelay || 1000;
            const delay = Math.floor(Math.random() * 575) + baseDelay;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}
