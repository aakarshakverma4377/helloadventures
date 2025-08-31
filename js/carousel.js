// Utility functions
function computeMaxZIndex(count) {
    return (count % 2 === 0)
        ? count / 2 + 1
        : (count + 1) / 2;
}

function squashFactor(x) {
    // same squash logic
    return 1 - 2 * Math.abs(1 / (1 + Math.exp(x)) - 0.5);
}

function computeScale(offset) {
    const MAX = 1.0;
    const MIN = 0.7;
    return MIN + (MAX - MIN) * squashFactor(offset);
}

function computeOpacity(offset) {
    const MAX = 1.0;
    const MIN = 0.7;
    return MIN + (MAX - MIN) * squashFactor(offset);
}

function toTitleCase(text) {
    const words = text.toLowerCase().split(" ");
    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        words[i] = w.charAt(0).toUpperCase() + w.slice(1);
    }
    return words.join(" ");
}

function isPortraitOrientation() {
    return window.innerHeight > window.innerWidth;
}

// SVG constants
const RIGHT_ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12.6 12L8.7 8.1q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.6 4.6q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7z"/></svg>`;
const LEFT_ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m10.8 12l3.9 3.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.212-.325T8.425 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7z"/></svg>`;
const LOCATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M12 2a9 9 0 0 1 9 9c0 3.074-1.676 5.59-3.442 7.395a20.4 20.4 0 0 1-2.876 2.416l-.426.29l-.2.133l-.377.24l-.336.205l-.416.242a1.87 1.87 0 0 1-1.854 0l-.416-.242l-.52-.32l-.192-.125l-.41-.273a20.6 20.6 0 0 1-3.093-2.566C4.676 16.589 3 14.074 3 11a9 9 0 0 1 9-9m0 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6"/></g></svg>`;
const DURATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m4.2 14.2L11 13V7h1.5v5.2l4.5 2.7z"/></svg>`;

// Tile HTML builder
function buildTileHtml(tile) {
    return `
        <a class="tile" href="${tile.link}" target="_blank">
            <h2>${tile.name}</h2>
            <div class="content">
                <span>${DURATION_ICON}<span>${tile.duration}</span></span>
                <span>${LOCATION_ICON}<span>${tile.location}</span></span>
                <span class="price">Starting from ${tile.price_per_person} Per Person</span>
            </div>
        </a>
    `;
}

// Carousel class
class Carousel {
    animationDuration = 250;

    constructor(containerId, data) {
        this.dataMap = data;
        this.containerId = containerId;
        this.rootElement = document.getElementById(containerId);
        this.packageAboutEl = this.rootElement.querySelector(".package-about p");
        this.packageNameEl = this.rootElement.querySelector(".package-about h1");
        this.tilesContainerEl = this.rootElement.querySelector(".package-info .package-tiles");

        this.items = [];
        this.centerIndex = 0;
        this.isAnimating = false;
        this.queue = [];
        this.prevRootElementHeight = this.rootElement.offsetHeight;

        this._setupStructure();
        this._attachEventListeners();
        this._update();
    }

    _setupStructure() {
        const outer = document.createElement("div");
        const itemsWrapper = document.createElement("div");
        itemsWrapper.classList.add("carousel-item-container");

        const entries = Object.entries(this.dataMap);
        const count = entries.length;
        this.centerIndex = (count % 2 === 0) ? count / 2 : (count - 1) / 2;
        const maxZ = computeMaxZIndex(count);

        for (let i = 0; i < count; i++) {
            const [key, info] = entries[i];
            const itemEl = document.createElement("div");
            itemEl.id = `${this.containerId}_item_${i}`;
            itemEl.classList.add("carousel-item");
            itemEl.dataset.key = key;
            itemEl.dataset.loaded = "false";

            const label = document.createElement("h2");
            label.innerText = key.toUpperCase();
            itemEl.append(label);
            itemsWrapper.append(itemEl);
            this.items.push(itemEl);
        }

        const btnLeft = this._createButton("left", maxZ + 1, () => this.moveLeft());
        const btnRight = this._createButton("right", maxZ + 1, () => this.moveRight());

        outer.append(itemsWrapper, btnLeft, btnRight);
        outer.classList.add("carousel");
        this.rootElement.append(outer);

        this.itemsWrapper = itemsWrapper;
    }

    _createButton(direction, zIndex, onClick) {
        const btn = document.createElement("button");
        btn.classList.add("carousel-button", direction);
        btn.style.zIndex = zIndex;
        btn.innerHTML = (direction === "left") ? LEFT_ARROW_SVG : RIGHT_ARROW_SVG;
        btn.onclick = onClick;
        return btn;
    }

    _attachEventListeners() {
        window.addEventListener("resize", () => {
            // clear any inline styles and re-render
            for (let i = 0; i < this.items.length; i++) {
                const item = this.items[i];
                item.style.cssText = "";
                item.dataset.loaded = "false";
            }
            this._update();
        });
        this.itemsWrapper.addEventListener("touchstart", (e) => this._onTouchStart(e), {passive: false});
        this.itemsWrapper.addEventListener("touchmove", (e) => this._onTouchMove(e), {passive: false, capture: true});
        window.addEventListener("touchend", () => this._onTouchEnd());
    }

    _onTouchStart(e) {
        this.dragging = true;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.swiped = false;
        this.vertical = false;
    }

    _onTouchMove(e) {
        if (!this.dragging || this.swiped) return;
        const dx = e.touches[0].clientX - this.startX;
        const dy = e.touches[0].clientY - this.startY;
        if (Math.abs(dy) > Math.abs(dx)) {
            this.vertical = true;
            return;
        }
        if (Math.abs(dx) > 5 && !this.vertical) {
            this.swiped = true;
            this.enqueueMove(-Math.sign(dx));
            e.preventDefault();
        }
    }

    _onTouchEnd() {
        this.dragging = this.swiped = this.vertical = false;
    }

    getItemInfo(itemEl) {
        return this.dataMap[itemEl.dataset.key];
    }

    _update() {
        const count = this.items.length;
        if (count === 0) return;

        const containerRect = this.itemsWrapper.getBoundingClientRect();
        const outerRect = this.itemsWrapper.parentElement.getBoundingClientRect();
        const centerX = (outerRect.left + outerRect.width / 2) - containerRect.left;

        this._render(centerX);
        this._updateSelection();
        this._updatePackageInfo();
    }

    _render(centerX) {
        const count = this.items.length;
        const itemW = this.items[0].offsetWidth || 100;
        const spacing = itemW * (isPortraitOrientation() ? 0.3 : 0.7);
        const halfRange = Math.floor(count / 2);
        const maxZIndex = computeMaxZIndex(count);

        for (let offset = -halfRange; offset <= halfRange; offset++) {
            const idx = (this.centerIndex + offset + count) % count;
            const item = this.items[idx];
            const scale = computeScale(offset);
            const opacity = computeOpacity(offset);
            const xPos = centerX + offset * spacing - itemW / 2;

            if (item.dataset.loaded === "false") {
                item.dataset.loaded = "true";
                const info = this.getItemInfo(item);
                item.style.backgroundImage = `url(${info.thumbnail})`;
            }

            item.style.zIndex = (maxZIndex - Math.abs(offset)).toString();
            item.style.filter = `brightness(${opacity})`;
            item.style.transform = `translateY(-50%) translateX(${xPos}px) scale(${scale})`;
            item.style.willChange = "transform, z-index, filter";
        }
    }

    _updateSelection() {
        const currentId = `${this.containerId}_item_${this.centerIndex}`;
        if (this.selectedEl) this.selectedEl.classList.remove("selected");
        this.selectedEl = document.getElementById(currentId);
        this.selectedEl.classList.add("selected");
        this.rootElement.style.backgroundImage = this._backgroundFor(this.selectedEl);
    }

    _updatePackageInfo() {
        const key = this.selectedEl.dataset.key;
        const info = this.getItemInfo(this.selectedEl);
        let html = "";

        if (info && info.available_packages) {
            for (let i = 0; i < info.available_packages.length; i++) {
                html += buildTileHtml(info.available_packages[i]);
            }
            this.packageAboutEl.innerText = info.about;
        } else {
            this.packageAboutEl.innerText = "Undefined package data";
        }

        this.tilesContainerEl.innerHTML = html;
        this.packageNameEl.innerText = key.toUpperCase();
    }

    _backgroundFor(itemEl) {
        const info = this.getItemInfo(itemEl);
        const idx = isPortraitOrientation() ? 0 : 1;
        return `radial-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.6)), url(${info.background_url[idx]})`;
    }

    enqueueMove(direction) {
        this.queue.push(direction);
        if (!this.isAnimating) this._processQueue();

        if (this.queueTimer) clearTimeout(this.queueTimer);
        this.queueTimer = setTimeout(() => {
            this.queue = [];
            this.items.forEach(item => item.style.willChange = "");
        }, this.animationDuration);
    }

    async _processQueue() {
        this.isAnimating = true;
        while (this.queue.length) {
            const dir = this.queue.shift();
            this.centerIndex = (this.centerIndex + (dir === 1 ? 1 : -1) + this.items.length) % this.items.length;

            const rect = this.rootElement.getBoundingClientRect();
            const bottomMisaligned = Math.abs(rect.bottom - window.innerHeight) > 2;
            this._update();
            const newRootHeight = this.rootElement.offsetHeight;
            // Check if the bottom edge is off by more than 2px
            const rootHeightChanged = Math.abs(newRootHeight - this.prevRootElementHeight) > 2;
            console.log(rootHeightChanged, bottomMisaligned);
            if (rootHeightChanged) {
                // Instant scroll when height has changed
                this.prevRootElementHeight = newRootHeight;
                if (bottomMisaligned)//scroll smoothly if misaligned
                    this.rootElement.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});
                else // scroll instantly otherwise
                    this.rootElement.scrollIntoView({block: "end", inline: "nearest", behavior: "instant"});

            } else if (bottomMisaligned) {
                // Smooth scroll when the bottom isn't aligned correctly
                this.rootElement.scrollIntoView({block: "end", inline: "nearest", behavior: "smooth"});
            }

            await new Promise(r => setTimeout(r, this.animationDuration));
        }
        this.isAnimating = false;
    }


    moveLeft() {
        this.enqueueMove(-1);
    }

    moveRight() {
        this.enqueueMove(1);
    }
}

new Carousel("domestic-packages", {
    "spiti valley": {
        thumbnail: "./assets/domestic/spiti.jpg",
        background_url: [
            // phone
            "./assets/phone/international/dubai.jpg",
            // Desktop
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Nestled in the Himalayas, Spiti Valley offers peace, adventure, and raw beauty. Explore ancient monasteries, scenic villages, and stunning landscapes—an unforgettable journey where nature and serenity meet timeless charm.",
        available_packages:
            [
                {
                    name: "Spiti Circuit Offbeat Expedition",
                    duration: "6N/7D",
                    location: "Shimla To Shimla ",
                    price_per_person: "30,000/-",
                    link: ""
                },
                {
                    name: "Majestic Spiti",
                    duration: "6N/7D",
                    location: "Shimla To Shimla",
                    price_per_person: "15,000/-",
                    link: ""
                },
                {
                    name: "Magical Spiti",
                    duration: "6N/7D",
                    location: "Chandigarh To Chandigarh",
                    price_per_person: "20,000/-",
                    link: ""
                },
                {
                    name: "Highland Serenity Spiti Package",
                    duration: "7N/8D",
                    location: "Delhi To Delhi ",
                    price_per_person: "30,000/-",
                    link: ""
                },
                {
                    name: "Spiti Circuit EX Chandigarh",
                    duration: "8N/9D",
                    location: "Chandigarh To Chandigarh",
                    price_per_person: "25,000/-",
                    link: ""
                },
                {
                    name: "Spiti Unplugged",
                    duration: "9N/10D",
                    location: "Delhi To Delhi ",
                    price_per_person: "35,000/-",
                    link: ""
                }
            ],
        price: "1000"
    },
    "himachal pradesh": {
        thumbnail: "./assets/domestic/shimla.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Nestled in the lap of the Himalayas, Himachal Pradesh is a paradise for nature lovers and adventure seekers. From snow-capped peaks to lush valleys, ancient temples, colonial towns, and thrilling treks, Himachal offers the perfect blend of peace, culture, and excitement. A journey here promises unforgettable memories amidst breathtaking landscapes and warm hospitality.",
        available_packages:
            [
                {
                    name: "Himalayan Delight Circuit",
                    duration: "6N/7D",
                    location: "Chandigarh To Chandigarh ",
                    price_per_person: "18,000/-",
                    link: ""
                },
                {
                    name: "Manali & Solang Bliss",
                    duration: "5N/6D",
                    location: "Delhi To Delhi ",
                    price_per_person: "20,000/-",
                    link: ""
                },
                {
                    name: "Shimla Kufri Charm",
                    duration: "4N/5D",
                    location: "Ambala Cantt To Ambala Cantt ",
                    price_per_person: "18,000/-",
                    link: ""
                },
                {
                    name: "Dalhousie Dharamshala Escape",
                    duration: "7N/8D",
                    location: "Jammu To Jammu ",
                    price_per_person: "25,000/-",
                    link: ""
                },
                {
                    name: "Magical Himachal Explorer",
                    duration: "8N/9D",
                    location: "Chandigarh To Chandigarh",
                    price_per_person: "30,000/-",
                    link: ""
                },
                {
                    name: "Ultimate Himachal Adventure",
                    duration: "9N/10D",
                    location: "Delhi To Delhi",
                    price_per_person: "35,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "uttrakhand": {
        thumbnail: "./assets/domestic/uttrakhand.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Known as the Land of Gods (Devbhoomi), Uttarakhand is a perfect mix of spirituality, adventure, and natural beauty. From the holy towns of Haridwar and Rishikesh to the snow-clad Himalayas of Auli and Nainital’s serene lakes, Uttarakhand offers something for everyone. Whether you seek peace, trekking thrills, or divine blessings, every journey here becomes a cherished memory.",
        available_packages:
            [
                {
                    name: "Sacred Char Dham Yatra",
                    duration: "9N/10D",
                    location: "Haridwar To Haridwar ",
                    price_per_person: "40,000/-",
                    link: ""
                },
                {
                    name: "Nainital Lake Retreat",
                    duration: "4N/5D",
                    location: "Kathgodam To Kathgodam",
                    price_per_person: "15,000/-",
                    link: ""
                },
                {
                    name: "Valley of Flowers Trek",
                    duration: "6N/7D",
                    location: "Rishikesh To Rishikesh",
                    price_per_person: "22,000/-",
                    link: ""
                },
                {
                    name: "Auli Skiing Adventure",
                    duration: "5N/6D",
                    location: "Joshimath To Joshimath",
                    price_per_person: "20,000/-",
                    link: ""
                },
                {
                    name: "Jim Corbett Safari Escape",
                    duration: "3N/4D",
                    location: "Ramnagar To Ramnagar",
                    price_per_person: "12,000/-",
                    link: ""
                },
                {
                    name: "Mussoorie & Rishikesh Explorer",
                    duration: "6N/7D",
                    location: "Dehradun To Dehradun",
                    price_per_person: "18,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "kerala": {
        thumbnail: "./assets/domestic/kerala.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Known as “God’s Own Country”, Kerala is a land of lush greenery, serene backwaters, golden beaches, and rich culture. From tranquil houseboat rides in Alleppey to the tea gardens of Munnar, the wildlife of Thekkady, and Ayurvedic wellness retreats, Kerala offers a magical mix of relaxation, adventure, and heritage. A journey here is truly a soulful escape into nature’s paradise.",
        available_packages:
            [
                {
                    name: "Backwaters Bliss",
                    duration: "4N/5D",
                    location: "Cochin To Cochin",
                    price_per_person: "18,000/-",
                    link: ""
                },
                {
                    name: "Alleppey Houseboat Experience",
                    duration: "3N/4D",
                    location: "Alleppey To Alleppey ",
                    price_per_person: "15,000/-",
                    link: ""
                },
                {
                    name: "Munnar Tea Garden Escape",
                    duration: "5N/6D",
                    location: "Cochin To Cochin ",
                    price_per_person: "20,000/-",
                    link: ""
                },
                {
                    name: "Thekkady Wildlife Adventure",
                    duration: "5N/6D",
                    location: "Madurai To Madurai",
                    price_per_person: "22,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "andaman": {
        thumbnail: "./assets/domestic/andaman.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Andaman, known for its pristine beaches, turquoise waters, and rich marine life, is a tropical paradise. From exploring history in Port Blair to the white sand beaches of Havelock, Andaman offers the perfect mix of relaxation, adventure, and romance.",
        available_packages:
            [
                {
                    name: "Port Blair City & Beach Tour",
                    duration: "3N/4D",
                    location: "Port Blair APT To Port Blair APT",
                    price_per_person: "18,000/-",
                    link: ""
                },
                {
                    name: "Havelock Island Escape",
                    duration: "4N/5D",
                    location: "Port Blair APT To Port Blair APT",
                    price_per_person: "20,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "goa": {
        thumbnail: "./assets/domestic/goa.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Famous for its golden beaches, vibrant nightlife, Portuguese heritage, and laid-back vibes, Goa is India’s ultimate holiday destination. From thrilling water sports and buzzing beach shacks to serene churches, spice plantations, and hidden waterfalls, Goa offers the perfect blend of adventure, relaxation, and culture. A trip here is a celebration of life, music, and nature.",
        available_packages:
            [
                {
                    name: "Classic North Goa Getaway",
                    duration: "4N/5D",
                    location: "Goa APT (Dabolim) To Goa APT",
                    price_per_person: "15,000/-",
                    link: ""
                },
                {
                    name: "South Goa Serenity Tour",
                    duration: "3N/4D",
                    location: "Madgaon RS TO Madgaon RS",
                    price_per_person: "12,000/-",
                    link: ""
                },
                {
                    name: "Goa Beaches & Nightlife Escape",
                    duration: "5N/6D",
                    location: "Vasco Da Gama To Vasco Da Gama",
                    price_per_person: "18,000/-",
                    link: ""
                },
                {
                    name: "Adventure & Water Sports Package",
                    duration: "4N/5D",
                    location: "Thivim RS To Thivim Railway Station",
                    price_per_person: "20,000/-",
                    link: ""
                },
                {
                    name: "Goa Heritage & Spice Trails",
                    duration: "6N/7D",
                    location: "Panaji To Panaji",
                    price_per_person: "22,000/-",
                    link: ""
                },
                {
                    name: "Luxury Goa Retreat (Beach + Cruise)",
                    duration: "7N/8D",
                    location: "Goa APT To Goa APT",
                    price_per_person: "35,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "kashmir": {
        thumbnail: "./assets/domestic/kashmir.webp",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Popularly called “Paradise on Earth”, Kashmir is a dreamland of snow-covered mountains, lush valleys, shimmering lakes, and colorful gardens. From the charm of Srinagar’s houseboats and Gulmarg’s ski slopes to the meadows of Pahalgam and the breathtaking beauty of Sonmarg, every corner of Kashmir is pure magic. It’s a perfect destination for honeymoons, family trips, and adventure seekers alike.",
        available_packages:
            [
                {
                    name: "Heaven Kashmir",
                    duration: "6N/7D",
                    location: "Srinagar To Srinagar ",
                    price_per_person: "17,999",
                    link: ""
                },
                {
                    name: "Snowy Escapes",
                    duration: "7N/8D",
                    location: "Srinagar To Srinagar ",
                    price_per_person: "21,999",
                    link: ""
                },
                {
                    name: "Srinagar Houseboat Experience",
                    duration: "3N/4D",
                    location: "Srinagar APT To Srinagar APT ",
                    price_per_person: "15,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "rajasthan": {
        thumbnail: "./assets/domestic/rajasthan.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Known as the Land of Kings, Rajasthan is a royal destination filled with majestic forts, grand palaces, golden deserts, vibrant markets, and rich cultural heritage. From the Pink City of Jaipur and the lakes of Udaipur to the golden sands of Jaisalmer and blue streets of Jodhpur, Rajasthan offers an unforgettable blend of history, culture, and adventure.",
        available_packages:
            [
                {
                    name: "Jaipur Royal Experience",
                    duration: "4N/6D",
                    location: "Jaipur APT/RS To Jaipur",
                    price_per_person: "18,000/-",
                    link: ""
                },
                {
                    name: "Udaipur & Mount Abu Escape",
                    duration: "5N/6D",
                    location: "Udaipur APT/RS To Udaipur",
                    price_per_person: "20,000/-",
                    link: ""
                },
                {
                    name: "Jaisalmer Desert Safari",
                    duration: "4N/5D",
                    location: "Jaisalmer RS To Jaisalmer",
                    price_per_person: "22,000/-",
                    link: ""
                },
                {
                    name: "Jodhpur & Osian Desert Tour",
                    duration: "5N/6D",
                    location: "Jodhpur APT/RS To Jodhpur",
                    price_per_person: "19,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "sikkim": {
        thumbnail: "./assets/domestic/sikkim.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Sikkim, the jewel of the Northeast, is a paradise of snow-capped mountains, colorful monasteries, alpine meadows, and sparkling lakes. Home to the mighty Kanchenjunga, it offers breathtaking landscapes, spiritual experiences, thrilling treks, and warm hospitality. From Gangtok’s vibrant streets to the peaceful beauty of Lachung and Yumthang Valley, Sikkim is a dream destination for every traveler.",
        available_packages:
            [
                {
                    name: "Gangtok & Tsomgo Lake Delight",
                    duration: "4N/5D",
                    location: "Bagdogra APT To Bagdogra APT",
                    price_per_person: "19,999/-",
                    link: ""
                },
                {
                    name: "North Sikkim Adventure",
                    duration: "5N/6D",
                    location: "Siliguri RS To Siliguri RS",
                    price_per_person: "22,000/-",
                    link: ""
                },
                {
                    name: "Pelling & Ravangla Escape",
                    duration: "5N/6D",
                    location: "Bagdogra APT To Bagdogra APT",
                    price_per_person: "21,999",
                    link: ""
                },
            ],
        price: "1000"
    },
    "golden triangle": {
        thumbnail: "./assets/domestic/goldentemple.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "Delhi Agra Jaipur",
                    duration: "5N/6D",
                    location: "Pickup-Delhi/Drop-Jaipur",
                    price_per_person: "16,000/-",
                    link: ""
                }
            ],
        price: "1000"
    }
});

new Carousel("international-packages", {
    "dubai": {
        thumbnail: "./assets/international/dubai.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "Dubai, the City of Dreams, is a glamorous mix of ultramodern architecture, luxury shopping, Arabian culture, and desert adventures. From the towering Burj Khalifa and dazzling shopping malls to the golden desert safaris, luxury cruises, and theme parks, Dubai offers an unforgettable international holiday for families, couples, and adventure seekers alike.",
        available_packages:
            [
                {
                    name: "Dubai City Highlights Tour",
                    duration: "4N/5D",
                    location: "Dubai International APT To Dubai International APT",
                    price_per_person: "45,000/-",
                    link: ""
                },
                {
                    name: "Desert Safari & Dhow Cruise Special",
                    duration: "5N/6D",
                    location: "Dubai International APT To Dubai International APT",
                    price_per_person: "55,000/-",
                    link: ""
                },
                {
                    name: "Luxury Dubai Honeymoon Package",
                    duration: "5N/6D",
                    location: "Dubai International APT To Dubai International APT",
                    price_per_person: "60,000/-",
                    link: ""
                },
                {
                    name: "Dubai with Abu Dhabi Grand Mosque Tour",
                    duration: "6N/7D",
                    location: "Dubai International APT To Dubai International APT",
                    price_per_person: "70,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "srilanka": {
        thumbnail: "./assets/international/srilanka.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "Sri Lanka, the Pearl of the Indian Ocean, is a tropical paradise filled with golden beaches, lush tea plantations, ancient temples, wildlife safaris, and cultural heritage. From Colombo’s vibrant city life to the serene hills of Kandy and Nuwara Eliya, and the beaches of Bentota, Sri Lanka offers a mix of relaxation, adventure, and history.",
        available_packages:
            [
                {
                    name: "Colombo City & Heritage Tour",
                    duration: "3N/4D",
                    location: "Colombo APT To Colombo APT",
                    price_per_person: "35,000/-",
                    link: ""
                },
                {
                    name: "Kandy & Cultural Triangle Escape",
                    duration: "4N/5D",
                    location: "Colombo APT To Colombo APT",
                    price_per_person: "40,000/-",
                    link: ""
                },
                {
                    name: "Nuwara Eliya Tea Garden Retreat",
                    duration: "5N/6D",
                    location: "Colombo APT To Colombo APT",
                    price_per_person: "45,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "singapore": {
        thumbnail: "./assets/international/singapore.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "Singapore, the Lion City, is a dazzling destination known for its futuristic skyline, luxury shopping, family attractions, and vibrant nightlife. From the wonders of Sentosa Island and Gardens by the Bay to thrilling rides at Universal Studios and cultural vibes in Chinatown & Little India, Singapore is the perfect blend of modernity and tradition.",
        available_packages:
            [
                {
                    name: "Singapore City Highlights",
                    duration: "3N/4D",
                    location: "Singapore Changi APT To SIN",
                    price_per_person: "50,000/-",
                    link: ""
                },
                {
                    name: "Sentosa Island & Adventure Tour",
                    duration: "4N/5D",
                    location: "Singapore Changi APT To SIN",
                    price_per_person: "50,000/-",
                    link: ""
                },
                {
                    name: "Universal Studios Family Fun Package",
                    duration: "4N/5D",
                    location: "Singapore APT To Singapore APT",
                    price_per_person: "58,000/-",
                    link: ""
                },
                {
                    name: "Singapore with Night Safari & River Cruise",
                    duration: "5N/6D",
                    location: "Singapore APT To Singapore APT",
                    price_per_person: "62,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "thailand": {
        thumbnail: "./assets/international/thailand.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "Thailand, the Land of Smiles, is famous for its tropical beaches, bustling cities, exotic islands, and vibrant nightlife. From the temples and street markets of Bangkok to the white sandy beaches of Phuket and Krabi, and the lively vibes of Pattaya, Thailand offers the perfect mix of adventure, relaxation, and culture.",
        available_packages:
            [
                {
                    name: "Bangkok City & Temple Tour",
                    duration: "3N/4D",
                    location: "Bandkok Suvarnabhumi APT To Bandkok Suvarnabhumi APT",
                    price_per_person: "price",
                    link: ""
                },
                {
                    name: "Pattaya Beach & Coral Island Escape",
                    duration: "4N/5D",
                    location: "Bangkok APT To Bangkok APT",
                    price_per_person: "45,000/-",
                    link: ""
                },
                {
                    name: "Phuket Island Retreat",
                    duration: "4N/5D",
                    location: "Phuket International APT To HKT",
                    price_per_person: "48,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "nepal": {
        thumbnail: "./assets/international/nepal.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "Nepal, the Land of the Himalayas, is a breathtaking destination known for its snow-capped peaks, ancient temples, vibrant culture, and spiritual atmosphere. From Kathmandu’s rich heritage to Pokhara’s serene lakes, Chitwan’s wildlife, and the mighty Mount Everest, Nepal offers both adventure and peace for travelers.",
        available_packages:
            [
                {
                    name: "Kathmandu Heritage & Temple Tour",
                    duration: "3N/4D",
                    location: "Tribhuvan International APT To KTM",
                    price_per_person: "25,000/-",
                    link: ""
                },
                {
                    name: "Kathmandu-Pokhara Scenic Escape",
                    duration: "4N/5D",
                    location: "Kathmandu APT To Kathmandu APT",
                    price_per_person: "30,000/-",
                    link: ""
                },
                {
                    name: "Chitwan Wildlife Safari",
                    duration: "5N/6D",
                    location: "Kathmandu APT To Kathmandu APT",
                    price_per_person: "35,000/-",
                    link: ""
                },
                {
                    name: "Complete Nepal Explorer",
                    duration: "7N/8D",
                    location: "Tribhuvan International APT To KTM",
                    price_per_person: "45,000/-",
                    link: ""
                },
            ],
        price: "1000"
    }
});
new Carousel("pilgrimage-packages", {
    "rameshwaram madurai kanyakumari": {
        thumbnail: "./assets/pilgrimage/kanyakumari.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Rameshwaram, Madurai & Kanyakumari are among the most iconic spiritual and cultural destinations of South India. From the Ramanathaswamy Temple at Rameshwaram to the Meenakshi Amman Temple at Madurai and the Vivekananda Rock Memorial at Kanyakumari, this circuit offers devotion, history, and natural beauty in one journey.",
        available_packages:
            [
                {
                    name: "Madurai-Rameshwaram Spiritual Tour",
                    duration: "3N/4D",
                    location: "Madurai APT/Madurai RS",
                    price_per_person: "18,000/-",
                    link: ""
                },
                {
                    name: "Rameshwaram-Kanyakumari Temple Tour",
                    duration: "4N/5D",
                    location: "Rameshwaram RS/Madurai APT",
                    price_per_person: "29,999/-",
                    link: ""
                },
                {
                    name: "South India Heritage & Temple Trail",
                    duration: "6N/7D",
                    location: "Trichy APT/Madurai APT",
                    price_per_person: "37,999/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "varanasi ayodhaya prayagraj": {
        thumbnail: "./assets/pilgrimage/ayodhya.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Varanasi, Ayodhya & Prayagraj are three of the most sacred cities in India. From the ghats of Kashi (Varanasi) and the Ram Mandir of Ayodhya to the Triveni Sangam of Prayagraj, this holy circuit offers a complete blend of spirituality, history, and devotion.",
        available_packages:
            [
                {
                    name: "Varanasi Spiritual Tour",
                    duration: "2N/3D",
                    location: "Varanasi Airport/Varanasi RS",
                    price_per_person: "12,000/-",
                    link: ""
                },
                {
                    name: "Ayodhya-Prayagraj Temple Darshan",
                    duration: "3N/4D",
                    location: "Ayodhya RS/Lucknow APT",
                    price_per_person: "16,999/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "himachal shaktipeeths": {
        thumbnail: "./assets/pilgrimage/shaktipeeths.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Himachal Pradesh is home to some of the most revered Shaktipeeths of India, attracting lakhs of devotees every year. The key temples include Naina Devi, Chintpurni, Jwala Ji, Chamunda Devi, and Brajeshwari Devi (Kangra Mata). This pilgrimage circuit offers a divine spiritual journey amidst the scenic beauty of the Himalayas.",
        available_packages:
            [
                {
                    name: "Mata Naina Devi & Chintpurni Darshan",
                    duration: "2N/3D",
                    location: "Una RS/Kiratpur Sahib RS",
                    price_per_person: "9,999/-",
                    link: ""
                },
                {
                    name: "Jwala Ji & Chamunda Devi Yatra",
                    duration: "3N/4D",
                    location: "Kangra Airport/Pathankot RS",
                    price_per_person: "15,999/-",
                    link: ""
                },
                {
                    name: "Kangra Devi & Chamunda Devi Pilgrimage",
                    duration: "2N/3D",
                    location: "Pathankot RS/Dharamshala APT",
                    price_per_person: "10,500/-",
                    link: ""
                },
                {
                    name: "Complete Himachal Shaktipeeth Circuit",
                    duration: "5N/6D",
                    location: "Una RS/Pathankot RS",
                    price_per_person: "18,000/-",
                    link: ""
                },
                {
                    name: "Shakti Darshan with Dharamshala & Kangra Valley",
                    duration: "4N/5D",
                    location: "Pathankot TS/Dharamshala APT",
                    price_per_person: "22,000/-",
                    link: ""
                },
                {
                    name: "Luxury Himachal Shaktipeeth Yatra",
                    duration: "6N/7D",
                    location: "Chandigarh APT/Pathankot RS",
                    price_per_person: "25,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "char dham do dham": {
        thumbnail: "./assets/pilgrimage/chardham.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "The Char Dham Yatra (Badrinath, Kedarnath, Gangotri & Yamunotri) and Do Dham Yatra (popularly Kedarnath–Badrinath or Gangotri–Yamunotri) are the most sacred pilgrimages of Uttarakhand, offering spiritual peace amidst the Himalayas.",
        available_packages:
            [
                {
                    name: "Char Dham Yatra Ex Haridwar",
                    duration: "9N/10D",
                    location: "Haridwar RS To Haridwar RS",
                    price_per_person: "42,000/-",
                    link: ""
                },
                {
                    name: "Char Dham Yatra Ex Rishikesh",
                    duration: "10N/11D",
                    location: "Rishikesh/Dehradun APT",
                    price_per_person: "44,000/-",
                    link: ""
                },
                {
                    name: "Kedarnath-Badrinath Do Dham Yatra",
                    duration: "5N/6D",
                    location: "Haridwar/Dehradun APT",
                    price_per_person: "28,000/-",
                    link: ""
                },
                {
                    name: "Gangotri-Yamunotri Do Dham Yatra",
                    duration: "5N/6D",
                    location: "Rishikesh/Dehradun APT",
                    price_per_person: "26,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "vaishano devi": {
        thumbnail: "./assets/pilgrimage/vaishanodevi.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "Mata Vaishno Devi, located in the Trikuta Hills near Katra (Jammu), is one of the most sacred shrines of India. Pilgrims trek 13 km from Katra to the holy cave where Maa Vaishno Devi is worshipped. With options of helicopter rides, ropeways, and spiritual add-ons like Shivkhori and Patnitop, this yatra is a once-in-a-lifetime divine experience.",
        available_packages:
            [
                {
                    name: "Vaishno Devi Darshan",
                    duration: "1N/2D",
                    location: "Jammu APT/Jammu APT",
                    price_per_person: "10,000/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "golden temple": {
        thumbnail: "./assets/domestic/goldentemple.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "The Golden Temple (Sri Harmandir Sahib) in Amritsar, Punjab, is the holiest shrine of Sikhism, attracting millions of devotees and tourists from across the world. Along with spiritual peace, Amritsar also offers Jallianwala Bagh, Wagah Border ceremony, and Punjabi cultural experiences.",
        available_packages:
            [
                {
                    name: "Golden Temple Express Darshan",
                    duration: "1N/2D",
                    location: "Amritsar APT/Amritsar APT",
                    price_per_person: "12,000/-",
                    link: ""
                },
                {
                    name: "Golden Temple with Jallianwala Bagh & Wagah Border",
                    duration: "2N/3D",
                    location: "Amritsar APT/Amritsar APT",
                    price_per_person: "13,999/-",
                    link: ""
                },
                {
                    name: "Spiritual Amritsar & Anandpur Sahib Tour",
                    duration: "3N/4D",
                    location: "Amritsar APT/Amritsar APT",
                    price_per_person: "12,999/-",
                    link: ""
                },
            ],
        price: "1000"
    },
    "pashupatinath": {
        thumbnail: "./assets/pilgrimage/pashupatinath.avif",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "The Pashupatinath Temple in Kathmandu, Nepal, is one of the most sacred temples of Lord Shiva and a UNESCO World Heritage Site. Situated on the banks of the Bagmati River, it attracts devotees from across the world. Along with darshan, travelers can also explore nearby attractions like Guhyeshwari Temple, Budhanilkantha, and the cultural beauty of Kathmandu Valley.",
        available_packages:
            [
                {
                    name: "Pashupatinath Darshan",
                    duration: "2N/3D",
                    location: "Tribhuvan APT To Tribhuvan APT",
                    price_per_person: "12,999/-",
                    link: ""
                },
                {
                    name: "Pashupatinath With Kathmandu City Tour",
                    duration: "3N/4D",
                    location: "Kathmandu APT To Kathmandu APT",
                    price_per_person: "16,999/-",
                    link: ""
                },

            ],
        price: "1000"
    }
});