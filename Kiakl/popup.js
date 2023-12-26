document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('toggle');
    const headerText = header.querySelector('h1');
    const exportButton = document.getElementById('export');

    // Toggle the extension when the header is clicked
    header.addEventListener('click', async () => {
        enabled = !enabled;
        chrome.runtime.sendMessage({ action: 'toggleExtension', extensionEnabled: enabled });

        chrome.storage.local.set({ enabled }, () => {
            // Update header state after toggling 'activated' and saving to storage
            updateState();
        });
    });

    // Function to update the header state based on the 'activated' variable
    function updateState() {
        // Update content scripts too

        // Change the physical representation in the popup
        if (enabled) {
            header.classList.remove('off');
            header.classList.add('on');
            headerText.textContent = 'Activated :)';
            chrome.action.setIcon({ path: 'activated2.png' });
        } else {
            header.classList.remove('on');
            header.classList.add('off');
            headerText.textContent = 'Deactivated :(';
            chrome.action.setIcon({ path: 'deactivated2.png' });
        }
    }

    // Export the data
    exportButton.addEventListener('click', () => {
        chrome.storage.local.get({ log: [] }, (result) => {
            const jsonBlob = new Blob([JSON.stringify(result.log, null, 2)], { type: 'application/json' });

            chrome.downloads.download({
                url: URL.createObjectURL(jsonBlob),
                filename: "typingdata.json",
                saveAs: true
            });
        });

    });

    // Load in state from last session
    chrome.storage.local.get({ enabled: false }, (result) => {
        enabled = result.enabled;
        console.log(`enabled ${enabled}`)
        updateState(); // Update header state after retrieving the 'activated' value
    });

});
