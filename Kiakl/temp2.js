let timeToType = 0
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
    chrome.storage.local.get({ activated: false }, (result) => {
        extensionEnabled = result.activated;
    });

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

const saveData = async () => {
    if (chrome.runtime?.id) {
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
    }
};

// ** MONKEY TYPE ** //
function mtRun() {
    window.onkeydown = function (event) {
        if (extensionEnabled) {
            // If the key is a space then we need to see if the second to last word is full yet
            let now = performance.now()

            if (started) {
                // Update previous entry with time
                prevEntry = history[history.length - 1]
                prevEntry.duration = timeToType;
                prevEntry.correct = mtIsCorrect(history[history.length - 1].key); // Pass currentKey to isCorrect function
                console.log(prevEntry.duration, prevEntry.key);
            } else {
                activeWord = document.querySelector('#words .word.active');
                if (activeWord !== null) {
                    started = true;
                }
            }

            entry = {
                key: event.key,
                duration: 0,
                correct: null
            };

            history.push(entry);

            timeToType = now - lastStrokeTime;
            lastStrokeTime = now;

            // Wait a second frame so that the correctness/time div can update
            //requestAnimationFrame(() => {
            //});
        }
    }
}

// Callback function for MutationObserver
function mtDivChecks(mutationsList) {
    mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
            activeWord = document.querySelector('#words .word.active');

            if (activeWord !== null) {
                if (!started) {
                    console.log("started");
                }
                // started = true;
            } else {
                if (started) {
                    console.log("ended");
                    prevEntry = history[history.length - 1]
                    prevEntry.duration = timeToType;
                    prevEntry.correct = mtIsCorrect(history[history.length - 1].key); // Pass currentKey to isCorrect function
                    console.log(prevEntry.duration, prevEntry.key);
                    saveData();
                }
                started = false;
            }
        }
    });
}

const mtIsCorrect = (key) => {
    activeWord = document.querySelector('#words .word.active');

    if (key.length == 1) {
        if (key == " ") {
            let previousWord = activeWord.previousElementSibling;
            correct = !(previousWord.classList.contains('error'))
        } else {
            const letters = activeWord.querySelectorAll('letter');

            for (let i = letters.length - 1; i >= 0; i--) {
                const letter = letters[i];

                if (letter.classList.length > 0) {
                    return letter.classList.contains('correct');
                }
            }
        }
    }

    /*entry = {
        key: key,
        duration: 0,
        correct: null
    };

    history.push(entry);

    if (debug) {
        console.log(`${duration}: ${(key)} ${correct ? '✓' : 'x'}`);
    }*/
}

/*const mtUpdate = (key, duration) => {
    // const timer = document.querySelector('#typingTest .time');

    // Wait a second frame so that the correctness div can update
    //requestAnimationFrame(() => {
    mtIsCorrect(key, duration); // Pass currentKey to isCorrect function
    //});
}*/