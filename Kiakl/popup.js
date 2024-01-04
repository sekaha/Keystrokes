// Variables
const submissionPageUrl = "https://forms.gle/rnjxrSd16K6q9Dry9";
const maxRowLengths = [13, 13, 11, 10];
let debug = false;

const layouts = {
    main: {
        temp: undefined,
        saved: undefined,
        defaultText: "`1234567890-=\nqwertyuiop[]\\\nasdfghjkl;'\nzxcvbnm,./",
        prevText: undefined,
        textArea: undefined,
        onion: undefined
    },
    shift: {
        temp: undefined,
        saved: undefined,
        defaultText: "~!@#$%^&*()_+\nQWERTYUIOP{}|\nASDFGHJKL:\"\nZXCVBNM<>?",
        prevText: undefined,
        textArea: undefined,
        onion: undefined
    }
}

let whitelisted, tempKeyboardType, savedKeyboardType, tempWhitelist, savedWhitelist;
let whitelistTextArea;
let root, headerText, header, exportButton, submissionButton, layoutSaveButton, whitelistSaveButton;

// DOMContentLoaded Event Listener
document.addEventListener('DOMContentLoaded', function () {
    initializeVariables();
    loadInitialData();
    setupEventListeners();
});

// Initialization of variables
function initializeVariables() {
    // Assigning DOM elements to variables
    header = document.getElementById('toggle');
    exportButton = document.getElementById('export');
    layouts.main.textArea = document.getElementById('layoutMain');
    layouts.shift.textArea = document.getElementById('layoutShift');
    layouts.main.onion = document.getElementById('layoutMainOnion');
    layouts.shift.onion = document.getElementById('layoutShiftOnion');
    submissionButton = document.getElementById('submission');
    layoutSaveButton = document.getElementById('saveLayout');
    whitelistSaveButton = document.getElementById('saveWhitelist');
    options = document.getElementsByName('options');
    root = document.documentElement;
    headerText = header.querySelector('h1');
    whitelistTextArea = document.getElementById('whitelist');
}

// Setting up event listeners
function setupEventListeners() {
    submissionButton.addEventListener('click', () => chrome.tabs.create({ url: submissionPageUrl }));
    header.addEventListener('click', toggleExtension);
    layouts.main.textArea.addEventListener('input', () => handleLayoutInput(layouts.main));
    layouts.shift.textArea.addEventListener('input', () => handleLayoutInput(layouts.shift));
    whitelistTextArea.addEventListener('input', updateWhitelist)
    options.forEach(option => option.addEventListener('click', updateLayoutSavability));
    exportButton.addEventListener('click', exportData);
    layoutSaveButton.addEventListener('click', saveLayout);
    whitelistSaveButton.addEventListener('click', saveWhitelist);
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

// Loading initial data from local storage
async function loadInitialData() {
    const result = await chrome.storage.local.get({
        // Default values
        savedMainLayout: layouts.main.defaultText,
        tempMainLayout: layouts.main.defaultText,
        savedShiftLayout: layouts.shift.defaultText,
        tempShiftLayout: layouts.shift.defaultText,
        savedKeyboardType: "rowStagger",
        tempKeyboardType: "rowStagger",
        savedWhitelist: "monkeytype.com",
        tempWhitelist: "monkeytype.com"
    });

    // Assigning values from local storage to variables
    layouts.main.saved = result.savedMainLayout;
    layouts.main.temp = result.tempMainLayout;
    layouts.main.textArea.value = result.tempMainLayout;
    layouts.main.prevText = result.tempMainLayout;

    layouts.shift.saved = result.savedShiftLayout;
    layouts.shift.temp = result.tempShiftLayout;
    layouts.shift.textArea.value = result.tempShiftLayout;
    layouts.shift.prevText = result.tempShiftLayout;

    savedKeyboardType = result.savedKeyboardType;
    tempKeyboardType = result.tempKeyboardType;

    savedWhitelist = result.savedWhitelist
    tempWhitelist = result.tempWhitelist;


    // Update radio buttons
    const selectedOption = document.getElementById(tempKeyboardType);
    selectedOption.checked = true;

    // Update GUI accordingly
    updateLayoutGUI(layouts.main);
    updateLayoutGUI(layouts.shift);
    updateLayoutSavability();
    updateWhitelistSavability();

    // Load in the whitelist
    whitelistTextArea.value = tempWhitelist;
    await isCurrentTabWhitelisted();

    chrome.storage.local.get({ extensionEnabled: false }, (result) => {
        extensionEnabled = result.extensionEnabled;
        updateState();
    });
}


// Function to save layouts to local storage
function saveLayout() {
    layouts.main.saved = layouts.main.temp;
    layouts.shift.saved = layouts.shift.temp;
    savedKeyboardType = tempKeyboardType;

    chrome.storage.local.set({ savedMainLayout: layouts.main.saved });
    chrome.storage.local.set({ savedShiftLayout: layouts.shift.saved });
    chrome.storage.local.set({ savedKeyboardType });

    layoutSaveButton.setAttribute('disabled', true);

    const keyMap = { ...mapToQwerty(layouts.main), ...mapToQwerty(layouts.shift) };
    chrome.storage.local.set({ keyMap });

    // Make each tab update to be in the new layout
    chrome.runtime.sendMessage({ action: 'updateLayout' });
}

// Function to save the whitelist to the local storage
async function saveWhitelist() {
    savedWhitelist = tempWhitelist;
    chrome.storage.local.set({ tempWhitelist });
    chrome.storage.local.set({ savedWhitelist });
    whitelistSaveButton.setAttribute('disabled', true);

    // Update websites to make sure they're still part of the whitelist (or check if they are now)
    chrome.runtime.sendMessage({ action: 'updateWhitelist' });

    // Update if the site is now whitelisted
    isCurrentTabWhitelisted().then(updateState);
}

// Toggling the extension status
function toggleExtension() {
    if (whitelisted) {
        extensionEnabled = !extensionEnabled;
        chrome.runtime.sendMessage({ action: 'toggleExtension', extensionEnabled: extensionEnabled });
        chrome.storage.local.set({ extensionEnabled });
        updateState();
    }
}

// Update the whitelist text
function updateWhitelist() {
    tempWhitelist = whitelistTextArea.value;
    chrome.storage.local.set({ tempWhitelist });
    updateWhitelistSavability();
}

// Check updates in whitelist to see if it should be saved or not
function updateWhitelistSavability() {
    if (tempWhitelist != savedWhitelist) {
        whitelistSaveButton.removeAttribute('disabled');
    } else {
        whitelistSaveButton.setAttribute('disabled', true);
    }
}

// Handling input in layout text areas
function handleLayoutInput(layout) {
    enforceBreaks(layout);

    // Cheap fix I'll just accept for now
    enforceBreaks(layout);
    updateLayoutGUI(layout);
    updateLayoutSavability();

    layout.prevText = layout.textArea.value;

    // Save temporary variables so that when the window opens next it's the same
    chrome.storage.local.set({ tempMainLayout: layouts.main.temp });
    chrome.storage.local.set({ tempShiftLayout: layouts.shift.temp });
}

// Update layout text area based on input to include line breaks when max line length is reached
function enforceBreaks(layout) {
    let cursorPos = layout.textArea.selectionStart;
    let newText = '';
    let unbrokenStreak = 0;
    let doubleBreakCheck = false;
    let breaks = 0;
    const specialPoints = [14, 28, 40];

    function reject() {
        layout.textArea.value = layout.prevText;
        layout.textArea.setSelectionRange(cursorPos, cursorPos);
    }

    for (let char of layout.textArea.value) {
        if (char !== '\n') {
            doubleBreak = false;
            unbrokenStreak++;
        } else {
            unbrokenStreak = 0;
            breaks++;

            // Reject two breaks in a row
            if (doubleBreakCheck) {
                continue;
            }
        }

        // Auto break at breakinteval
        if (unbrokenStreak === maxRowLengths[breaks] + 1) {
            // Don't allow more than 4 lines of text via overflow
            if (breaks == (maxRowLengths.length - 1)) {
                reject();
                return;
            }

            // If the cursor is at the edge, when a \n is added it'll offset stuff, so that needs to be readjusted
            if (specialPoints.includes(cursorPos)) {
                cursorPos += 1;
            }

            newText += '\n';
            doubleBreakCheck = true;
            unbrokenStreak = 0;
            breaks++;
        }

        // Don't allow the user to insert more than 4 breaks
        if (!((char === '\n') && (breaks >= maxRowLengths.length))) {
            newText += char;
        } else {
            // This makes sure the cursor isn't moved forward by 1, this should simply just reject the user's enter
            cursorPos -= 1;
        }
    }

    layout.textArea.value = newText;

    // Make sure if a line break or new character was inserted, it doesn't jump the char to the end of the line
    layout.textArea.setSelectionRange(cursorPos, cursorPos);
}

function updateLayoutGUI(layout) {
    updateValidity(layout);
    updateOnion(layout);
}

// Create a backdrop (onion) to show changed text from default QWERTY
function updateOnion(layout) {
    const mainLines = layout.textArea.value.split('\n');
    const defaultLines = layout.defaultText.split('\n');
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

    layout.onion.value = onion.join('\n');
}

// Check for changes in textboxes and layout type to determine savability
function updateLayoutSavability() {
    let isSavable = false;

    // Checking for mutations in any of the layout areas
    if (layouts.main.textArea.value !== layouts.main.saved) {
        layouts.main.temp = layouts.main.textArea.value;
        isSavable = true;
    }

    if (layouts.shift.textArea.value !== layouts.shift.saved) {
        layouts.shift.temp = layouts.shift.textArea.value;
        isSavable = true;
    }

    // Checking for mutations in layout type
    for (let option of options) {
        if (option.checked) {
            // Change it and save it so that when the window opens next it's the same
            tempKeyboardType = option.id;
            chrome.storage.local.set({ tempKeyboardType });

            if (tempKeyboardType !== savedKeyboardType) {
                isSavable = true;
            }

            break;
        }
    }

    isValid = !(layouts.main.textArea.classList.contains('invalid') || layouts.shift.textArea.classList.contains('invalid'));

    // Making sure that the layouts are valid
    if (isSavable && isValid) {
        layoutSaveButton.removeAttribute('disabled');
    } else {
        layoutSaveButton.setAttribute('disabled', true);
    }
}

async function isCurrentTabWhitelisted() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkWhitelisted" }, (response) => {
            whitelisted = response.whitelisted;
            console.log("isCurrentTabWhitelisted?", response.whitelisted);
            resolve();
        });
    });
}

// Function to extension state and reflect that in pop up
function updateState() {
    lightMode = (extensionEnabled && whitelisted)
    let textContent;

    if (!whitelisted) {
        textContent = "Not Whitelisted";
    } else {
        textContent = extensionEnabled ? 'Activated :)' : 'Deactivated :(';
    }

    const iconPath = lightMode ? 'icon.png' : 'deactivated.png';
    const highlightColor = lightMode ? 'var(--cyan)' : 'var(--purple)';

    header.classList.remove(lightMode ? 'off' : 'on');
    header.classList.add(lightMode ? 'on' : 'off');
    headerText.textContent = textContent;
    chrome.action.setIcon({ path: iconPath });
    root.style.setProperty("--highlight", highlightColor);
}

function updateValidity(layout) {
    const set = [];

    for (let char of layout.textArea.value) {
        if (set.includes(char) && (char != "\n") && (char != " ")) {
            layout.textArea.classList.add("invalid");
            return;
        }
        set.push(char);
    }

    layout.textArea.classList.remove("invalid");
}

function mapToQwerty(layout) {
    let mapping = { " ": " " };
    lines = layout.temp.split("\n");
    defaultLines = layout.defaultText.split("\n");
    newMain = "";

    for (let i = 0; i < defaultLines.length; i++) {
        for (let j = 0; j < defaultLines[i].length; j++) {
            if (i < lines.length && j < lines[i].length && lines[i].charAt(j) != " ") {
                mapping[lines[i].charAt(j)] = defaultLines[i].charAt(j)
            } else {
                mapping[defaultLines[i].charAt(j)] = defaultLines[i].charAt(j)
            }
        }
    }

    if (debug) {
        console.log(mapping);
    }

    return mapping;
}