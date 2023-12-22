let started = false;
let enabled = false;
let typedTime = 0;
let history = []
let lastStrokeTime = 0;
let timeToType = 0;
let activeWord = null;
const currentUrl = window.location.href;

window.onkeydown = function (event) {
    if (enabled) {
        // If the key is a space then we need to see if the second to last word is full yet
        let now = performance.now()
        timeToType = now - lastStrokeTime;
        lastStrokeTime = now;

        if (currentUrl === "https://monkeytype.com/") {
            requestAnimationFrame(() => {
                trackMonkeytype(event.key, timeToType);; // Pass currentKey to isCorrect function
            });
        }
    }
}

window.addEventListener('load', () => {
    chrome.storage.local.get({ activated: false }, (result) => {
        enabled = result.activated;
    });
})

function doesActiveWordExist() {
    return document.querySelector('#words .word.active') !== null;
}

// Callback function for MutationObserver
function updateDivChecks(mutationsList, observer) {
    const activeWordExists = doesActiveWordExist();

    mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
            if (activeWordExists) {
                console.log('Active word exists now!');
            }
        }
    });
}

// Check if the test ends
const observer = new MutationObserver(updateDivChecks);
const targetNode = document.getElementById('words');
const config = { childList: true, subtree: true };
observer.observe(targetNode, config);

// Ensure that the injected script updates to reflect the activation of the extension
chrome.runtime.onMessage.addListener((message) => {
    enabled = message.toggle;
});

// Save data if the tab ends or is reloaded, this marks the end of a session (among other special conditions for typing games) 
window.addEventListener('beforeunload', () => {
    saveData();
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
const monkeytypeIsCorrect = (key, duration) => {
    let activeWord = document.querySelector('#words .word.active');
    let correct = false;

    if (key.length == 1) {
        if (key == " ") {
            let previousWord = activeWord.previousElementSibling;
            correct = !(previousWord.classList.contains('error'))
        } else {
            const letters = activeWord.querySelectorAll('letter');

            for (let i = letters.length - 1; i >= 0; i--) {
                const letter = letters[i];

                if (letter.classList.length > 0) {
                    correct = letter.classList.contains('correct');
                    break;
                }
            }
        }
    }

    entry = {
        key: key,
        duration: duration,
        correct: correct
    };

    history.push(entry);

    console.log(`${duration} ${timeToType}: ${(key)} ${correct ? '✓' : 'x'}`);
}

const trackMonkeytype = (key, duration) => {
    const timer = document.querySelector('#typingTest .time');

    if (timer.style.opacity > 0) {
        if (!started) {
            started = true;
            duration = 0;
        }

        requestAnimationFrame(() => {
            monkeytypeIsCorrect(key, duration); // Pass currentKey to isCorrect function
        });
    } else {
        if (started) {
            started = false;
            console.log("ended!!!");
            saveData();
        }
    }
}