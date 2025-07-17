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
    return window.innerWidth <= 700;
}

class Carousel {
    radius = 200;
    visible_side_items_count = 2;
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
            const heading_el = document.createElement("h2");
            bg_el.id = this.getItemId(i);
            bg_el.classList.add("carousel-item");
            bg_el.href = entry.link;
            bg_el.target = "_blank";
            bg_el.rel = "noopener noreferrer";
            bg_el.setAttribute("landscape", entry.img_landscape);
            bg_el.setAttribute("portrait", entry.img_portrait);
            heading_el.innerText = toTitleCase(key);

            bg_el.append(heading_el);
            item_container.appendChild(bg_el);
            this.carousel_items.push(bg_el);
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

        window.addEventListener("resize", () => {
            for (const carouselItem of this.carousel_items) {
                carouselItem.style.filter = "";
                carouselItem.style.transform = "";
                carouselItem.style.opacity = "";
                carouselItem.style.visibility = "";
                carouselItem.style.zIndex = "";
            }
            this.update();
            this.updateImages();
        });
        this.update();
        this.updateImages();

    }


    getVisibleIndices(window_size = this.visible_side_items_count) {
        let indices = [];
        for (let i = -window_size; i <= window_size; i++) {
            let idx = (this.center_index + i + this.carousel_items.length) % this.carousel_items.length;
            indices.push(idx);
        }
        return indices;
    }

    updateImages() {
        for (const carouselItem of this.carousel_items) {
            let img_url = carouselItem.getAttribute(isPortrait() ? "portrait" : "landscape");
            if (img_url === "") {
                img_url = carouselItem.getAttribute("landscape");
            }
            carouselItem.style.backgroundImage = `url(${img_url})`;
        }
    }

    updateDesktopLayout(direction) {
        const container = this.carousel_item_container;
        const items = this.carousel_items;
        const outer = container.parentElement;
        if (!items.length) return;

        const itemW = items[0].offsetWidth;
        const outerW = outer.clientWidth;
        const totalW = container.scrollWidth;

        // exact maximum scroll so last item is fully visible
        const maxOffset = Math.max(0, totalW - outerW);

        // compute next offset by one item width
        const prevOffset = this.current_offset || 0;
        let newOffset = prevOffset + direction * itemW;

        // clamp between 0 and the true maxOffset
        newOffset = Math.max(0, Math.min(newOffset, maxOffset));

        container.style.transform = `translateX(${-newOffset}px)`;
        this.current_offset = newOffset;

        console.log("Offset:", newOffset, "of", maxOffset);
    }


    update() {
        this.radius = Math.floor(window.innerWidth / 2);

        let window_size = this.carousel_items.length / 2 > this.visible_side_items_count
            ? this.visible_side_items_count
            : Math.floor(this.carousel_items.length / 2);
        if (window_size === 0) window_size = 1;

        const visible_indices = this.getVisibleIndices(window_size);
        const maxZIndex = getMaxZIndex(this.carousel_items.length);
        const visible_indices_set = new Set(visible_indices);

        const sampleItem = this.carousel_items[0];
        const itemWidth = sampleItem.offsetWidth || 100;

// smaller spacingFactor = more overlap (e.g., 0.4 = 60% overlap)
        const overlapFactor = isPortrait() ? 0.8 : 1;

        console.log(visible_indices, this.center_index);
// this.radius is already set
        const angleStep = overlapFactor * 2 * Math.asin((itemWidth * 0.5) / this.radius);
        for (const real_index of visible_indices) {
            const i1 = visible_indices.indexOf(real_index);
            const index_from_center = i1 - window_size;
            const item = this.carousel_items[real_index];


            const item_scale = getScale(index_from_center);

            const angle = index_from_center * angleStep;
            const translateX = this.radius * Math.sin(angle);

            const opacity = getOpacity(index_from_center);
            item.style.visibility = "visible";
            item.style.opacity = "1";
            item.style.zIndex = Math.abs(maxZIndex - Math.abs(index_from_center)).toString();
            item.style.filter = `brightness(${opacity})`;
            item.style.transform = ` translate(-50%, -50%) scale(${item_scale}) translateX(${translateX}px)`;
            visible_indices_set.add(real_index);
        }

        for (const item of this.carousel_items) {
            const idx = this.carousel_items.indexOf(item);
            if (!visible_indices_set.has(idx)) {
                console.log("Resetting");
                item.style.zIndex = "";
                item.style.filter = "";
                item.style.opacity = "";
                item.style.visibility = "";
                item.style.transform = "";
            }
        }

        const id = this.getItemId(this.center_index);
        this.selected_item?.classList.remove("selected");
        this.selected_item = document.getElementById(id);
        this.selected_item?.classList.add("selected");


    }

    resizeCarousel() {
        const container = this.carousel_item_container;

        let totalWidth = 0;

        for (let i = 0; i < this.carousel_items.length; i++) {
            const item = this.carousel_items[i];
            totalWidth += item.offsetWidth;
        }

        container.style.width = `${totalWidth}px`;
        console.log("width", totalWidth);
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

            // Wait for transition to finish (match CSS duration)
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
        img_portrait: "",
        link: "./pages/international/dubai.html",
        price: "1000"
    },
    "SriLanka": {
        img_landscape: "./assets/international/srilanka.jpg",
        img_portrait: "",
        link: "./pages/international/sri-lanka.html",
        price: "1000"
    },
    "Singapore": {
        img_landscape: "./assets/international/singapore.jpg",
        img_portrait: "",
        link: "./pages/international/singapore.html",
        price: "1000"
    },
    "Thailand": {
        img_landscape: "./assets/international/thailand.jpg",
        img_portrait: "",
        link: "./pages/international/thailand.html",
        price: "1000"
    },
    "Nepal": {
        img_landscape: "./assets/international/nepal.jpg",
        img_portrait: "",
        link: "./pages/international/nepal.html",
        price: "1000"
    }
});
new Carousel("domestic-packages", {
    "Spiti Valley": {
        img_landscape: "./assets/domestic/spiti.jpg",
        img_portrait: "",
        link: "./pages/domestic/spiti-valley.html",
        price: "1000"
    },
    "Himachal Pradesh": {
        img_landscape: "./assets/domestic/shimla.jpg",
        img_portrait: "",
        link: "./pages/domestic/himachalpradesh.html",
        price: "1000"
    },
    "Uttrakhand": {
        img_landscape: "./assets/domestic/uttrakhand.jpg",
        img_portrait: "",
        link: "./pages/domestic/uttrakhand.html",
        price: "1000"
    },
    "Kerala": {
        img_landscape: "./assets/domestic/kerala.jpg",
        img_portrait: "",
        link: "./pages/domestic/kerala.html",
        price: "1000"
    },
    "Andaman": {
        img_landscape: "./assets/domestic/andaman.jpg",
        img_portrait: "",
        link: "./pages/domestic/andaman.html",
        price: "1000"
    },
    "Goa": {
        img_landscape: "./assets/domestic/goa.jpeg",
        img_portrait: "",
        link: "./pages/domestic/goa.html",
        price: "1000"
    },
    "Kashmir": {
        img_landscape: "./assets/domestic/kashmir.webp",
        img_portrait: "",
        link: "./pages/domestic/kashmir.html",
        price: "1000"
    },
    "Rajasthan": {
        img_landscape: "./assets/domestic/rajasthan.jpeg",
        img_portrait: "",
        link: "./pages/domestic/rajasthan.html",
        price: "1000"
    },
    "Sikkim": {
        img_landscape: "./assets/domestic/sikkim.jpeg",
        img_portrait: "",
        link: "./pages/domestic/sikkim.html",
        price: "1000"
    },
    "Golden Triangle": {
        img_landscape: "./assets/domestic/goldentemple.jpeg",
        img_portrait: "",
        link: "./pages/domestic/goldentemple.html",
        price: "1000"
    }
});
new Carousel("pilgrimage-packages", {
    "Rameshwaram Madurai Kanyakumari": {
        img_landscape: "./assets/pilgrimage/kanyakumari.jpeg",
        img_portrait: "",
        link: "./pages/pilgrimage/rameshwaram-kanyakumari.html",
        price: "1000"
    },
    "Varanasi Ayodhaya Prayagraj": {
        img_landscape: "./assets/pilgrimage/ayodhya.jpeg",
        img_portrait: "",
        link: "./pages/pilgrimage/varanasi-ayodhaya.html",
        price: "1000"
    },
    "Himachal Shaktipeeths": {
        img_landscape: "./assets/pilgrimage/shaktipeeths.jpeg",
        img_portrait: "",
        link: "./pages/pilgrimage/himachal-shaktipeeths.html",
        price: "1000"
    },
    "Char Dham/Do Dham": {
        img_landscape: "./assets/pilgrimage/chardham.jpeg",
        img_portrait: "",
        link: "./pages/pilgrimage/chardham-dodham.html",
        price: "1000"
    },
    "Vaishano Devi": {
        img_landscape: "./assets/pilgrimage/vaishanodevi.jpeg",
        img_portrait: "",
        link: "./pages/pilgrimage/vaishanodevi.html",
        price: "1000"
    },
    "Golden Temple": {
        img_landscape: "./assets/domestic/goldentemple.jpeg",
        img_portrait: "",
        link: "./pages/pilgrimage/goldentemple.html",
        price: "1000"
    },
    "Pashupatinath": {
        img_landscape: "./assets/pilgrimage/pashupatinath.avif",
        img_portrait: "",
        link: "./pages/pilgrimage/pashupatinath.html",
        price: "1000"
    }
});