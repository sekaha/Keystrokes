let started = false;
let ended = false;
let typedTime = 0;
let history = []
let t = -1;
let activeWord = document.querySelector('#words .word.active');
const currentUrl = window.location.href;

const isCorrect = (key, duration) => {
    let activeWord = document.querySelector('#words .word.active');
    let correct = false;

    if (key.length == 1) {
        if (key.match(/[a-zA-Z0-9]/)) {
            const letters = activeWord.querySelectorAll('letter');

            for (let i = letters.length - 1; i >= 0; i--) {
                const letter = letters[i];

                if (letter.classList.length > 0) {
                    correct = letter.classList.contains('correct');
                    break;
                }
            }
        } else if (key == " ") {
            let previousWord = activeWord.previousElementSibling;
            correct = !(previousWord.classList.contains('error'))
        }
    }

    entry = {
        key: key,
        duration: duration,
        correct: correct
    };

    history.push(entry);

    // console.log(`${duration} ${timeToType}: ${getKeyAlias(key)} ${correct ? '✓' : 'x'}`);
    t += 1;
}

const trackMonkeytype = (key, duration) => {
    const timer = document.querySelector('#typingTest .time');

    if (timer.style.opacity > 0) {
        if (!started) {
            started = true;
            duration = 0;
        }

        requestAnimationFrame(() => {
            isCorrect(key, duration); // Pass currentKey to isCorrect function
        });
    } else {
        if (started) {
            started = false;
            console.log("ended!!!");
            saveData();
        } else {
            requestAnimationFrame(() => {
                trackMonkeytype(key, duration); // Pass currentKey to isCorrect function
            });
        }
    }
}

const saveData = () => {
    // console.log(JSON.stringify(session, null, 2));
    const session = {
        website: currentUrl,
        sessionID: Date.now(),
        data: history
    }

    chrome.storage.local.get({ log: [] }, (result) => {
        const log = result.log;
        log.push(session);
        console.log(log);

        // Save current session
        chrome.storage.local.set({ log }, () => {
            /* if (chrome.runtime.lastError) {
                console.error('Error while saving session:', chrome.runtime.lastError);
            } else {
                console.log('Session saved successfully!');
            }*/
        });
    });

    history = [];
}

const getKeyAlias = (key) => {
    switch (key) {
        case "Enter":
            return "↵";
        case "Backspace":
            return "⌫"
    }

    return key;
}

let currentKey = "";
let lastStrokeTime = 0;
let timeToType = 0;

window.onkeydown = function (event) {
    // If the key is a space then we need to see if the second to last word is full yet
    let now = performance.now()
    timeToType = now - lastStrokeTime;
    lastStrokeTime = now;

    if (currentUrl === "https://monkeytype.com/") {
        trackMonkeytype(event.key, timeToType);
    } /*else if (started) {
        started = false;
        console.log("ended");

        const session = {
            website: currentUrl,
            sessionID: Date.now(),
            data: history,
        };

        // Retrieve the 'log' array from local storage and update it with the new session
        chrome.storage.local.get({ log: [] }, (result) => {
            const log = result.log;
            log.push(session);

            log.forEach((session, index) => {
                console.log(`Session ${index + 1}:`);
                console.log('Website:', session.website);
                console.log('Session ID:', session.sessionID);
                console.log('Data:', session.data);
                console.log('-------------------------');
            });

            // Store the updated 'log' array back into local storage
            chrome.storage.local.set({ log }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error while saving session:', chrome.runtime.lastError);
                } else {
                    console.log('Session saved successfully!');
                }
            });
        });
    }*/

} /*else if (!currentUrl.includes("login")) {
        console.log(event.key + Date.now().toString());
    } */