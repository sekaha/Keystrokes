let activeTabs = [];

// Receive new tab messages, unload and load them to be activated/deactivated
chrome.runtime.onMessage.addListener((message, sender) => {
    switch (message.action) {
        // Toggle extension
        case 'toggleExtension': {
            // Send activation messages to each tab
            activeTabs.forEach(tabId => {
                chrome.tabs.sendMessage(tabId, { extensionEnabled: message.extensionEnabled })
                    .catch(error => console.error('Error toggeling tabs:', error));
            });
            break;
        }

        // Add tab to tracking list
        case 'trackTab': {
            if (!activeTabs.includes(sender.tab.id)) {
                activeTabs.push(sender.tab.id);
            }
            break;
        }

        // Remove tab from tracking list
        case 'untrackTab': {
            const tabIndex = activeTabs.indexOf(sender.tab.id)

            if (tabIndex != -1) {
                activeTabs.splice(tabIndex, 1);
            }
            break;
        }
    }
});

