// script.js
document.addEventListener('DOMContentLoaded', () => {
    // expose function globally so inline onclick="showDay(2)" still works
    window.showDay = function (dayNumber) {
        const days = document.querySelectorAll('.day');
        const buttons = document.querySelectorAll('.day-btn');

        // hide all day sections & remove active from buttons
        days.forEach(d => d.style.display = 'none');
        buttons.forEach(b => b.classList.remove('active'));

        // show target day if it exists
        const target = document.getElementById('day' + dayNumber);
        if (target) {
            target.style.display = 'block';
        } else {
            console.warn('showDay: no element found with id', 'day' + dayNumber);
        }

        // add active class to the corresponding button if present
        const btn = buttons[dayNumber - 1];
        if (btn) btn.classList.add('active');
    };

    // optional: show day 1 by default
    showDay(1);
});
