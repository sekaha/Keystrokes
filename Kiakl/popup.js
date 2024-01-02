// Variables
const submissionPageUrl = "https://forms.gle/rnjxrSd16K6q9Dry9";
const defaultMain = "`1234567890-=\nqwertyuiop[]\\\nasdfghjkl;'\nzxcvbnm,./";
const defaultShift = "~!@#$%^&*()_+\nQWERTYUIOP{}|\nASDFGHJKL:\"\nZXCVBNM<>?"
const maxRowLengths = [13, 13, 11, 10];

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

    layoutMainTextArea.addEventListener('input', () => {
        handleLayoutInput(defaultMain, layoutMainTextArea, layoutMainOnion);
    });

    layoutShiftTextArea.addEventListener('input', () => {
        handleLayoutInput(defaultShift, layoutShiftTextArea, layoutShiftOnion);
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
    updateSavability();

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
function handleLayoutInput(defaultText, textArea, onionTextArea) {
    enforceBreaks(textArea);
    updateOnion(defaultText, textArea, onionTextArea);
    updateSavability();

    // Save temporary variables
    chrome.storage.local.set({ tempMainLayout });
    chrome.storage.local.set({ tempShiftLayout });
    chrome.storage.local.set({ tempLayoutType });
}

// Update layout text area based on input to include line breaks when max line length is reached
function enforceBreaks(textArea) {
    let newText = '';
    let unbrokenStreak = 0;
    let breaks = 0;

    for (let char of textArea.value) {
        if (char !== '\n') {
            unbrokenStreak++;
        } else {
            unbrokenStreak = 0;
            breaks++;
        }

        if (unbrokenStreak === maxRowLengths[breaks] + 1) {
            newText += '\n';
            breaks++;
        }

        if (!((char === '\n') && (breaks >= maxRowLengths.length))) {
            newText += char;
        }
    }

    textArea.value = newText;
}

// Create a backdrop (onion) to show changed text from default QWERTY
function updateOnion(defaultText, textArea, onionTextArea) {
    const mainLines = textArea.value.split('\n');
    const defaultLines = defaultText.split('\n');
    const onion = [];

    for (let i = 0; i < defaultLines.length; i++) {
        if (i < mainLines.length) {
            onion.push('');

            for (let j = 0; j < defaultLines[i].length; j++) {
                if (j < mainLines[i].length) {
                    if (mainLines[i].charAt(j) !== ' ') {
                        onion[i] += ' ';
                    } else {
                        onion[i] += defaultLines[i].charAt(j);
                    }
                } else {
                    onion[i] += defaultLines[i].substring(mainLines[i].length);
                    break;
                }
            }
        } else {
            onion.push(defaultLines[i]);
        }
    }

    onionTextArea.value = onion.join('\n');
}

// Check for changes in textboxes and layout type to determine savability
function updateSavability() {
    let isSavable = false;

    if (layoutMainTextArea.value !== savedMainLayout) {
        tempMainLayout = layoutMainTextArea.value;
        isSavable = true;
    }

    if (layoutShiftTextArea.value !== savedShiftLayout) {
        tempShiftLayout = layoutShiftTextArea.value;
        isSavable = true;
    }

    for (let option of options) {
        if (option.checked) {
            tempLayoutType = option.id;

            if (tempLayoutType !== savedLayoutType) {
                isSavable = true;
            }

            break;
        }
    }

    if (isSavable) {
        layoutSaveButton.removeAttribute('disabled');
    } else {
        layoutSaveButton.setAttribute('disabled', true);
    }
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