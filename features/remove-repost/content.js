/**
 * TikTok Repost Manager
 * Handles all interactions with TikTok's API for repost management
 */
class TikTokRepostManager {
    /**
     * Initialize the manager with the base URL
     */
    constructor() {
        this.baseUrl = "https://www.tiktok.com";
    }

    /**
     * Retrieves the current user's secUid from window object
     * @returns {string} The user's secure UID
     * @throws {Error} If secUid cannot be found
     */
    getSecUid() {
        try {
            // -------------------------------------------------------------------------
            let secUid = window.__$UNIVERSAL_DATA__?.__DEFAULT_SCOPE__?.["webapp.app-context"]?.user?.secUid;
            if (secUid) return secUid;
            secUid = window.SIGI_STATE?.AppContext?.user?.secUid;
            if (secUid) return secUid;
            secUid = window.SIGI_STATE?.UserModule?.users?.[window.SIGI_STATE?.AppContext?.user?.uid]?.secUid;
            if (secUid) return secUid;
            if (window.__TikTokAppData && window.__TikTokAppData.user && window.__TikTokAppData.user.secUid) {
                return window.__TikTokAppData.user.secUid;
            }
            

            throw new Error("User secUid not found. Please ensure you are logged in or reload.");
        } catch (error) {
            console.error("Error retrieving secUid:", error);
            throw error;
        }
    }

    /**
     * Fetches a list of reposted items for the specified cursor with retry logic
     * @param {string} cursor - Pagination cursor
     * @returns {Object} Object containing items, hasMore flag, and next cursor
     */
    async fetchReposts(cursor) {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const secUid = this.getSecUid();
                const params = new URLSearchParams({
                    aid: "1988",
                    count: "30",
                    coverFormat: "2",
                    cursor: cursor || "0",
                    needPinnedItemIds: "true",
                    post_item_list_request_type: "0",
                    secUid: secUid,
                });

                const response = await fetch(`${this.baseUrl}/api/repost/item_list/?${params.toString()}`, {
                    method: "GET",
                    headers: {
                        accept: "*/*",
                    },
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data.status_code === 0) {
                    const items = (data.itemList || []).map((item) => ({
                        id: item.id,
                        authorName: `@${item.author.uniqueId}`,
                        desc: item.desc,
                        url: `${this.baseUrl}/@${item.author.uniqueId}/video/${item.id}`,
                    }));

                    return {
                        hasMore: data.hasMore,
                        items: items,
                        nextCursor: data.hasMore ? data.cursor : null,
                    };
                } else if (data.status_code === 4) {
                    if (attempt < maxRetries) {
                        console.warn(`Server unavailable (attempt ${attempt}/${maxRetries}), retrying in 2 seconds...`);
                        await this.delay(2000);
                        continue;
                    } else {
                        throw new Error(`API returned error code: ${data.status_code}`);
                    }
                } else {
                    throw new Error(`API returned error code: ${data.status_code}`);
                }
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    const delayTime = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
                    console.log(`Retrying in ${delayTime}ms...`);
                    await this.delay(delayTime);
                }
            }
        }

        throw lastError;
    }

    /**
     * Deletes a specific repost by its item ID with retry logic
     * @param {string} itemId - The ID of the repost to delete
     * @returns {boolean} True if deletion was successful
     */
    async deleteRepost(itemId) {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const params = new URLSearchParams({
                    aid: "1988",
                    item_id: itemId,
                });

                const response = await fetch(`${this.baseUrl}/tiktok/v1/upvote/delete?${params.toString()}`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                    body: "",
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Delete failed: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                
                if (data.status_code === 0) {
                    return true;
                } else if (data.status_code === 4) {
                    if (attempt < maxRetries) {
                        console.warn(`Server unavailable (attempt ${attempt}/${maxRetries}), retrying in 2 seconds...`);
                        await this.delay(2000);
                        continue;
                    } else {
                        throw new Error(`Delete API error: ${JSON.stringify(data)}`);
                    }
                } else {
                    throw new Error(`Delete API error: ${JSON.stringify(data)}`);
                }
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    const delayTime = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
                    console.log(`Retrying in ${delayTime}ms...`);
                    await this.delay(delayTime);
                }
            }
        }

        throw lastError;
    }

    /**
     * Utility function to create a delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after the delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const repostManager = new TikTokRepostManager();

/**
 * Listen for messages from the extension via the content bridge
 * Handles different message types and responds appropriately
 */
window.addEventListener("message", async (event) => {
    if (event.source !== window) return;

    const message = event.data;

    if (!message || typeof message !== 'object' || !message.type) return;

    const { type, requestId } = message;

    try {
        switch (type) {
            case "GET_SEC_UID":
                let secUid;
                let retries = 3;
                while (retries > 0) {
                    try {
                        secUid = repostManager.getSecUid();
                        break;
                    } catch (e) {
                        retries--;
                        if (retries === 0) throw e;
                        // Use config value if available, otherwise default to 1000ms
                        const delay = window.RepostConfig?.initDelay || 1000;
                        await new Promise(r => setTimeout(r, delay));
                    }
                }
                window.postMessage({ type: "SEC_UID_RESULT", secUid }, "*");
                break;

            case "GET_REPOST_ITEMS":
                const listResult = await repostManager.fetchReposts(message.cursor);
                window.postMessage(
                    {
                        type: "GET_REPOST_ITEMS_RESULT",
                        requestId: requestId,
                        result: listResult,
                    },
                    "*"
                );
                break;

            case "REMOVE_REPOST_ITEM":
                const removeResult = await repostManager.deleteRepost(message.itemId);
                window.postMessage(
                    {
                        type: "REMOVE_REPOST_ITEM_RESULT",
                        requestId: requestId,
                        result: removeResult
                    },
                    "*"
                );
                break;

            default:
                break;
        }
    } catch (error) {
        const errorType = `${type}_ERROR`; // e.g. GET_REPOST_ITEMS_ERROR
        window.postMessage(
            {
                type: errorType,
                requestId: requestId,
                error: error.message,
            },
            "*"
        );
    }
});
