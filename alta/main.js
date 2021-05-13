$(function() {
    $(".group_a_lead").click(function() {
        $(".group_a").toggle();
    });
    $(".group_b_lead").click(function() {
        $(".group_b").toggle();
    });
    $(".group_c_lead").click(function() {
        $(".group_c").toggle();
    });
    $(".group_d_lead").click(function() {
        $(".group_d").toggle();
    });
});

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

window.setInterval(tick, 10000);

