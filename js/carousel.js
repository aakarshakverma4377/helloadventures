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
                    name: "Spiti Circuit X Chandigarh",
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

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "uttrakhand": {
        thumbnail: "./assets/domestic/uttrakhand.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "kerala": {
        thumbnail: "./assets/domestic/kerala.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "andaman": {
        thumbnail: "./assets/domestic/andaman.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "goa": {
        thumbnail: "./assets/domestic/goa.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "kashmir": {
        thumbnail: "./assets/domestic/kashmir.webp",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "rajasthan": {
        thumbnail: "./assets/domestic/rajasthan.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "sikkim": {
        thumbnail: "./assets/domestic/sikkim.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
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
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
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
        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "srilanka": {
        thumbnail: "./assets/international/srilanka.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "singapore": {
        thumbnail: "./assets/international/singapore.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "thailand": {
        thumbnail: "./assets/international/thailand.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "nepal": {
        thumbnail: "./assets/international/nepal.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],
        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
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

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "varanasi ayodhaya prayagraj": {
        thumbnail: "./assets/pilgrimage/ayodhya.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "himachal shaktipeeths": {
        thumbnail: "./assets/pilgrimage/shaktipeeths.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "char dham\ndo dham": {
        thumbnail: "./assets/pilgrimage/chardham.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "vaishano devi": {
        thumbnail: "./assets/pilgrimage/vaishanodevi.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "golden temple": {
        thumbnail: "./assets/domestic/goldentemple.jpg",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    },
    "pashupatinath": {
        thumbnail: "./assets/pilgrimage/pashupatinath.avif",
        background_url: [
            "./assets/phone/international/dubai.jpg",
            "./assets/phone/international/dubai.jpg"
        ],

        about: "",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                }
            ],
        price: "1000"
    }
});