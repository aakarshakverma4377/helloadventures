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
    const minOpacity = 0.1;
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
    visible_count = 2;

    constructor(el_id, data) {
        this.parent_id = el_id;
        this.side_items_length = 1;
        // this.el = document.getElementById(el_id)
        this.data = data;
        this.carousel_items = [];


        const parent = document.getElementById(el_id);
        const outer = document.createElement("div");
        const entries = Object.entries(data);
        const maxZIndex = getMaxZIndex(entries.length);
        console.log(maxZIndex);
        this.center_index = entries.length % 2 === 0 ? entries.length / 2 : (entries.length - 1) / 2;
        for (let i = 0; i < entries.length; i++) {
            const [key, entry] = entries[i];
            const para_el = document.createElement("p");
            const bg_el = document.createElement("div");
            const container_el = document.createElement("div");
            const heading_el = document.createElement("h2");
            bg_el.id = this.getItemId(i);
            bg_el.classList.add("carousel-item");
            bg_el.style.backgroundImage = `url(${entry.src})`;
            para_el.innerText = entry.text;
            heading_el.innerText = toTitleCase(key);

            container_el.append(heading_el, para_el);
            bg_el.append(container_el);
            outer.appendChild(bg_el);
            this.carousel_items.push(bg_el);
        }
        const btnLeft = document.createElement("button");
        const btnRight = document.createElement("button");
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

    getVisibleIndices(window_size = this.visible_count) {
        let indices = [];
        for (let i = -window_size; i <= window_size; i++) {
            let idx = (this.center_index + i + this.carousel_items.length) % this.carousel_items.length;
            indices.push(idx);
        }
        return indices;
    }

    getIndexFromCenter(i) {
        return i - this.center_index;
    }


    moveTo(item_index) {
        item_index++;
        if (item_index >= this.carousel_items.length)
            return;
        this.center_index = this.carousel_items.findIndex((el) => el.id === id);

        this.update();
    }

    update() {
        this.radius = Math.floor((window.innerWidth * 0.1) / 2);

        let window_size = this.carousel_items.length / 2 > this.visible_count ? this.visible_count : Math.floor(this.carousel_items.length / 2);
        if (window_size === 0)
            window_size = 1;
        const visible_indices = this.getVisibleIndices(window_size);
        const maxZIndex = getMaxZIndex(this.carousel_items.length);
        const visible_indices_set = new Set(visible_indices);
        const maxAngle = Math.PI / 3; // 60° total arc
        console.log(visible_indices, this.center_index, maxZIndex);
        for (const real_index of visible_indices) {
            const i1 = visible_indices.indexOf(real_index);
            const item = this.carousel_items[real_index];
            const index_from_center = i1 - window_size; // -k ... 0 ... +k
            const item_scale = getScale(index_from_center);
            const opacity = getOpacity(index_from_center);

            const angleStep = maxAngle / (window_size);
            const angle = index_from_center * angleStep;

            const translateX = this.radius * Math.sin(angle);
            console.log(item.id, index_from_center, translateX);

            item.style.zIndex = Math.abs(maxZIndex - Math.abs(index_from_center)).toString();
            item.style.transform = `translateX(${translateX}%) translateY(-50%) scale(${item_scale})`;
            item.style.opacity = opacity.toString();
            item.style.visibility = "visible";

            visible_indices_set.add(real_index);

        }
        // First, mark all items as hidden
        this.carousel_items.forEach((item, idx) => {
            if (!visible_indices_set.has(idx)) {
                item.style.visibility = "";
                item.style.transform = "";
                item.style.zIndex = "";
                item.style.opacity = "";
            }

        });
        console.log(this.center_index);
        const id = this.getItemId(this.center_index);
        this.selected_item?.classList.remove("selected");
        this.selected_item = document.getElementById(id);
        this.selected_item?.classList.add("selected");
    }


    getItemId(item_index) {
        return this.parent_id + "_carousel_item_" + item_index.toString();
    }

    moveRight() {
        this.center_index = (this.center_index + 1) % (this.carousel_items.length);
        this.update();
    }

    moveLeft() {
        let new_index = this.center_index - 1;
        if (new_index < 0)
            new_index = this.carousel_items.length - 1;
        this.center_index = new_index;
        this.update();
    }


}

new Carousel("international-packages", {
    "London": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "New York": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "New Jersey": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    }
});
new Carousel("domestic-packages", {
    "andaman": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "daman": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "goa": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "Raipur": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "Shimla": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "Nicobar": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    }
});
new Carousel("pilgrimage-packages", {
    "Vaishno Devi": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "Kali ka Tibba": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "Vaishno Devi": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
    "Haridwar": {
        src: "./spiti.jpg",
        text: "In the fertile delta of the river ganges, flourished ancient kingdoms and centres of learning"
    },
});