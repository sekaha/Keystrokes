// Variables
const submissionPageUrl = "https://forms.gle/rnjxrSd16K6q9Dry9";
const maxRowLengths = [13, 13, 11, 10];

const layouts = {
    main: {
        defaultText: "`1234567890-=\nqwertyuiop[]\\\nasdfghjkl;'\nzxcvbnm,./",
        textArea: undefined,
        onion: undefined
    },
    shift: {
        defaultText: "~!@#$%^&*()_+\nQWERTYUIOP{}|\nASDFGHJKL:\"\nZXCVBNM<>?",
        textArea: undefined,
        onion: undefined
    }
}

let savedMainLayout, tempMainLayout, savedShiftLayout, tempShiftLayout, tempLayoutType, savedLayoutType;
let whitelistTextArea;
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
    layouts.main.textArea = document.getElementById('layoutMain');
    layouts.shift.textArea = document.getElementById('layoutShift');
    layouts.main.onion = document.getElementById('layoutMainOnion');
    layouts.shift.onion = document.getElementById('layoutShiftOnion');
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

    layouts.main.textArea.addEventListener('input', () => {
        handleLayoutInput(layouts.main);
    });

    layouts.shift.textArea.addEventListener('input', () => {
        handleLayoutInput(layouts.shift);
    });

    options.forEach((option) => {
        option.addEventListener('click', updateSavability)
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
        savedMainLayout: layouts.main.defaultText,
        tempMainLayout: layouts.main.defaultText,
        savedShiftLayout: layouts.shift.defaultText,
        tempShiftLayout: layouts.shift.defaultText,
        savedLayoutType: "rowStagger",
        tempLayoutType: "rowStagger"
    });

    // Assigning values from local storage to variables
    savedMainLayout = result.savedMainLayout;
    tempMainLayout = result.tempMainLayout;
    layouts.main.textArea.value = tempMainLayout;

    savedShiftLayout = result.savedShiftLayout;
    tempShiftLayout = result.tempShiftLayout;
    layouts.shift.textArea.value = tempShiftLayout;

    savedLayoutType = result.savedLayoutType;
    tempLayoutType = result.tempLayoutType;

    // Update radio buttons
    let selectedOption = document.getElementById(tempLayoutType);
    console.log(selectedOption)
    selectedOption.checked = true;

    // Update GUI accordingly
    updateLayoutGUI(layouts.main);
    updateLayoutGUI(layouts.shift);
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
function handleLayoutInput(layout) {
    enforceBreaks(layout);
    updateLayoutGUI(layout);
    updateSavability();

    // Save temporary variables
    chrome.storage.local.set({ tempMainLayout });
    chrome.storage.local.set({ tempShiftLayout });
    chrome.storage.local.set({ tempLayoutType });
}

// Update layout text area based on input to include line breaks when max line length is reached
function enforceBreaks(layout) {
    let cursorPos = layout.textArea.selectionStart;
    let newText = '';
    let unbrokenStreak = 0;
    let doubleBreakCheck = false;
    let breaks = 0;
    const specialPoints = [14, 28, 40];

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
                break;
            }

            // If the cursor is at the edge, when a \n is added it'll offset stuff, so that needs to be readjusted
            if (specialPoints.includes(cursorPos)) {
                cursorPos += 1;
            }

            newText += '\n';
            doubleBreakCheck = true;
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
function updateSavability() {
    let isSavable = false;

    if (layouts.main.textArea.value !== savedMainLayout) {
        tempMainLayout = layouts.main.textArea.value;
        isSavable = true;
    }

    if (layouts.shift.textArea.value !== savedShiftLayout) {
        tempShiftLayout = layouts.shift.textArea.value;
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

function updateValidity(layout) {
    const set = [];

    for (let char of layout.textArea.value) {
        if (set.includes(char) && (char != "\n") && (char != " ")) {
            console.log(char);
            layout.textArea.classList.add("invalid");
            return;
        }
        set.push(char);
    }

    layout.textArea.classList.remove("invalid");
}

function mapToQwerty() {
    mainLines = tempMainLayout.split("\n");
    defaultMainLines = layouts.main.defaultText.split("\n");
    newMain = "";

    for (let i = 0; i < mainLines.length; i++) {
        newMain += mainLines[i] + defaultMainLines[i].substring(mainLines[i].length) + "\n";
        console.log(mainLines[i] + defaultMainLines[i].substring(mainLines[i].length) + "\n");
    }

    // If it fails, DO NOT SAVE, this means it is an invalid keyboard
    return false;
}