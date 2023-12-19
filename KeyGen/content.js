// const { url } = require("inspector");

chrome.runtime.onConnect.addListener(function (port) { });
let started = false;
let start = 0;
let last_stroke = 0;
// chrome.runtime.sendMessage()

window.onkeydown = function (event) {
    currentUrl = window.location.href;

    // Special case handeling.... 
    if (currentUrl == "https://monkeytype.com/") {
        const activeWordElement = document.querySelector('#words .word.active');

        if (activeWordElement) {
            if (!started) {
                started = true;
                start = Date.now();
                last_stroke = start;
                console.log("started");
            } else {
                const letters = activeWordElement.querySelectorAll('letter');

                // Get the last letter typed and its correctness
                for (let i = letters.length - 1; i >= 0; i--) {
                    const letter = letters[i];

                    // If the letter has been typed it is either incorrect or correct and will have a class to reflect that
                    if (letter.classList.length > 0) {
                        const isCorrect = letter.classList.contains('correct');

                        console.log((Date.now() - last_stroke).toString() + ": " + event.key + (isCorrect ? ' ✓' : ' x'));
                        last_stroke = Date.now();

                        break;
                    }
                }
            }
        } else if (started) {
            started = false;
            console.log("ended");
        }

    } else {
        if (currentUrl.includes("login")) {
            console.log("Keystroke logging deactivated!");
        } else {
            console.log(event.key + Date.now().toString());
        }
    }
}