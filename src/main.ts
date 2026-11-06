
type LightName = 'red' | 'green' | 'blue';

interface Spotlight {
    name: LightName;
    colour: string;
    x: number;
    y: number;
    enabled: boolean;
}

interface Point {
    x: number;
    y: number;
}

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const spotlights: Spotlight[] = [
    { name: 'red',   colour: '#ff0000', x: 0.40, y: 0.42, enabled: true },
    { name: 'green', colour: '#00ff00', x: 0.60, y: 0.42, enabled: true },
    { name: 'blue',  colour: '#0000ff', x: 0.50, y: 0.60, enabled: true },
];

let radius = 150;

let dragging: Spotlight | null = null;
let activePointerId: number | null = null;
let dragOffset: Point = { x: 0, y: 0 };

// --------------------------------------------------
// Interface
// --------------------------------------------------

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
    <div class="controls">
        <label>
            <input type="checkbox" id="red-toggle" checked>
            Red
        </label>

        <label>
            <input type="checkbox" id="green-toggle" checked>
            Green
        </label>

        <label>
            <input type="checkbox" id="blue-toggle" checked>
            Blue
        </label>

        <label>
            Spotlight size:
            <input
                type="range"
                id="size-slider"
                min="40"
                max="300"
                step="5"
                value="150"
            >
            <output id="size-value">150 px</output>
        </label>
    </div>

    <canvas id="mix-canvas"></canvas>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#mix-canvas')!;
const ctx = canvas.getContext('2d')!;

// --------------------------------------------------
// Utility functions
// --------------------------------------------------

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getPointerPosition(event: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function getSpotlightPosition(light: Spotlight): Point {
    return {
        x: light.x * canvas.clientWidth,
        y: light.y * canvas.clientHeight
    };
}

// --------------------------------------------------
// Rendering
// --------------------------------------------------

function render(): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Additive RGB colour mixing
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const light of spotlights) {
        if (!light.enabled) continue;

        const position = getSpotlightPosition(light);

        ctx.beginPath();
        ctx.arc(
            position.x,
            position.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = light.colour;
        ctx.fill();
    }

    ctx.restore();
}

// --------------------------------------------------
// Canvas resizing
// --------------------------------------------------

function resizeCanvas(): void {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    render();
}

const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(canvas);

// --------------------------------------------------
// Spotlight selection
// --------------------------------------------------

function findSpotlight(x: number, y: number): Spotlight | null {
    // Search in reverse drawing order
    for (let i = spotlights.length - 1; i >= 0; i--) {
        const light = spotlights[i];

        if (!light.enabled) continue;

        const position = getSpotlightPosition(light);

        const dx = x - position.x;
        const dy = y - position.y;

        if (dx * dx + dy * dy <= radius * radius) {
            return light;
        }
    }

    return null;
}

// --------------------------------------------------
// Pointer handling
// --------------------------------------------------

function startDragging(event: PointerEvent): void {
    if (dragging) return;

    const pointer = getPointerPosition(event);
    const light = findSpotlight(pointer.x, pointer.y);

    if (!light) return;

    const position = getSpotlightPosition(light);

    dragging = light;
    activePointerId = event.pointerId;

    dragOffset = {
        x: pointer.x - position.x,
        y: pointer.y - position.y
    };

    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
}

function movePointer(event: PointerEvent): void {
    const pointer = getPointerPosition(event);

    if (dragging && event.pointerId === activePointerId) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (width === 0 || height === 0) return;

        dragging.x = clamp(
            (pointer.x - dragOffset.x) / width,
            0,
            1
        );

        dragging.y = clamp(
            (pointer.y - dragOffset.y) / height,
            0,
            1
        );

        render();
    } else if (!dragging) {
        const hovered = findSpotlight(pointer.x, pointer.y);
        canvas.style.cursor = hovered ? 'grab' : 'default';
    }
}

function stopDragging(event: PointerEvent): void {
    if (event.pointerId !== activePointerId) return;

    dragging = null;
    activePointerId = null;
    canvas.style.cursor = 'default';
}

canvas.addEventListener('pointerdown', startDragging);
canvas.addEventListener('pointermove', movePointer);
canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);
canvas.addEventListener('lostpointercapture', stopDragging);

// --------------------------------------------------
// Spotlight controls
// --------------------------------------------------

function setupLightControls(): void {
    for (const light of spotlights) {
        const checkbox = document.querySelector<HTMLInputElement>(
            `#${light.name}-toggle`
        )!;

        checkbox.addEventListener('change', () => {
            light.enabled = checkbox.checked;

            if (!light.enabled && dragging === light) {
                dragging = null;
                activePointerId = null;
                canvas.style.cursor = 'default';
            }

            render();
        });
    }
}

// --------------------------------------------------
// Size control
// --------------------------------------------------

function setupSizeControl(): void {
    const slider = document.querySelector<HTMLInputElement>('#size-slider')!;
    const output = document.querySelector<HTMLOutputElement>('#size-value')!;

    slider.addEventListener('input', () => {
        radius = Number(slider.value);
        output.textContent = `${radius} px`;

        render();
    });
}

// --------------------------------------------------
// Initialisation
// --------------------------------------------------

function initialise(): void {
    setupLightControls();
    setupSizeControl();
    resizeCanvas();
}

initialise();
