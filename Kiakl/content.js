let started = false;
let lastStrokeTime = 0;
let typedTime = 0;
let history = []
let i = -1;

window.onkeydown = function (event) {
    const currentUrl = window.location.href;

    if (currentUrl === "https://monkeytype.com/") {
        const activeWordElement = document.querySelector('#words .word.active');
        const timer = document.querySelector('#typingTest .time');

        if (timer.style.opacity > 0) {
            if (!started) {
                started = true;
                lastStrokeTime = performance.now();
                console.log("started");
            }

            if (activeWordElement) {
                const letters = activeWordElement.querySelectorAll('letter');
                let char = " ";
                let isCorrect = null;

                for (let i = letters.length - 1; i >= 0; i--) {
                    const letter = letters[i];
                    if (letter.classList.length > 0) {
                        isCorrect = letter.classList.contains('correct');
                        char = letter.textContent;
                        break;
                    }
                }

                console.log(`${i} ${typedTime.toFixed(1)}: ${char} ${event.key} ${isCorrect ? '✓' : 'x'}`);

                keypress = {
                    key: char,
                    correct: isCorrect,
                    duration: typedTime,
                };

                typedTime = performance.now() - lastStrokeTime;
                lastStrokeTime = performance.now();

                history.push(keypress)
            }
        } else if (started) {
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
        }

    } else if (!currentUrl.includes("login")) {
        console.log(event.key + Date.now().toString());
    }
};