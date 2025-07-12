const menu_btn = document.getElementById('menu-btn');
menu_btn.addEventListener('click', () => {
    const navbar = document.getElementById('navbar');
    navbar?.classList.toggle('hidden');
});