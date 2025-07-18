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

        window.addEventListener("resize", (e) => {
            for (const item of this.carousel_items) {
                item.style.visibility = "";
                item.style.opacity = "";
                item.style.zIndex = "";
                item.style.filter = "";
                item.style.transform = "";
            }
            this.update();
            this.updateImages();
        });

        console.log(this.carousel_item_container);
        this.startX = 0;
        this.deltaX = 0;
        this.isDragging = false;

        this.carousel_item_container.addEventListener("touchstart", (e) => {
            this.isDragging = true;
            this.startX = e.touches[0].clientX;
            this.deltaX = 0;
        });

        this.carousel_item_container.addEventListener("touchmove", (e) => {
            if (!this.isDragging) return;

            this.deltaX = e.touches[0].clientX - this.startX;
            if(Math.abs(this.deltaX)>0.1){
                e.preventDefault();
                this.updateDuringDrag(this.deltaX);
            }
        }, {passive: false, capture: true});

        window.addEventListener("touchend", () => {
            if(this.isDragging){
                this.isDragging = false;
                this.snapToClosestItem(this.deltaX);
            }

        });
        this.update();
        this.updateImages();

    }


    updateImages() {
        for (const carouselItem of this.carousel_items) {
            let img_url = carouselItem.getAttribute(isPortrait() ? "portrait" : "landscape");
            carouselItem.style.backgroundImage = `url(${img_url})`;
        }
    }

    snapToClosestItem(deltaX) {
        const sampleItem = this.carousel_items[0];
        const itemWidth = sampleItem.offsetWidth || 100;
        const spacing = itemWidth * 0.5;

        const fractional_offset = -deltaX / spacing;
        const direction = Math.round(fractional_offset);

        if (direction !== 0) {
            this.center_index = (this.center_index + direction + this.carousel_items.length) % this.carousel_items.length;
        }
        // Enable transition
        for (const item of this.carousel_items) {
            item.classList.add("transitioned-transform");
        }
        this.update();
    }

    renderVisibleItemsUsingVirtualIndex(virtualIndex) {
        const items = this.carousel_items;
        const count = items.length;
        const itemWidth = items[0].offsetWidth || 100;
        const spacing = itemWidth * 0.5;
        const maxZIndex = getMaxZIndex(count);

        const containerRect = this.carousel_item_container.getBoundingClientRect();
        const outerRect = this.carousel_item_container.parentElement.getBoundingClientRect();
        const centerPixel = (outerRect.left + outerRect.width / 2) - containerRect.left;

        for (let i = 0; i < count; i++) {
            const item = items[i];
            let offset = ((i - virtualIndex + count + count / 2) % count) - count / 2;


            const translateX = centerPixel + offset * spacing - itemWidth / 2;
            const scale = getScale(offset);
            const opacity = getOpacity(offset);

            item.style.zIndex = (maxZIndex - Math.abs(Math.round(offset))).toString();
            item.style.filter = `brightness(${opacity})`;
            item.style.transform = `translate(${translateX}px, -50%) scale(${scale})`;
        }
    }

    updateDuringDrag(delta) {
        const itemWidth = this.carousel_items[0].offsetWidth || 100;
        const fractional_offset = -delta / (itemWidth * 0.5);
        for (const item of this.carousel_items) {
            item.classList.remove("transitioned-transform");
        }

        const virtual_index = this.center_index + fractional_offset;
        this.renderVisibleItemsUsingVirtualIndex(virtual_index);
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
        const spacing = itemWidth * 0.5;
        const visibleRange = Math.floor(count / 2);
        const maxZIndex = getMaxZIndex(count);

        for (let offset = -visibleRange; offset <= visibleRange; offset++) {
            const index = (this.center_index + offset + count) % count;
            const item = items[index];

            const index_from_center = offset;
            const item_scale = getScale(index_from_center);
            const opacity = getOpacity(index_from_center);
            const translateX = centerPixel + index_from_center * spacing - itemWidth / 2;

            item.classList.add("transitioned-transform");
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
        img_portrait: "./assets/phone/international/dubaiphone.jpeg",
        link: "./pages/international/dubai.html",
        price: "1000"
    },
    "SriLanka": {
        img_landscape: "./assets/international/srilanka.jpg",
        img_portrait: "./assets/phone/international/srilankaphone.jpeg",
        link: "./pages/international/sri-lanka.html",
        price: "1000"
    },
    "Singapore": {
        img_landscape: "./assets/international/singapore.jpg",
        img_portrait: "./assets/phone/international/singaporephone.jpeg",
        link: "./pages/international/singapore.html",
        price: "1000"
    },
    "Thailand": {
        img_landscape: "./assets/international/thailand.jpg",
        img_portrait: "./assets/phone/international/thailandphone.jpeg",
        link: "./pages/international/thailand.html",
        price: "1000"
    },
    "Nepal": {
        img_landscape: "./assets/international/nepal.jpg",
        img_portrait: "./assets/phone/international/nepalphone.jpeg",
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
        img_portrait: "./assets/phone/domestic/hpphone.jpeg",
        link: "./pages/domestic/himachalpradesh.html",
        price: "1000"
    },
    "Uttrakhand": {
        img_landscape: "./assets/domestic/uttrakhand.jpg",
        img_portrait: "./assets/phone/domestic/uttrakhandphone.jpeg",
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
        img_portrait: "./assets/phone/domestic/andamanphone.jpeg",
        link: "./pages/domestic/andaman.html",
        price: "1000"
    },
    "Goa": {
        img_landscape: "./assets/domestic/goa.jpeg",
        img_portrait: "./assets/phone/domestic/goaphone.jpg",
        link: "./pages/domestic/goa.html",
        price: "1000"
    },
    "Kashmir": {
        img_landscape: "./assets/domestic/kashmir.webp",
        img_portrait: "./assets/phone/domestic/kashmirphone.jpeg",
        link: "./pages/domestic/kashmir.html",
        price: "1000"
    },
    "Rajasthan": {
        img_landscape: "./assets/domestic/rajasthan.jpeg",
        img_portrait: "./assets/phone/domestic/rajasthanphone.jpg",
        link: "./pages/domestic/rajasthan.html",
        price: "1000"
    },
    "Sikkim": {
        img_landscape: "./assets/domestic/sikkim.jpeg",
        img_portrait: "./assets/phone/domestic/sikkimphone.jpeg",
        link: "./pages/domestic/sikkim.html",
        price: "1000"
    },
    "Golden Triangle": {
        img_landscape: "./assets/domestic/goldentemple.jpeg",
        img_portrait: "./assets/phone/domestic/goldentrianglephone.jpeg",
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