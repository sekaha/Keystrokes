// let enabled = false;
let activeTabs = [];

// Send activation messages
function toggle(enabled) {
    activeTabs.forEach(tabId => {
        chrome.tabs.sendMessage(tabId, { extensionEnabled: enabled });
    });
}

// Receive new tab messages, unload and load them to be activated/deactivated
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'contentScriptLoaded') {
        if (!activeTabs.includes(sender.tab.id)) {
            activeTabs.push(sender.tab.id);
        }
    } else if (message.action === 'contentScriptUnloaded') {
        activeTabs.splice(arr.indexOf(sender.tab.id), 1);
    }
});

