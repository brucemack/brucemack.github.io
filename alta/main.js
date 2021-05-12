var count = 0;

function tick() {
    count++;
    var list = document.getElementsByClassName("flash_a");
    for (const el of list) {
        if (count % 2 == 0) {
            el.classList.add("green-text");
            el.classList.remove("red-text")
        } else {
            el.classList.add("red-text");
            el.classList.remove("green-text")
        }
    }
}

window.setInterval(tick, 2000);

