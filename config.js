/**
 * Configuration for Repost Remover Extension
 * Contains centralized settings for the extension
 */
const RepostConfig = {
    // Set to false to disable console logs
    debug: false,

    // Delay in milliseconds before retrieving secUid (to ensure page loads)
    initDelay: 2755,

    // Delay between delete requests to avoid rate limiting
    deleteDelay: 1000
};


window.RepostConfig = RepostConfig;
