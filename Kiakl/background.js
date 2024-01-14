let activeTabs = []

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
                    .catch(error => console.error('Error upating layuot:', error));
            });
            break;
        }

        // Reload extension's whitelist
        case 'updateWhitelist': {
            // Send activation messages to each tab
            activeTabs.forEach(tabId => {
                chrome.tabs.sendMessage(tabId, { action: "updateWhitelist" })
                    .catch(error => console.error('Error updating whitelist:', error));
            });
            break;
        }

        case 'checkWhitelisted': {
            const getPopupTab = () => new Promise((resolve) => {
                chrome.tabs.query({ active: true, currentWindow: true }, resolve);
            });

            // Waiting for the tab query is asynch, so make an async function and call it
            (async () => {
                const tabs = await getPopupTab();

                chrome.tabs.sendMessage(tabs[0].id, { action: "requestWhitelisted" }, (response) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ whitelisted: false });
                    } else {
                        sendResponse({ whitelisted: response ? response.whitelisted : false }); 1
                    }
                })
            })();

            // Return true to indicate info will be sent asycnhronously
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

chrome.tabs.onUpdated.addListener((tabId) => {
    // Send activation messages to each tab
    try {
        if (activeTabs.includes(tabId)) {
            chrome.tabs.sendMessage(tabId, { action: "updateWhitelist" })
            //.catch(error => console.error('Error updating tab url:', error));
        }
    } catch (e) {
        // this is a special age where injection isn't allowed, so just ignore
    }
});