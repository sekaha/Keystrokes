const debug = true;
let lastStrokeTime, extensionEnabled, started, history, mtTimer, mtActiveWord, keyMap, keyboardType, currentUrl;

// ** MAIN FUNCTIONALITY ** //
window.addEventListener('load', startTrackingSession);

// Track this tab for deactivation and various checks in background.js
chrome.runtime.sendMessage({ action: 'trackTab' });

async function startTrackingSession() {
    // Instantiate variables used throughout the program
    lastStrokeTime = 0
    extensionEnabled = false;
    started = false;
    history = []
    mtTimer;
    mtActiveWord;
    keyMap;
    keyboardType;
    currentUrl = window.location.href;

    // Load if the extension is activated or not
    ({ extensionEnabled } = await chrome.storage.local.get({ extensionEnabled: false }));
    ({ keyMap } = await chrome.storage.local.get({ keyMap: getDefaultMapping() }));
    ({ savedKeyboardType: keyboardType } = await chrome.storage.local.get({ savedKeyboardType: "rowStagger" }));

    // Handle all URL cases starting with special cases (just monkeytype for now)
    if (await isWhitelisted()) {
        debugLog("extension active");

        if (currentUrl == "https://monkeytype.com/") {
            // Check if the test ends
            const observer = new MutationObserver(checkSiteUpdates);
            const targetNode = document.getElementById('typingTest');
            const config = { childList: true, subtree: true };
            observer.observe(targetNode, config);

            mtRun();
        } else {
            run();
        }
    } else {
        debugLog("extension inactive");
        extensionEnabled = false;
    }
}

// Save data if the tab ends or is reloaded, this marks the end of a session (among other special conditions for typing games) 
window.addEventListener('beforeunload', () => {
    if (extensionEnabled) {
        endTrackingSession();
    }
});

// Completely untrack tab in the background script.... maybe not necessary if I rework things
window.addEventListener('unload', () => {
    chrome.runtime.sendMessage({ action: 'untrackTab' });
});

// Get activation/deactivation messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if ((message.action) == "updateLayout") {
        debugLog("layout updated");
        renewSession();
    }

    if ((message.action) == "updateWhitelist") {
        debugLog("whitelist updated");
        renewSession();
    }

    if ((message.action) == "updateUrl") {
        debugLog("url changed");
        renewSession();
    }

    if (message.action === "requestWhitelisted") {
        isWhitelisted().then((whitelisted) => {
            debugLog("sending white list request back");
            sendResponse({ whitelisted });
        })
        return true; // Indicates that the response will be sent asynchronously
    }

    if (message.extensionEnabled !== undefined) {
        debugLog(message.extensionEnabled ? "enabled tracking" : "disabled tracking");
        extensionEnabled = message.extensionEnabled;

        if (!extensionEnabled) {
            endTrackingSession();
        } else {
            startTrackingSession();
        }
    }
});

// Save the data to the chrome local storage so it can be exported later
const saveData = async () => {
    if (history.length > 0) {
        debugLog("saving data");

        // for monkeytype
        started = false;

        // Handles a weird bug when the extension isn't fully loaded, probably not even necessary but I spent an hour figuring it out so it stays
        if (!chrome || !chrome.storage || !chrome.storage.local) {
            console.error('chrome.storage.local is not available, please wait for the extension to intialize fully');
            return;
        }

        // Push this tab's typing history as a uniquely identified session to the locally stored log file
        const session = {
            website: currentUrl,
            sessionID: Date.now(),
            data: history,
            layout: Object.keys(keyMap).join(""),
            keyboardType: keyboardType
        };

        const { log } = await chrome.storage.local.get({ log: [] });
        debugLog(log);
        log.push(session);

        await chrome.storage.local.set({ log });

        // Clear session history
        history = [];
    }
};

// Run for generic websites
function run() {
    window.onkeydown = async function (event) {
        if (extensionEnabled) {
            const now = performance.now();
            const timeToType = now - lastStrokeTime;
            lastStrokeTime = now;
            pushKey(normalizeKey(event.key), timeToType);
        }
    }
}

// Push a key to the history log
function pushKey(key, duration) {
    entry = {
        key: key,
        interval: duration
    };

    history.push(entry);
    debugLog(`${duration}: ${(key)}`);
}

function endTrackingSession() {
    started = false;
    saveData();
}

function renewSession() {
    endTrackingSession();
    startTrackingSession();
}

// Callback function for MutationObserver, ends the test if certain divs aren't active, or checks if the page HREF has changed
function checkSiteUpdates(mutationsList) {
    mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
            // Check if the #active towards have gone away (the end screen)
            mtActiveWord = document.querySelector('#words .word.active');

            // If you cancel midway through by switching to a different time setting or something, then the above check won't work, but it should still end
            const timer = document.querySelector('#typingTest .time');
            const opacity = parseFloat(window.getComputedStyle(timer).getPropertyValue('opacity'));

            if (started && (mtActiveWord == null || (opacity == 0))) {
                mtEndTest();
            }
        }
    });
}

// ** WHITELIST UTILS ** //
async function isWhitelisted() {
    const { savedWhitelist } = await chrome.storage.local.get({ savedWhitelist: 'monkeytype.com' });
    currentUrl = window.location.href;

    for (const site of savedWhitelist.split("\n")) {
        if (urlMatches(site, currentUrl)) {
            debugLog("website match found");
            return true;
        }
    }

    // If the website is not whitelisted, the session needs to end
    debugLog("website not whitelisted");
    endTrackingSession();
    return false;
}

function urlMatches(parent, child) {
    parent = normalizeUrl(parent);
    child = normalizeUrl(child);

    debugLog("checking if website is in whitelist", parent, child);

    if (parent.includes('*')) {
        match = RegExp(`${parent.replace(/\*/g, '.*')}`);
        return match.test(child);
    } else {
        return parent === child;
    }
}

function normalizeUrl(url) {
    // Remove http:// or https://
    url = url.replace(/^https?:\/\//, '');

    // Remove www.
    url = url.replace(/^www\./, '');

    // Remove final / if present
    url = url.replace(/\/$/, '');

    return url;
}

// ** KEY MAPPING UTILS ** //
function normalizeKey(key) {
    return keyMap[key] !== undefined ? keyMap[key] : key;
}

function getDefaultMapping() {
    defaultSet = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./ ";
    return Object.fromEntries([...defaultSet].map(char => [char, char]));
}

// ** MONKEY TYPE ** //
function mtRun() {
    window.onkeydown = async function (event) {
        if (extensionEnabled) {
            const now = performance.now();

            // Need to check one frame later to see if the div was updated to reflect both correctness and the timer
            await new Promise(resolve => requestAnimationFrame(async () => {
                // In the case of the timer, you have to wait two frames unfortunately
                if (!started) {
                    await new Promise(resolve => requestAnimationFrame(() => {
                        // We determine if the game has started based on the opacity of the timer... it's janky to say the least
                        const timer = document.querySelector('#typingTest .time');
                        const opacity = parseFloat(window.getComputedStyle(timer).getPropertyValue('opacity'));

                        if (opacity > 0) {
                            started = true;
                            lastStrokeTime = now;
                            debugLog("started");
                        }
                        resolve();
                    }))
                }

                // If already started or just started in the last expression then add this key and time
                if (started) {
                    const timeToType = now - lastStrokeTime;
                    lastStrokeTime = now;
                    mtPushKey(normalizeKey(event.key), timeToType);
                    resolve();
                }
            }));
        }
    }
}

// Add a key to the history log
const mtPushKey = (key, duration) => {
    let correctness = false;

    // Check if the key is correct or not by checking divs on monkeytype that reflect this
    if (key.length == 1) {
        if (key == " ") {
            let previousWord = mtActiveWord.previousElementSibling;
            correctness = !(previousWord.classList.contains('error'))
        } else {
            const letters = mtActiveWord.querySelectorAll('letter');

            for (let i = letters.length - 1; i >= 0; i--) {
                const letter = letters[i];

                if (letter.classList.length > 0) {
                    correctness = letter.classList.contains('correct');
                }
            }
        }
    }

    // Push the key it's duration and correctness it to the history to be saved later
    entry = {
        key: key,
        interval: duration,
        correct: correctness
    };

    history.push(entry);
    debugLog(`${duration}: ${(key)} ${correctness ? '✓' : 'x'}`);
}

// End the monkeytype test
function mtEndTest() {
    debugLog("monkeytype test ended");
    debugLog(history);
    started = false;
    saveData();
}

// Debug print of debug enabled
function debugLog(message) {
    if (debug) {
        console.log(message);
    }
}