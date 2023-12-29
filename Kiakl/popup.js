document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('toggle');
    const headerText = header.querySelector('h1');
    const exportButton = document.getElementById('export');
    const whitelistTextArea = document.getElementById('whitelist');
    const layoutTextArea = document.getElementById('layout');
    const submissionButton = document.getElementById('submission');
    const submissionPageUrl = "https://forms.gle/rnjxrSd16K6q9Dry9";
    const root = document.documentElement;
    let isSaved = false;
    let isValid = false;

    loadLayout();
    loadWhitelist();

    // Open submission page
    submissionButton.addEventListener('click', async () => {
        chrome.tabs.create({ url: submissionPageUrl });
    });

    // Toggle the extension when the header is clicked
    header.addEventListener('click', async () => {
        enabled = !enabled;

        chrome.storage.local.set({ enabled }, () => {
            // Update header state after toggling 'activated' and saving to storage
            updateState();
        });
    });

    async function loadLayout() {
        isSaved = await chrome.storage.local.get({ isSaved: true });
        isValid = await chrome.storage.local.get({ isSaved: true });

        // Load white list
        const { layout } = await chrome.storage.local.get({ layout: ["`1234567890-=\nqwertyuiop[]\\\nasdfghjkl;'\nzxcvbnm,./"] });
        layoutTextArea.value = layout;
    }

    async function loadWhitelist() {
        // Load white list
        const { whitelist } = await chrome.storage.local.get({ whitelist: ['monkeytype.com'] });
        whitelistTextArea.value = whitelist.join('\n');
    }

    // Function to update the header state based on the 'activated' variable
    function updateState() {
        // Update background script and content scripts too
        chrome.runtime.sendMessage({ action: 'toggleExtension', extensionEnabled: enabled });
        let newColor = null;

        // Change the physical representation in the popup
        if (enabled) {
            header.classList.remove('off');
            header.classList.add('on');
            headerText.textContent = 'Activated :)';
            chrome.action.setIcon({ path: 'icon.png' });
            newColor = "var(--cyan)";// "oklab(77.8%, -24.75%, -27%)";
        } else {
            header.classList.remove('on');
            header.classList.add('off');
            headerText.textContent = 'Deactivated :(';
            chrome.action.setIcon({ path: 'deactivated.png' });
            newColor = "var(--purple)";
        }

        // Set highlight element colors
        root.style.setProperty("--highlight", newColor);
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

/////////////////
///// Utils /////
/////////////////

layout = "`1234567890-=\n qwertyuiop[]\\\n  asdfghjkl;'\n   zxcvbnm,./";

function getLayoutType(layout) {
    lines = layout.split("\n");

    if (lines.length == 4) {

    }

    return "invalid";
}