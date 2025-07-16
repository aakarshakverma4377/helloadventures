const menu_btn = document.getElementById('menu-btn');
const overlay = document.getElementById('page-overlay');
const navbar = document.getElementById('navbar');
menu_btn.addEventListener('click', () => {

    menu_btn?.classList.add("hidden");
    navbar?.classList.remove('hidden');
    overlay?.classList.remove("hidden");
});
overlay.addEventListener("click",()=>{
    menu_btn?.classList.remove("hidden");
    navbar?.classList.add('hidden');
    overlay?.classList.add("hidden");
});

function insertSocial(name, url, icon_svg){
    const socials_parent =  document.getElementById("socials");
    const social_icon = document.createElement("div");
    social_icon.classList.add("social-icon");
    social_icon.setAttribute("data-tooltip",name);
    social_icon.innerHTML = icon_svg;
    socials_parent.append(social_icon)
}

for(const social of SiteProperties.socials)
    insertSocial(social[0],social[1], social[2]);

