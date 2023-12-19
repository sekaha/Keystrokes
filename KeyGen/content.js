let started = false;
let lastStrokeTime = 0;
let typedTime = 0;
let i = -1;

window.onkeydown = function (event) {
    const currentUrl = window.location.href;

    if (currentUrl === "https://monkeytype.com/") {
        const activeWordElement = document.querySelector('#words .word.active');
        const timer = document.querySelector('#typingTest .time');

        if (timer) {
            if (!started) {
                started = true;
                lastStrokeTime = performance.now();
                console.log("started");
            } else {
                const letters = activeWordElement.querySelectorAll('letter');
                let typedCharacter = " ";
                let isCorrect = null;

                for (let i = letters.length - 1; i >= 0; i--) {
                    const letter = letters[i];
                    if (letter.classList.length > 0) {
                        isCorrect = letter.classList.contains('correct');
                        typedCharacter = letter.textContent;
                        break;
                    }
                }

                console.log(`${i} ${typedTime.toFixed(1)}: ${typedCharacter} ${isCorrect ? '✓' : 'x'}`);
                i += 1;

                typedTime = performance.now() - lastStrokeTime;
                lastStrokeTime = performance.now();
            }

        } else if (started) {
            started = false;
            console.log("ended");
        }

    } else if (!currentUrl.includes("login")) {
        console.log(event.key + Date.now().toString());
    }
};