const data = {};

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

class Carousel {
    radius = 200;
    visible_side_items = 2;
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
        const entries = Object.entries(data);
        this.center_index = entries.length % 2 === 0 ? entries.length / 2 : (entries.length - 1) / 2;
        for (let i = 0; i < entries.length; i++) {
            const [key, entry] = entries[i];
            const para_el = document.createElement("p");
            const bg_el = document.createElement("a");
            const container_el = document.createElement("div");
            const heading_el = document.createElement("h2");
            bg_el.id = this.getItemId(i);
            bg_el.classList.add("carousel-item");
            bg_el.style.backgroundImage = `url(${entry.src})`;
            bg_el.href = entry.link;
            bg_el.target = "_blank";
            bg_el.rel = "noopener noreferrer";
            para_el.innerText = entry.text;
            heading_el.innerText = toTitleCase(key) + " - ₹" + entry.price ;

            container_el.append(heading_el, para_el);
            bg_el.append(container_el);
            outer.appendChild(bg_el);
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
        parent.append(outer, btnLeft, btnRight);
        outer.classList.add("carousel");


        window.addEventListener("resize", () => {
            this.update();
        });
        this.update();

    }

    getVisibleIndices(window_size = this.visible_side_items) {
        let indices = [];
        for (let i = -window_size; i <= window_size; i++) {
            let idx = (this.center_index + i + this.carousel_items.length) % this.carousel_items.length;
            indices.push(idx);
        }
        return indices;
    }

    update() {
        this.radius = Math.floor(window.innerWidth / 2);

        let window_size = this.carousel_items.length / 2 > this.visible_side_items
            ? this.visible_side_items
            : Math.floor(this.carousel_items.length / 2);
        if (window_size === 0) window_size = 1;

        const visible_indices = this.getVisibleIndices(window_size);
        const maxZIndex = getMaxZIndex(this.carousel_items.length);
        const visible_indices_set = new Set(visible_indices);

        const sampleItem = this.carousel_items[0];
        const itemWidth = sampleItem.offsetWidth || 100;

// smaller spacingFactor = more overlap (e.g., 0.6 = 40% overlap)
        const overlapFactor = 0.6;

        console.log(visible_indices, this.center_index);
// this.radius is already set
        const angleStep = overlapFactor * 2 * Math.asin((itemWidth * 0.5) / this.radius);
        for (const real_index of visible_indices) {
            const i1 = visible_indices.indexOf(real_index);
            const index_from_center = i1 - window_size;
            const item = this.carousel_items[real_index];

            const item_scale = getScale(index_from_center);
            const opacity = getOpacity(index_from_center);

            const angle = index_from_center * angleStep;
            const translateX = this.radius * Math.sin(angle);

            item.style.zIndex = Math.abs(maxZIndex - Math.abs(index_from_center)).toString();
            item.style.transform = `translateX(${translateX}px) translateY(-50%) scale(${item_scale})`;
            item.style.opacity = "1";
            // item.style.opacity = opacity.toString();
            item.style.visibility = "visible";
            item.style.filter = `brightness(${opacity})`;
            visible_indices_set.add(real_index);
        }

        for (const item of this.carousel_items) {
            const idx = this.carousel_items.indexOf(item);
            if (!visible_indices_set.has(idx)) {
                console.log("Resetting");
                item.style.zIndex = "-1";
                item.style.filter = "";
            }
        }

        const id = this.getItemId(this.center_index);
        this.selected_item?.classList.remove("selected");
        this.selected_item = document.getElementById(id);
        this.selected_item?.classList.add("selected");
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

            // Wait for transition to finish (match CSS duration)
            await new Promise(resolve => setTimeout(resolve, this.animation_time_ms));
        }

        this.is_animating = false;
    }

    getItemId(item_index) {
        return this.parent_id + "_carousel_item_" + item_index.toString();
    }

    moveLeft() {
        this.enqueueMove(-1);
    }

    moveRight() {
        this.enqueueMove(1);
    }

}

new Carousel("international-packages", {
    "Dubai": {
        src: "./assets/dubaicarouselimage.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/international/dubai.html",
        price: "1000"
    },
    "SriLanka": {
        src: "./assets/srilankacarouselimage.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/international/sri-lanka.html",
        price: "1000"
    },
    "Singapore": {
        src: "./assets/singaporecarouselimage.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/international/singapore.html",
        price: "1000"
    },
    "Thailand": {
        src: "./assets/thailandcarouselimage.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/international/thailand.html",
        price: "1000"
    },
    "Nepal": {
        src: "./assets/nepalcarouselimage.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/international/nepal.html",
        price: "1000"
    },
});
new Carousel("domestic-packages", {
    "Spiti Valley": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/spiti-valley.html",
        price: "1000"
    },
    "Himachal Pradesh": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/himachalpradesh.html",
        price: "1000"
    },
    "Uttrakhand": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/uttrakhand.html",
        price: "1000"
    },
    "Kerala": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/kerala.html",
        price: "1000"
    },
    "Andaman": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/andaman.html",
        price: "1000"
    },
    "Goa": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/goa.html",
        price: "1000"
    },
    "Kashmir": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/kashmir.html",
        price: "1000"
    },
    "Rajasthan": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/rajasthan.html",
        price: "1000"
    },
    "Sikkim": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/sikkim.html",
        price: "1000"
    },
    "Golden Triangle": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/domestic/goldentemple.html",
        price: "1000"
    },
});
new Carousel("pilgrimage-packages", {
    "Rameshwaram Madurai Kanyakumari": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/pilgrimage/rameshwaram-kanyakumari.html",
        price: "1000"
    },
    "Varanasi Ayodhaya Prayagraj": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/pilgrimage/varanasi-ayodhaya.html",
        price: "1000"
    },
    "Himachal Shaktipeeths": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/pilgrimage/himachal-shaktipeeths.html",
        price: "1000"
    },
    "Char Dham/Do Dham": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/pilgrimage/chardham-dodham.html",
        price: "1000"
    },
    "Vaishano Devi": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/pilgrimage/vaishanodevi.html",
        price: "1000"
    },
    "Golden Temple": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/pilgrimage/goldentemple.html",
        price: "1000"
    },
    "Pashupatinath": {
        src: "./assets/spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning",
        link: "./pages/pilgrimage/pashupatinath.html",
        price: "1000"
    },
});