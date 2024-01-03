let activeTabs = [];

// Receive new tab messages, unload and load them to be activated/deactivated
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

        // Reload extension's layout
        case 'updateLayout': {
            // Send activation messages to each tab
            activeTabs.forEach(tabId => {
                chrome.tabs.sendMessage(tabId, { action: "updateLayout" })
                    .catch(error => console.error('Error toggeling tabs:', error));
            });
            // return true;
            break;
        }

        // Reload extension's whitelist
        case 'updateWhitelist': {
            // Send activation messages to each tab
            activeTabs.forEach(tabId => {
                chrome.tabs.sendMessage(tabId, { action: "updateWhitelist" })
                    .catch(error => console.error('Error toggeling tabs:', error));
            });
            // return true;
            break;
        }

        case 'checkWhitelisted': {
            const getPopupTab = () => new Promise((resolve) => {
                chrome.tabs.query({ active: true, currentWindow: true }, resolve);
            });

            // Waiting for the tab query is asynch, so make an async function and call it
            (async () => {
                const tabs = await getPopupTab();
                // I could totally make the whitelist update live... but i'd prefer to make the user refresh
                // const tabIndex = activeTabs.indexOf(tab.id)
                const whitelisted = (activeTabs.includes(tabs[0].id));
                sendResponse({ whitelisted });
            })();

            return true;
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

