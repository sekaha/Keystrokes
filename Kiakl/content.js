let lastStrokeTime = 0
let extensionEnabled = false;
let started = false;
let history = []
let debug = true;
let mtTimer = null;
let mtActiveWord = null;
const currentUrl = window.location.href;

window.addEventListener('load', () => {
    // Load if the extension is activated or not
    chrome.storage.local.get({ enabled: false }, (result) => {
        extensionEnabled = result.enabled;
    });
    console.log(`is enabled ${extensionEnabled}`);

    // Handle all URL cases starting with special cases
    if (currentUrl == "https://monkeytype.com/") {
        // Check if the test ends
        const observer = new MutationObserver(mtDivChecks);
        const targetNode = document.getElementById('typingTest');
        const config = { childList: true, subtree: true };
        observer.observe(targetNode, config);

        mtRun();
    }
});

// Save data if the tab ends or is reloaded, this marks the end of a session (among other special conditions for typing games) 
window.addEventListener('beforeunload', () => {
    if (extensionEnabled) {
        saveData();
    }
})

chrome.runtime.onMessage.addListener((message) => {
    if (message.extensionEnabled !== undefined) {
        extensionEnabled = message.extensionEnabled;
    }
});

const saveData = async () => {
    try {
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
        log.push(session);

        await chrome.storage.local.set({ log });

        history = [];
    } catch (error) {
        console.error(error);
    }
};

// ** MONKEY TYPE ** //
function mtRun() {
    window.onkeydown = async function (event) {
        if (extensionEnabled) {
            const now = performance.now();

            if (!started && document.querySelector('#words .word.active')) {
                started = true;
                lastStrokeTime = now;
            }

            const timeToType = now - lastStrokeTime;
            lastStrokeTime = now;

            await new Promise(resolve => requestAnimationFrame(() => {
                pushKey(event.key, timeToType);
                resolve();
            }));
        }
    };
}

// Callback function for MutationObserver
function mtDivChecks(mutationsList) {
    mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mtActiveWord = document.querySelector('#words .word.active');

            if (started && mtActiveWord == null) {
                console.log("ended");
                started = false;
            }
        }
    });
}

const pushKey = (key, duration) => {
    // let activeWord = document.querySelector('#words .word.active');
    if (started) {
        let correctness = false;

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

        if (debug) {
            console.log(`${duration}: ${(key)} ${correctness ? '✓' : 'x'}`);
        }
    }
}