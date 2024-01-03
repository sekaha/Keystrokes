let lastStrokeTime = 0
let extensionEnabled = false;
let started = false;
let history = []
let mtTimer = null;
let mtActiveWord = null;
let keyMap = undefined;
const debug = true;
const currentUrl = window.location.href;

// ** MAIN FUNCTIONALITY ** //
window.addEventListener('load', async () => {
    // Tell backgorund.js that a new tab is opened to be managed
    chrome.runtime.sendMessage({ action: 'trackTab' });

    // Load if the extension is activated or not
    ({ extensionEnabled } = await chrome.storage.local.get({ extensionEnabled: false }));
    console.log("is extension enabled?", extensionEnabled);
    ({ keyMap } = await chrome.storage.local.get({ keyMap: getDefaultMapping() }));

    // Handle all URL cases starting with special cases (just monkeytype for now)
    if (await isWhitelisted()) {
        if (currentUrl == "https://monkeytype.com/") {
            // Check if the test ends
            const observer = new MutationObserver(mtDivChecks);
            const targetNode = document.getElementById('typingTest');
            const config = { childList: true, subtree: true };
            observer.observe(targetNode, config);

            mtRun();
        } else {

        }
    }
});

// Save data if the tab ends or is reloaded, this marks the end of a session (among other special conditions for typing games) 
window.addEventListener('beforeunload', () => {
    if (extensionEnabled) {
        saveData();
        chrome.runtime.sendMessage({ action: 'untrackTab' })
    }
})

// Get activation/deactivation messages
chrome.runtime.onMessage.addListener((message) => {
    if (message.extensionEnabled !== undefined) {
        extensionEnabled = message.extensionEnabled;

        if (!extensionEnabled) {
            saveData();
        }
    }
});

const saveData = async () => {
    if (await isWhitelisted()) {
        started = false;

        if (!chrome || !chrome.storage || !chrome.storage.local) {
            console.error('chrome.storage.local is not available, please wait for the extension to intialize fully');
            return;
        }

        const session = {
            website: currentUrl,
            sessionID: Date.now(),
            data: history
        };

        const { log } = await chrome.storage.local.get({ log: [] });
        console.log(log);
        log.push(session);

        await chrome.storage.local.set({ log });

        history = [];
    }
};

// ** WHITELIST UTILS ** //
async function isWhitelisted() {
    const { whitelist } = await chrome.storage.local.get({ whitelist: ['monkeytype.com'] });

    for (const site of whitelist) {
        if (urlMatches(site, currentUrl)) {
            return true;
        }
    }

    return false;
}

function urlMatches(parent, child) {
    match = RegExp(`${parent.replace(/\*/g, '.*')}`);

    console.log(parent, child, match.test(child))

    return match.test(child);
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

                            if (debug) {
                                console.log("started");
                            }
                        }
                        resolve();
                    }))
                }

                // If already started or just started in the last expression then add this key and time
                if (started) {
                    const timeToType = now - lastStrokeTime;
                    lastStrokeTime = now;
                    pushKey(normalizeKey(event.key), timeToType);
                    resolve();
                }
            }));
        }
    }
}

// Callback function for MutationObserver, ends the test
function mtDivChecks(mutationsList) {
    mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mtActiveWord = document.querySelector('#words .word.active');

            if (started && mtActiveWord == null) {
                if (debug) {
                    console.log("ended");
                    console.log(history);
                }
                started = false;
                saveData();
            }
        }
    });
}

const pushKey = (key, duration) => {
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

    if (debug) {
        console.log(`${duration}: ${(key)} ${correctness ? '✓' : 'x'}`);
    }
}