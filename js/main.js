const menu_btn = document.getElementById('menu-btn');
menu_btn.addEventListener('click', () => {
    const navbar = document.getElementById('navbar');
    navbar?.classList.toggle('hidden');
});

function insertSocial(name, url, icon_svg){
    const socials_parent =  document.getElementById("socials")
    const social_icon = document.createElement("div")
    social_icon.classList.add("social-icon")
    social_icon.setAttribute("data-tooltip",name)
    social_icon.innerHTML = icon_svg;
    socials_parent.append(social_icon)
}

for(const social of SiteProperties.socials)
    insertSocial(social[0],social[1], social[2]);

