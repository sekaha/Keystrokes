// Variables
const submissionPageUrl = "https://forms.gle/rnjxrSd16K6q9Dry9";
const defaultMain = "`1234567890-=\nqwertyuiop[]\\\nasdfghjkl;'\nzxcvbnm,./";
const defaultShift = "~!@#$%^&*()_+\nQWERTYUIOP{}|\nASDFGHJKL:\"\nZXCVBNM<>?"

let savedMainLayout, tempMainLayout, savedShiftLayout, tempShiftLayout, tempLayoutType, savedLayoutType;
let layoutMainTextArea, layoutShiftTextArea, whitelistTextArea;
let layoutMainOnion, layoutShiftOnion
let root, headerText, header, exportButton, submissionButton, layoutSaveButton;

// DOMContentLoaded Event Listener
document.addEventListener('DOMContentLoaded', function () {
    initializeVariables();
    setupEventListeners();
    loadInitialData();
});

// Initialization of variables
function initializeVariables() {
    // Assigning DOM elements to variables
    header = document.getElementById('toggle');
    exportButton = document.getElementById('export');
    layoutMainTextArea = document.getElementById('layoutMain');
    layoutShiftTextArea = document.getElementById('layoutShift');
    layoutMainOnion = document.getElementById('layoutMainOnion');
    layoutShiftOnion = document.getElementById('layoutShiftOnion');
    submissionButton = document.getElementById('submission');
    layoutSaveButton = document.getElementById('saveLayout');
    options = document.getElementsByName('options');
    root = document.documentElement;
    headerText = header.querySelector('h1');
    whitelistTextArea = document.getElementById('whitelist');
}

// Setting up event listeners
function setupEventListeners() {
    submissionButton.addEventListener('click', () => {
        chrome.tabs.create({ url: submissionPageUrl });
    });

    header.addEventListener('click', () => {
        toggleExtension();
    });

    layoutShiftTextArea.addEventListener('input', () => {
        handleLayoutInput();
    });

    layoutMainTextArea.addEventListener('input', () => {
        handleLayoutInput();
    });

    options.forEach((option) => {
        option.addEventListener('click', handleLayoutInput)
    })

    exportButton.addEventListener('click', () => {
        exportData();
    });

    layoutSaveButton.addEventListener('click', () => {
        saveLayout();
    });
}

// Function to save layouts to local storage
function saveLayout() {
    savedMainLayout = tempMainLayout;
    savedShiftLayout = tempShiftLayout;
    savedLayoutType = tempLayoutType;

    chrome.storage.local.set({ savedMainLayout });
    chrome.storage.local.set({ savedShiftLayout });
    chrome.storage.local.set({ savedLayoutType });
    layoutSaveButton.setAttribute('disabled', true);
}

// Loading initial data from local storage
async function loadInitialData() {
    const result = await chrome.storage.local.get({
        savedMainLayout: defaultMain,
        tempMainLayout: defaultMain,
        savedShiftLayout: defaultShift,
        tempShiftLayout: defaultShift,
        savedLayoutType: "rowStagger",
        tempLayoutType: "rowStagger"
    });

    // Assigning values from local storage to variables
    savedMainLayout = result.savedMainLayout;
    tempMainLayout = result.tempMainLayout;
    layoutMainTextArea.value = tempMainLayout;

    savedShiftLayout = result.savedShiftLayout;
    tempShiftLayout = result.tempShiftLayout;
    layoutShiftTextArea.value = tempShiftLayout;

    savedLayoutType = result.savedLayoutType;
    tempLayoutType = result.tempLayoutType;

    // Update radio buttons
    let selectedOption = document.getElementById(tempLayoutType);
    console.log(selectedOption)
    selectedOption.checked = true;

    // Update GUI accordingly
    handleLayoutInput();

    // Load in the whitelist
    const { whitelist } = await chrome.storage.local.get({ whitelist: ['monkeytype.com'] });
    whitelistTextArea.value = whitelist.join('\n');

    chrome.storage.local.get({ enabled: false }, (result) => {
        enabled = result.enabled;
        updateState();
    });
}

// Toggling the extension status
function toggleExtension() {
    enabled = !enabled;
    chrome.storage.local.set({ enabled }, () => {
        updateState();
    });
}

// Handling input in layout text areas
function handleLayoutInput() {
    let isSavable = false;
    mapToQwerty();

    // Make a backdrop to show what text has been changed from QWERTY
    requestAnimationFrame(async () => {
        mainLines = tempMainLayout.split("\n");
        defaultMainLines = defaultMain.split("\n");
        onion = [];

        for (let i = 0; i < defaultMainLines.length; i++) {
            // Show the onion layer but only the keys that are relevant
            if (i < mainLines.length) {
                size = mainLines[i].length;
            } else {
                size = 0;
            }

            onion.push(" ".repeat(size) + defaultMainLines[i].substring(size));
            layoutMainOnion.value = onion.join("\n");
        }
    });


    // Checking if the textboxes have changed
    if (layoutMainTextArea.value !== savedMainLayout) {
        tempMainLayout = layoutMainTextArea.value;
        isSavable = true;
    }

    if (layoutShiftTextArea.value !== savedShiftLayout) {
        tempShiftLayout = layoutShiftTextArea.value;
        isSavable = true;
    }

    // Checking if layout type has changed
    for (let option of options) {
        if (option.checked) {
            tempLayoutType = option.id;

            if (tempLayoutType != savedLayoutType) {
                isSavable = true;
            }

            break;
        }
    }

    // If there have been any changes, then a new version is savable
    if (isSavable) {
        layoutSaveButton.removeAttribute('disabled');
    } else {
        layoutSaveButton.setAttribute('disabled', true);
    }

    // Save all the temp variables so that if the window closes the user doesn't have to restart
    chrome.storage.local.set({ tempMainLayout });
    chrome.storage.local.set({ tempShiftLayout });
    chrome.storage.local.set({ tempLayoutType });
}

// Function to export data
function exportData() {
    chrome.storage.local.get({ log: [] }, (result) => {
        const jsonBlob = new Blob([JSON.stringify(result.log, null, 2)], { type: 'application/json' });

        chrome.downloads.download({
            url: URL.createObjectURL(jsonBlob),
            filename: "typingdata.json",
            saveAs: true
        });
    });
}

// Function to update extension state
function updateState() {
    chrome.runtime.sendMessage({ action: 'toggleExtension', extensionEnabled: enabled });

    if (enabled) {
        header.classList.remove('off');
        header.classList.add('on');
        headerText.textContent = 'Activated :)';
        chrome.action.setIcon({ path: 'icon.png' });
        root.style.setProperty("--highlight", "var(--cyan)");
    } else {
        header.classList.remove('on');
        header.classList.add('off');
        headerText.textContent = 'Deactivated :(';
        chrome.action.setIcon({ path: 'deactivated.png' });
        root.style.setProperty("--highlight", "var(--purple)");
    }
}

function mapToQwerty() {
    mainLines = tempMainLayout.split("\n");
    defaultMainLines = defaultMain.split("\n");
    newMain = "";

    for (let i = 0; i < mainLines.length; i++) {
        newMain += mainLines[i] + defaultMainLines[i].substring(mainLines[i].length) + "\n";
        console.log(mainLines[i] + defaultMainLines[i].substring(mainLines[i].length) + "\n");
    }

    // If it fails, DO NOT SAVE, this means it is an invalid keyboard
    return false;
}