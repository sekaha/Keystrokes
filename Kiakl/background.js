// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'saveSession') {
        // Perform the necessary actions here
        // For example, save the session to storage or do other tasks
        // Send a response back if needed
        sendResponse({ success: true });
    }
});
