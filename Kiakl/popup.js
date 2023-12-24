document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('toggle');
    const headerText = header.querySelector('h1');
    const exportButton = document.getElementById('export');

    let activated = false;

    // Toggle the extension when the header is clicked
    header.addEventListener('click', function () {
        activated = !activated;
        chrome.storage.local.set({ activated }, () => {
            // Update header state after toggling 'activated' and saving to storage
            updateState();
        });
    });

    // Function to update the header state based on the 'activated' variable
    function updateState() {
        // Toggle the logic in content.js
        // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        //     const activeTab = tabs[0];
        //     chrome.tabs.sendMessage(activeTab.id, { toggle: activated })
        // });

        // Change the physical representation in the popup
        if (activated) {
            header.classList.remove('off');
            header.classList.add('on');
            headerText.textContent = 'Activated :)';
            chrome.action.setIcon({ path: 'activated.png' });
        } else {
            header.classList.remove('on');
            header.classList.add('off');
            headerText.textContent = 'Deactivated :(';
            chrome.action.setIcon({ path: 'deactivated.png' });
        }
    }

    exportButton.addEventListener('click', () => {
        // chrome.runtime.sendMessage({ action: 'toggleVariable' }, (response) => {
        //     console.log('Variable isEnabled:', response.isEnabled); // Log the updated value
        // });

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
    chrome.storage.local.get({ activated: false }, (result) => {
        activated = result.activated;
        updateState(); // Update header state after retrieving the 'activated' value
        console.log("should only execute once");
    });
});