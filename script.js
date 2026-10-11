const PICTURES = [
    { src: "images/pic-1.jpg", title: "Black Hole" },
    { src: "images/pic-2.jpg", title: "Castle in the Mist" },
    { src: "images/pic-3.jpg", title: "Rainy Evening" },
    { src: "images/pic-4.jpg", title: "Tulips" },
    { src: "images/pic-5.jpg", title: "White Sports Car" },
    { src: "images/pic-6.jpg", title: "Moon Quotes" },
    { src: "images/pic-7.jpg", title: "Full Moon" }
];

const AUTO_SPEED = 14;
const DRAG_FACTOR = 0.35;
const RADIUS_GAP = 1.45;

const scene = document.getElementById("scene");
const ring = document.getElementById("ring");
const titleEl = document.getElementById("title");
const countEl = document.getElementById("count");
const dotsEl = document.getElementById("dots");
const modeButton = document.getElementById("mode");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");

const total = PICTURES.length;
const step = 360 / total;

const cards = [];
const dots = [];

let angle = 0;
let velocity = 0;
let target = null;
let autoplay = false;
let wheelTimer = null;
let dragging = false;
let lastX = 0;
let lastMove = 0;
let lastFrame = 0;
let activeIndex = -1;

function pad(number) {
    return String(number).padStart(2, "0");
}

function nearestStop(value) {
    return Math.round(value / step) * step;
}

function build() {
    PICTURES.forEach((picture, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.setProperty("--a", index * step + "deg");

        const image = document.createElement("img");
        image.src = picture.src;
        image.alt = picture.title;
        image.draggable = false;

        card.appendChild(image);
        ring.appendChild(card);
        cards.push(card);

        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", picture.title);
        dot.addEventListener("click", () => goTo(index));

        dotsEl.appendChild(dot);
        dots.push(dot);
    });
}

function setRadius() {
    const width = cards[0].offsetWidth;
    const radius = (width / 2 / Math.tan(Math.PI / total)) * RADIUS_GAP;
    ring.style.setProperty("--radius", radius + "px");
}

function updateActive(index) {
    if (index === activeIndex) {
        return;
    }

    activeIndex = index;
    titleEl.textContent = PICTURES[index].title;
    countEl.textContent = pad(index + 1) + " / " + pad(total);

    dots.forEach((dot, dotIndex) => {
        const on = dotIndex === index;
        dot.classList.toggle("active", on);
        dot.setAttribute("aria-selected", String(on));
    });
}

function render() {
    ring.style.setProperty("--spin", angle + "deg");

    cards.forEach((card, index) => {
        const facing = Math.cos(((index * step + angle) * Math.PI) / 180);
        const shade = 0.6 + 0.4 * ((facing + 1) / 2);
        card.style.setProperty("--shade", shade.toFixed(3));
    });

    const front = Math.round(-angle / step);
    updateActive(((front % total) + total) % total);
}

function frame(time) {
    const dt = Math.min(0.05, (time - lastFrame) / 1000 || 0);
    lastFrame = time;

    if (dragging) {
        velocity *= 0.9;
    } else if (target !== null) {
        const diff = target - angle;
        angle += diff * Math.min(1, dt * 6);

        if (Math.abs(diff) < 0.05) {
            angle = target;
            target = null;
        }
    } else if (Math.abs(velocity) > 25) {
        angle += velocity * dt;
        velocity *= Math.pow(0.05, dt);
    } else if (velocity !== 0) {
        velocity = 0;
        target = nearestStop(angle);
    } else if (autoplay) {
        angle -= AUTO_SPEED * dt;
    }

    render();
    requestAnimationFrame(frame);
}

function currentStop() {
    return target !== null ? target : nearestStop(angle);
}

function next() {
    velocity = 0;
    target = currentStop() - step;
}

function prev() {
    velocity = 0;
    target = currentStop() + step;
}

function goTo(index) {
    const base = -index * step;
    const turns = Math.round((angle - base) / 360);
    velocity = 0;
    target = base + turns * 360;
}

function setAutoplay(value) {
    autoplay = value;
    modeButton.classList.toggle("on", autoplay);
    modeButton.setAttribute("aria-checked", String(autoplay));
}

function onWheel(event) {
    event.preventDefault();
    target = null;
    velocity = 0;
    angle -= event.deltaY * 0.12;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
        target = nearestStop(angle);
    }, 160);
}

function onPointerDown(event) {
    dragging = true;
    target = null;
    velocity = 0;
    lastX = event.clientX;
    lastMove = event.timeStamp;
    scene.classList.add("dragging");
    scene.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
    if (!dragging) {
        return;
    }

    const dx = event.clientX - lastX;
    const dt = Math.max(1, event.timeStamp - lastMove) / 1000;
    const delta = dx * DRAG_FACTOR;

    angle += delta;
    velocity = velocity * 0.5 + (delta / dt) * 0.5;
    lastX = event.clientX;
    lastMove = event.timeStamp;
}

function onPointerUp(event) {
    if (!dragging) {
        return;
    }

    dragging = false;
    scene.classList.remove("dragging");

    if (event.timeStamp - lastMove > 90) {
        velocity = 0;
    }

    if (Math.abs(velocity) <= 25) {
        velocity = 0;
        target = nearestStop(angle);
    }
}

function onKeyDown(event) {
    if (event.key === "ArrowRight") {
        next();
    } else if (event.key === "ArrowLeft") {
        prev();
    } else if (event.key === " " && event.target === document.body) {
        event.preventDefault();
        setAutoplay(!autoplay);
    }
}

build();
setRadius();
setAutoplay(autoplay);
render();

scene.addEventListener("pointerdown", onPointerDown);
scene.addEventListener("pointermove", onPointerMove);
scene.addEventListener("pointerup", onPointerUp);
scene.addEventListener("pointercancel", onPointerUp);
scene.addEventListener("wheel", onWheel, { passive: false });

nextButton.addEventListener("click", next);
prevButton.addEventListener("click", prev);
modeButton.addEventListener("click", () => setAutoplay(!autoplay));

document.addEventListener("keydown", onKeyDown);
window.addEventListener("resize", setRadius);

requestAnimationFrame(frame);
