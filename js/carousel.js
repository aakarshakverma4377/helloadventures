function getMaxZIndex(items_length) {
    return items_length % 2 === 0 ? items_length / 2 + 1 : (items_length + 1) / 2;
}

function getSquash(x) {
    return 1 - 2 * Math.abs(1 / (1 + Math.exp(x)) - 0.5); // same squash logic
}

function getScale(x) {
    const maxScale = 1.0;
    const minScale = 0.5;
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
    // return 1;
}


const BTN_RIGHT_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M12.6 12L8.7 8.1q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.6 4.6q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7z\"/></svg>";
const BTN_LEFT_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"m10.8 12l3.9 3.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.212-.325T8.425 12t.063-.375t.212-.325l4.6-4.6q.275-.275.7-.275t.7.275t.275.7t-.275.7z\"/></svg>";

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

let interaction_observer = null;

if ("IntersectionObserver" in window) {
    interaction_observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const item = entry.target;

            setBg(entry.isIntersecting && item.dataset.loaded === "false");
        }
    }, {
        root: null, // Viewport
        threshold: 0, // Trigger as soon as a pixel is visible
    });
}

function setBg(item, visible) {
    if (visible) {
        const url = item.getAttribute(isPortrait() ? "portrait" : "landscape");
        item.setAttribute("data-loaded", "true");
        item.style.backgroundImage = `url(${url})`;

        console.log("resize-show", url);
    } else {
        item.setAttribute("data-loaded", "false");
        // UNLOAD when out of view
        console.log("hiding", item.getAttribute("portrait"));
        item.style.backgroundImage = "";
    }
}

class Carousel {
    animation_time_ms = 250;

    constructor(el_id, data) {
        this.parent_id = el_id;
        this.animation_queue = [];
        this.is_animating = false;
        this.queue_timer_id = null;
        // this.el = document.getElementById(el_id)
        this.data = data;
        this.carousel_items = [];

        const parent = document.getElementById(el_id);
        const outer = document.createElement("div");
        const item_container = document.createElement("div");
        item_container.classList.add("carousel-item-container");
        const entries = Object.entries(data);
        this.center_index = entries.length % 2 === 0 ? entries.length / 2 : (entries.length - 1) / 2;
        for (let i = 0; i < entries.length; i++) {
            const [key, entry] = entries[i];
            const bg_el = document.createElement("a");
            const heading_el = document.createElement("h1");
            bg_el.id = this.getItemId(i);
            bg_el.classList.add("carousel-item");
            bg_el.setAttribute("data-loaded", "false");
            bg_el.href = entry.link;
            bg_el.target = "_blank";
            bg_el.rel = "noopener noreferrer";
            bg_el.setAttribute("landscape", entry.img_landscape);
            bg_el.setAttribute("portrait", entry.img_portrait);
            heading_el.innerText = isPortrait() ? key.toUpperCase() : toTitleCase(key);


            bg_el.append(heading_el);
            item_container.appendChild(bg_el);
            this.carousel_items.push(bg_el);

            interaction_observer?.observe(bg_el);
        }
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
            for (const item of this.carousel_items) {
                const rect = item.getBoundingClientRect();
                const inViewport = (
                    rect.top < window.innerHeight &&
                    rect.bottom > 0 &&
                    rect.left < window.innerWidth &&
                    rect.right > 0
                );

                setBg(item, inViewport);
            }
            this.update();
        });
        window.addEventListener("resize", (e) => {
            for (const item of this.carousel_items) {
                item.style.visibility = "";
                item.style.opacity = "";
                item.style.zIndex = "";
                item.style.filter = "";
                item.style.transform = "";
                item.style.backgroundImage = "";

                const rect = item.getBoundingClientRect();
                const inViewport = (
                    rect.top < window.innerHeight &&
                    rect.bottom > 0 &&
                    rect.left < window.innerWidth &&
                    rect.right > 0
                );


                setBg(item, inViewport);


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

    getSpacingRatio() {
        return (isPortrait() ? 0.3 : 0.5);
    }

    getImageUrl(carousel_item) {
        return carousel_item.getAttribute(isPortrait() ? "portrait" : "landscape");
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
        this.selected_item?.classList.add("selected");
    }

    renderVisibleItems(centerPixel) {
        const items = this.carousel_items;
        const count = items.length;
        const itemWidth = items[0].offsetWidth || 100;
        const spacing = itemWidth * this.getSpacingRatio();
        const visibleRange = Math.floor(count / 2);
        const maxZIndex = getMaxZIndex(count);

        for (let offset = -visibleRange; offset <= visibleRange; offset++) {
            const index = (this.center_index + offset + count) % count;
            const item = items[index];

            if (!item)
                continue;

            const index_from_center = offset;
            const item_scale = getScale(index_from_center);
            const opacity = getOpacity(index_from_center);
            const translateX = centerPixel + index_from_center * spacing - itemWidth / 2;

            if (item.dataset.loaded === "false") {
                const url = item.getAttribute(isPortrait() ? "portrait" : "landscape");
                item.setAttribute("data-loaded", "true");
                item.style.backgroundImage = `url(${url})`;
            }
            item.style.willChange = "transform, z-index, filter";
            item.style.zIndex = (maxZIndex - Math.abs(index_from_center)).toString();
            item.style.filter = `brightness(${opacity})`;
            item.style.transform = `translate(${translateX}px, -50%) scale(${item_scale})`;
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

}

new Carousel("international-packages", {
    "Dubai": {
        img_landscape: "./assets/international/dubai.jpg",
        img_portrait: "./assets/phone/international/dubaiphone.jpg",
        link: "./pages/international/dubai.html",
        price: "1000"
    },
    "SriLanka": {
        img_landscape: "./assets/international/srilanka.jpg",
        img_portrait: "./assets/phone/international/srilankaphone.jpg",
        link: "./pages/international/sri-lanka.html",
        price: "1000"
    },
    "Singapore": {
        img_landscape: "./assets/international/singapore.jpg",
        img_portrait: "./assets/phone/international/singaporephone.jpg",
        link: "./pages/international/singapore.html",
        price: "1000"
    },
    "Thailand": {
        img_landscape: "./assets/international/thailand.jpg",
        img_portrait: "./assets/phone/international/thailandphone.jpg",
        link: "./pages/international/thailand.html",
        price: "1000"
    },
    "Nepal": {
        img_landscape: "./assets/international/nepal.jpg",
        img_portrait: "./assets/phone/international/nepalphone.jpg",
        link: "./pages/international/nepal.html",
        price: "1000"
    }
});
new Carousel("domestic-packages", {
    "Spiti Valley": {
        img_landscape: "./assets/domestic/spiti.jpg",
        img_portrait: "./assets/phone/domestic/spitiphone.jpg",
        link: "./pages/domestic/spiti-valley.html",
        price: "1000"
    },
    "Himachal Pradesh": {
        img_landscape: "./assets/domestic/shimla.jpg",
        img_portrait: "./assets/phone/domestic/hpphone.jpg",
        link: "./pages/domestic/himachalpradesh.html",
        price: "1000"
    },
    "Uttrakhand": {
        img_landscape: "./assets/domestic/uttrakhand.jpg",
        img_portrait: "./assets/phone/domestic/uttrakhandphone.jpg",
        link: "./pages/domestic/uttrakhand.html",
        price: "1000"
    },
    "Kerala": {
        img_landscape: "./assets/domestic/kerala.jpg",
        img_portrait: "./assets/phone/domestic/kerelaphone.png",
        link: "./pages/domestic/kerala.html",
        price: "1000"
    },
    "Andaman": {
        img_landscape: "./assets/domestic/andaman.jpg",
        img_portrait: "./assets/phone/domestic/andamanphone.jpg",
        link: "./pages/domestic/andaman.html",
        price: "1000"
    },
    "Goa": {
        img_landscape: "./assets/domestic/goa.jpg",
        img_portrait: "./assets/phone/domestic/goaphone.jpg",
        link: "./pages/domestic/goa.html",
        price: "1000"
    },
    "Kashmir": {
        img_landscape: "./assets/domestic/kashmir.webp",
        img_portrait: "./assets/phone/domestic/kashmirphone.jpg",
        link: "./pages/domestic/kashmir.html",
        price: "1000"
    },
    "Rajasthan": {
        img_landscape: "./assets/domestic/rajasthan.jpg",
        img_portrait: "./assets/phone/domestic/rajasthanphone.jpg",
        link: "./pages/domestic/rajasthan.html",
        price: "1000"
    },
    "Sikkim": {
        img_landscape: "./assets/domestic/sikkim.jpg",
        img_portrait: "./assets/phone/domestic/sikkimphone.jpg",
        link: "./pages/domestic/sikkim.html",
        price: "1000"
    },
    "Golden Triangle": {
        img_landscape: "./assets/domestic/goldentemple.jpg",
        img_portrait: "./assets/phone/domestic/goldentrianglephone.jpg",
        link: "./pages/domestic/goldentemple.html",
        price: "1000"
    }
});
new Carousel("pilgrimage-packages", {
    "Rameshwaram Madurai Kanyakumari": {
        img_landscape: "./assets/pilgrimage/kanyakumari.jpg",
        img_portrait: "./assets/phone/pilgrimages/rameshwaramphone.jpg",
        link: "./pages/pilgrimage/rameshwaram-kanyakumari.html",
        price: "1000"
    },
    "Varanasi Ayodhaya Prayagraj": {
        img_landscape: "./assets/pilgrimage/ayodhya.jpg",
        img_portrait: "./assets/phone/pilgrimages/ramphone.jpg",
        link: "./pages/pilgrimage/varanasi-ayodhaya.html",
        price: "1000"
    },
    "Himachal Shaktipeeths": {
        img_landscape: "./assets/pilgrimage/shaktipeeths.jpg",
        img_portrait: "./assets/phone/pilgrimages/shaktipeethsphone.jpg",
        link: "./pages/pilgrimage/himachal-shaktipeeths.html",
        price: "1000"
    },
    "Char Dham\nDo Dham": {
        img_landscape: "./assets/pilgrimage/chardham.jpg",
        img_portrait: "./assets/phone/pilgrimages/chardhamphone.jpg",
        link: "./pages/pilgrimage/chardham-dodham.html",
        price: "1000"
    },
    "Vaishano Devi": {
        img_landscape: "./assets/pilgrimage/vaishanodevi.jpg",
        img_portrait: "./assets/phone/pilgrimages/vaishnodeviphone.webp",
        link: "./pages/pilgrimage/vaishanodevi.html",
        price: "1000"
    },
    "Golden Temple": {
        img_landscape: "./assets/domestic/goldentemple.jpg",
        img_portrait: "./assets/phone/pilgrimages/goldentemplephone.jpg",
        link: "./pages/pilgrimage/goldentemple.html",
        price: "1000"
    },
    "Pashupatinath": {
        img_landscape: "./assets/pilgrimage/pashupatinath.avif",
        img_portrait: "./assets/phone/pilgrimages/pashupatinathphone.webp",
        link: "./pages/pilgrimage/pashupatinath.html",
        price: "1000"
    }
});