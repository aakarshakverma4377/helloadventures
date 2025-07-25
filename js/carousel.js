function getMaxZIndex(items_length) {
    return items_length % 2 === 0 ? items_length / 2 + 1 : (items_length + 1) / 2;
}

function getSquash(x) {
    return 1 - 2 * Math.abs(1 / (1 + Math.exp(x)) - 0.5); // same squash logic
}

function getScale(x) {
    const maxScale = 1.0;
    const minScale = 0.7;
    const scaleRange = maxScale - minScale;

    const factor = getSquash(x);

    return minScale + scaleRange * factor;
}

function getOpacity(x) {
    const maxOpacity = 1.0;
    const minOpacity = 0.7;
    const opacityRange = maxOpacity - minOpacity;
    const factor = getSquash(x);
    return minOpacity + opacityRange * factor;
}


const BTN_RIGHT_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M12.6 12L8.7 8.1q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.6 4.6q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7z\"/></svg>";
const BTN_LEFT_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"m10.8 12l3.9 3.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.212-.325T8.425 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7z\"/></svg>";
const LOCATION_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" class='icon' viewBox=\"0 0 24 24\"><g fill=\"none\"><path d=\"m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z\"/><path fill=\"currentColor\" d=\"M12 2a9 9 0 0 1 9 9c0 3.074-1.676 5.59-3.442 7.395a20.4 20.4 0 0 1-2.876 2.416l-.426.29l-.2.133l-.377.24l-.336.205l-.416.242a1.87 1.87 0 0 1-1.854 0l-.416-.242l-.52-.32l-.192-.125l-.41-.273a20.6 20.6 0 0 1-3.093-2.566C4.676 16.589 3 14.074 3 11a9 9 0 0 1 9-9m0 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6\"/></g></svg>";
const DURATION_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" class='icon' viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m4.2 14.2L11 13V7h1.5v5.2l4.5 2.7z\"/></svg>";

function toTitleCase(str) {
    str = str.toLowerCase().split(" ");
    for (let i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(" ");
}

function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

function createTileHtml(tile_data) {
    const name = tile_data.name;
    const duration = tile_data.duration;
    const location = tile_data.location;
    const price_per_person = tile_data.price_per_person;
    const link = tile_data.link;

    return `
        <a class="tile" href="${link}" target="_blank">
            <div class="about">
                <h2>${name}</h2>
                <span>
                    ${LOCATION_SVG}
                <span>${duration}</span>
                </span>
                <span>${DURATION_SVG}
                <span>${location}</span>
                </span>
            </div>
            <span class="price">Starting from ${price_per_person} per person</span>
        </a>
        `;
}

class Carousel {
    animation_time_ms = 250;

    constructor(el_id, data) {
        this.carousel_data = data;
        this.parent_id = el_id;
        this.about_package_el = document.querySelector(`#${el_id} .package-about p`);
        this.package_name_el = document.querySelector(`#${el_id} .package-about  h1`);
        this.package_tiles = document.querySelector(`#${el_id} .package-info .package-tiles`);
        this.animation_queue = [];
        this.is_animating = false;
        this.queue_timer_id = null;
        this.carousel_items = [];

        const parent = document.getElementById(el_id);
        this.parent = parent;
        const outer = document.createElement("div");
        const item_container = document.createElement("div");
        item_container.classList.add("carousel-item-container");
        const entries = Object.entries(data);
        this.center_index = entries.length % 2 === 0 ? entries.length / 2 : (entries.length - 1) / 2;
        for (let i = 0; i < entries.length; i++) {
            const [key, entry] = entries[i];
            const bg_el = document.createElement("a");
            const heading_el = document.createElement("h2");
            bg_el.id = this.getItemId(i);
            bg_el.classList.add("carousel-item");
            bg_el.setAttribute("data-loaded", "false");
            bg_el.href = entry.link;
            bg_el.target = "_blank";
            bg_el.rel = "noopener noreferrer";
            bg_el.setAttribute("key", key);
            heading_el.innerText = key.toUpperCase();

            bg_el.style.backgroundImage = this.getCarouselImageUrl(bg_el);

            bg_el.append(heading_el);
            item_container.appendChild(bg_el);
            this.carousel_items.push(bg_el);
        }
        this.selected_item = this.carousel_items[this.center_index];
        const btnLeft = document.createElement("button");
        const btnRight = document.createElement("button");
        const maxZIndex = getMaxZIndex(entries.length + 1);
        btnLeft.style.zIndex = maxZIndex + 1;
        btnRight.style.zIndex = maxZIndex + 1;
        btnLeft.classList.add("carousel-button", "left");
        btnRight.classList.add("carousel-button", "right");
        btnLeft.innerHTML = BTN_LEFT_SVG;
        btnRight.innerHTML = BTN_RIGHT_SVG;

        btnLeft.onclick = () => {
            this.moveLeft();
        };
        btnRight.onclick = () => {
            this.moveRight();
        };
        outer.append(item_container, btnLeft, btnRight);
        parent.append(outer);
        outer.classList.add("carousel");

        this.carousel_item_container = item_container;

        document.addEventListener("load", () => {
            this.update();
        });
        window.addEventListener("resize", (e) => {
            for (const item of this.carousel_items) {
                item.style.visibility = "";
                item.style.opacity = "";
                item.style.zIndex = "";
                item.style.filter = "";
                item.style.transform = "";
                // item.style.backgroundImage = "";
            }
            this.update();
        });

        this.startX = 0;
        this.startY = 0;
        this.deltaX = 0;
        this.isDragging = false;
        this.isSwiped = false;
        this.isVerticalSwipe = false;
        this.carousel_item_container.addEventListener("touchstart", (e) => {
            this.isDragging = true;
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
            this.deltaX = 0;
            this.deltaY = 0;
        });

        this.carousel_item_container.addEventListener("touchmove", (e) => {
            if (!this.isDragging) return;
            if (this.isSwiped) {
                e.preventDefault();
                return;
            }
            if (this.isVerticalSwipe) {
                return;
            }
            this.deltaX = e.touches[0].clientX - this.startX;
            this.deltaY = e.touches[0].clientY - this.startY;

            const drag_dist_x = Math.abs(this.deltaX);
            const drag_dist_y = Math.abs(this.deltaY);

            if (drag_dist_x < 5 && drag_dist_y < 5)
                return;

            if (drag_dist_x > 5 || drag_dist_y > 5) {
                this.isVerticalSwipe = drag_dist_y > drag_dist_x;
            }

            if (drag_dist_x > 5 && !this.isSwiped && !this.isVerticalSwipe) {
                this.isSwiped = true;
                this.startX = e.touches[0].clientX;
                this.enqueueMove(-Math.sign(this.deltaX));
                this.deltaX = 0;
                e.preventDefault();
            }

        }, {passive: false, capture: true});

        window.addEventListener("touchend", () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.isSwiped = false;
                this.isVerticalSwipe = false;
                // this.snapToClosestItem(this.deltaX);
            }

        });

        this.update();
    }

    getItemData(item) {
        return this.carousel_data[item.getAttribute("key")];
    }

    getSpacingRatio() {
        return (isPortrait() ? 0.3 : 0.7);
    }

    getCarouselImageUrl(carousel_item) {
        const carousel_data = this.getItemData(carousel_item);
        console.log(carousel_data);
        return `url(${carousel_data.thumbnail})`;
    }


    update() {
        const count = this.carousel_items.length;
        if (count === 0) return;

        const containerRect = this.carousel_item_container.getBoundingClientRect();
        const outerRect = this.carousel_item_container.parentElement.getBoundingClientRect();
        const centerPixel = (outerRect.left + outerRect.width / 2) - containerRect.left;

        this.renderVisibleItems(centerPixel);

        const id = this.getItemId(this.center_index);
        this.selected_item?.classList.remove("selected");
        this.selected_item = document.getElementById(id);

        this.parent.style.backgroundImage = this.getBgImage(this.selected_item);
        const key = this.selected_item.getAttribute("key");
        const package_data = this.getItemData(this.selected_item);
        if (package_data) {
            const available_packages = package_data.available_packages;
            let inner_html = "";
            for (const package_data of available_packages) {
                inner_html += createTileHtml(package_data);
            }
            this.package_tiles.innerHTML = inner_html;
            this.about_package_el.innerText = package_data.about;
        } else {
            this.about_package_el.innerText = SiteProperties.packages_info["spiti valley"].about;
        }
        this.package_name_el.innerText = key.toUpperCase();


        this.selected_item?.classList.add("selected");


    }

    renderVisibleItems(centerPixel) {
        const items = this.carousel_items;
        const count = items.length;
        const item_width = items[0].offsetWidth || 100;
        const spacing = item_width * this.getSpacingRatio();
        const visible_range = Math.floor(count / 2);
        const max_z_index = getMaxZIndex(count);

        for (let offset = -visible_range; offset <= visible_range; offset++) {
            const index = (this.center_index + offset + count) % count;
            const item = items[index];

            if (!item)
                continue;

            const index_from_center = offset;
            const item_scale = getScale(index_from_center);
            const opacity = getOpacity(index_from_center);

            // Calculate the base translation in pixels
            const translateX_pixels = centerPixel + index_from_center * spacing - item_width / 2;

            if (item.dataset.loaded === "false") {
                item.setAttribute("data-loaded", "true");
                item.style.backgroundImage = this.getCarouselImageUrl(item);
            }
            item.style.willChange = "transform, z-index, filter";
            item.style.zIndex = (max_z_index - Math.abs(index_from_center)).toString();
            item.style.filter = `brightness(${opacity})`;

            // Apply translateX in pixels first, then scale
            item.style.transform = `translateY(-50%) translateX(${translateX_pixels}px) scale(${item_scale})`;
        }
    }


    /**
     * @param {1|-1} direction
     */
    enqueueMove(direction) {

        this.animation_queue.push(direction);
        if (!this.is_animating) {

            this.processQueue();
        }

        if (this.queue_timer_id)
            clearTimeout(this.queue_timer_id);

        this.queue_timer_id = setTimeout(() => {
            this.animation_queue = [];
            for (const item of this.carousel_items) {
                item.style.willChange = "";
            }
        }, this.animation_time_ms);
    }

    async processQueue() {
        this.is_animating = true;
        while (this.animation_queue.length > 0) {
            const direction = this.animation_queue.shift();

            if (direction === -1) {
                this.center_index = (this.center_index - 1 + this.carousel_items.length) % this.carousel_items.length;
            } else if (direction === 1) {
                this.center_index = (this.center_index + 1) % this.carousel_items.length;
            }

            this.update();
            await new Promise(resolve => setTimeout(resolve, this.animation_time_ms));

        }

        this.is_animating = false;
    }


    moveLeft() {
        this.enqueueMove(-1);
    }

    moveRight() {
        this.enqueueMove(1);
    }

    getItemId(item_index) {
        return this.parent_id + "_carousel_item_" + item_index.toString();
    }

    getBgImage(item) {
        const data = this.getItemData(item);
        console.log(data);
        const url = isPortrait() ? data.background_url[0] : data.background_url[1];
        return `radial-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6)),  url(${url})`;
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

        about: "Lorem ipsum dolor sit amet consectetur adipiscing elit quisque faucibus ex sapien vitae pellentesque sem placerat in id cursus mi pretium tellus duis convallis tempus leo eu aenean sed diam.",
        available_packages:
            [
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                },
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                },
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                },
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                },
                {
                    name: "title",
                    duration: "duration",
                    location: "from to ",
                    price_per_person: "price",
                    link: ""
                },
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