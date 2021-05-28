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
    $(".group_a_lead").on("tap", function() {
        $(".group_a").toggle();
    });

    $(".small-tab").click(function() {
        // Get parent and unselect all tabs
        $(this).parent().children().removeClass("selected");
        // Select the tab that was clicked
        $(this).addClass("selected");
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

