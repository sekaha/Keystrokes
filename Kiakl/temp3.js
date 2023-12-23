let timeToType = 0;
let lastStrokeTime = 0;

window.onkeydown = function (event) {
    let now = performance.now()
    timeToType = now - lastStrokeTime;
    lastStrokeTime = now;
    console.log(timeToType);

}