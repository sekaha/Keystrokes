// Receive new tab messages, unload and load them to be activated/deactivated
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        // Toggle extension
        case 'toggleExtension': {
            // Send activation messages to each tab
            forActiveTabs({ extensionEnabled: message.extensionEnabled });
            break;
        }

        // Reload extension's layout
        case 'updateLayout': {
            forActiveTabs({ action: "updateLayout" });
            break;
        }

        // Reload extension's whitelist
        case 'updateWhitelist': {
            forActiveTabs({ action: "updateWhitelist" });
            break;
        }

        // Check if the currently focused tab of the popup is whitelisted or not.
        case 'checkWhitelisted': {
            const getPopupTab = () => new Promise((resolve) => {
                chrome.tabs.query({ active: true, currentWindow: true }, resolve);
            });

            // Waiting for the tab query is asynch, so make an async function and call it
            (async () => {
                const tabs = await getPopupTab();

                chrome.tabs.sendMessage(tabs[0].id, { action: "requestWhitelisted" }, (response) => {
                    sendResponse({ whitelisted: response ? response.whitelisted : false }); //.catch(error => console.error('Error checking white list:', error));
                })
            })();

            // Return true to indicate info will be sent asycnhronously
            return true;
        }

        // Add tab to tracking list
        /*case 'trackTab': {
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

            // simply send message
            // default: {}
        }*/
    }
});

/*chrome.tabs.onUpdated.addListener((id, change, tab) => {
    // Send activation messages to each tab
    if (activeTabs.includes(id)) {
        console.log("URL change check");

        chrome.tabs.sendMessage(id, { action: "updateWhitelist" })
            .catch(error => console.error('Error updating tab:', error));
    } else {
        console.log("");
    }
});*/

function forActiveTabs(message) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            try {
                chrome.tabs.sendMessage(tab.id, message);
            } catch (error) {
                console.log("tab loaded with no content script injected, ignoring tab");
            }
        });
    });
}