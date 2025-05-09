const WIDTH = 200, HEIGHT = 200;
const dt = 1.0;
const params = { DU: 0.16, DV: 0.08, F: 0.06, K: 0.062 };
let u, v, u_next, v_next;
let audioCtx = null;

const noteFrequencyMap = {
    "C": 261.63,
    "C#": 277.18, "Db": 277.18,
    "D": 293.66,
    "D#": 311.13, "Eb": 311.13,
    "E": 329.63,
    "F": 349.23,
    "F#": 369.99, "Gb": 369.99,
    "G": 392.00,
    "G#": 415.30, "Ab": 415.30,
    "A": 440.00,
    "A#": 466.16, "Bb": 466.16,
    "B": 493.88
};

const simCanvas = document.createElement('canvas');
simCanvas.width = WIDTH;
simCanvas.height = HEIGHT;
const simCtx = simCanvas.getContext('2d');

const overlayCanvas = document.getElementById('overlay');
const overlayCtx = overlayCanvas.getContext('2d');

function createGrid(val) {
    return Array.from({ length: HEIGHT }, () => new Float32Array(WIDTH).fill(val));
}

const blueOverlay = createGrid(0);

function reset() {
    u = createGrid(1);
    v = createGrid(0);
    u_next = createGrid(0);
    v_next = createGrid(0);
    for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
        const dx = x - WIDTH / 2;
        const dy = y - HEIGHT / 2;
        if (dx * dx + dy * dy < 400) {
        v[y][x] = Math.random() * 0.5 + 0.5;
        u[y][x] = 1 - v[y][x];
        }
        blueOverlay[y][x] = 0;
    }
    }
}

function lap(grid, x, y) {
    const l = grid[y][(x - 1 + WIDTH) % WIDTH];
    const r = grid[y][(x + 1) % WIDTH];
    const u_ = grid[(y - 1 + HEIGHT) % HEIGHT][x];
    const d = grid[(y + 1) % HEIGHT][x];
    return l + r + u_ + d - 4 * grid[y][x];
}

function updateRD() {
    params.DU = parseFloat(document.getElementById("DU").value);
    params.DV = parseFloat(document.getElementById("DV").value);
    params.F  = parseFloat(document.getElementById("F").value);
    params.K  = parseFloat(document.getElementById("K").value);
    for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
        const a = u[y][x], b = v[y][x];
        const ua = lap(u, x, y);
        const vb = lap(v, x, y);
        const uvv = a * b * b;
        u_next[y][x] = a + (params.DU * ua - uvv + params.F * (1 - a)) * dt;
        v_next[y][x] = b + (params.DV * vb + uvv - (params.F + params.K) * b) * dt;
    }
    }
    [u, u_next] = [u_next, u];
    [v, v_next] = [v_next, v];
}

function smoothstep(x) { return x * x * (3 - 2 * x); }
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
function proceduralColor(val) {
    val = Math.max(0, Math.min(1, val));
    const t = smoothstep(val);
    const base = hexToRgb(document.getElementById("baseColor").value);
    const highlight = hexToRgb(document.getElementById("highlightColor").value);
    return [
    Math.floor(base[0] + t * (highlight[0] - base[0])),
    Math.floor(base[1] + t * (highlight[1] - base[1])),
    Math.floor(base[2] + t * (highlight[2] - base[2]))
    ];
}

function drawRD() {
    const imageData = simCtx.getImageData(0, 0, WIDTH, HEIGHT);
    for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
        const i = (y * WIDTH + x) * 4;
        if (blueOverlay[y][x] > 0) {
        imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = 255;
        } else {
        const [r, g, b] = proceduralColor(v[y][x]);
        imageData.data[i] = r;
        imageData.data[i+1] = g;
        imageData.data[i+2] = b;
        }
        imageData.data[i+3] = 255;
    }
    }
    simCtx.putImageData(imageData, 0, 0);
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
        overlayCtx.drawImage(simCanvas, col*WIDTH, row*HEIGHT, WIDTH, HEIGHT);
    }
    }
    drawHardcodedTonnetz(overlayCtx);
}

const tonnetzGrid = [
    ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"],
    ["E♭", "B♭", "F", "C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭"],
    ["B", "F♯", "D", "A♭", "E♭", "B♭", "F", "C", "G", "D", "A", "E"],
    ["D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F", "C", "G"],
    ["B♭", "F", "C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭"],
    ["D♭", "A♭", "E♭", "B♭", "F", "C", "G", "D", "A", "E", "B", "F♯"]
];
const numRows = tonnetzGrid.length;
const numCols = tonnetzGrid[0].length;
const L = 40;
const marginY = 20;
const h = (overlayCanvas.height - 2 * marginY) / (numRows - 1);

let gridPoints = [];
for (let row = 0; row < numRows; row++) {
    gridPoints[row] = [];
    const offsetX = (row % 2) * (L / 2);
    for (let col = 0; col < numCols; col++) {
    const x = offsetX + col * L;
    const y = marginY + row * h;
    gridPoints[row][col] = { x, y, note: tonnetzGrid[row][col] };
    }
}

function drawHardcodedTonnetz(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols - 1; col++) {
        const pt1 = gridPoints[row][col];
        const pt2 = gridPoints[row][col+1];
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
    }
    }
    for (let row = 0; row < numRows - 1; row++) {
    if (row % 2 === 0) {
        for (let col = 0; col < numCols; col++) {
        const pt = gridPoints[row][col];
        if (col > 0) {
            const diagLeft = gridPoints[row+1][col-1];
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(diagLeft.x, diagLeft.y);
            ctx.stroke();
        }
        const diagSame = gridPoints[row+1][col];
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(diagSame.x, diagSame.y);
        ctx.stroke();
        }
    } else {
        for (let col = 0; col < numCols; col++) {
        const pt = gridPoints[row][col];
        const diagSame = gridPoints[row+1][col];
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(diagSame.x, diagSame.y);
        ctx.stroke();
        if (col < numCols - 1) {
            const diagRight = gridPoints[row+1][col+1];
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(diagRight.x, diagRight.y);
            ctx.stroke();
        }
        }
    }
    }
    for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
        const pt = gridPoints[row][col];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText(pt.note, pt.x, pt.y - 5);
    }
    }
    ctx.restore();
}

const visCanvas = document.getElementById("interpCanvas");
const visCtx = visCanvas.getContext("2d");
const visCenter = { x: 50, y: 50 };
function drawInterpolationVisualization(candidates, weightedPos) {
    visCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);
    visCtx.strokeStyle = "white";
    visCtx.beginPath();
    visCtx.arc(visCenter.x, visCenter.y, 5, 0, 2 * Math.PI);
    visCtx.stroke();
    visCtx.font = "10px sans-serif";
    candidates.forEach(c => {
    let dx = c.pt.x - c.clickPt.x;
    let dy = c.pt.y - c.clickPt.y;
    let vx = visCenter.x + dx;
    let vy = visCenter.y + dy;
    visCtx.fillStyle = "cyan";
    visCtx.beginPath();
    visCtx.arc(vx, vy, 3, 0, 2 * Math.PI);
    visCtx.fill();
    visCtx.fillText(c.pt.note, vx, vy - 5);
    });
    let dx = weightedPos.x - weightedPos.clickPt.x;
    let dy = weightedPos.y - weightedPos.clickPt.y;
    let avgVx = visCenter.x + dx;
    let avgVy = visCenter.y + dy;
    visCtx.fillStyle = "red";
    visCtx.beginPath();
    visCtx.arc(avgVx, avgVy, 4, 0, 2 * Math.PI);
    visCtx.fill();
}

function playBasicTone(freq, type, vol = 0.2) {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}
function playSynthTone(freq, vol = 0.2) {
    playBasicTone(freq, "sine", vol);
}
function playFMSynthTone(freq, vol = 0.2) {
    let mod = audioCtx.createOscillator();
    let modGain = audioCtx.createGain();
    let carrier = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    mod.frequency.setValueAtTime(freq * 2, audioCtx.currentTime);
    modGain.gain.setValueAtTime(50, audioCtx.currentTime);
    mod.connect(modGain);
    carrier.frequency.setValueAtTime(freq, audioCtx.currentTime);
    modGain.connect(carrier.frequency);
    gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    carrier.connect(gain);
    gain.connect(audioCtx.destination);
    mod.start();
    carrier.start();
    mod.stop(audioCtx.currentTime + 0.5);
    carrier.stop(audioCtx.currentTime + 0.5);
}
function playBellTone(freq, vol = 0.2) {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
}
function playOrganTone(freq, vol = 0.2) {
    let osc1 = audioCtx.createOscillator();
    let osc2 = audioCtx.createOscillator();
    osc1.type = "square";
    osc2.type = "square";
    osc1.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(freq * 1.01, audioCtx.currentTime);
    let gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.8);
    osc2.stop(audioCtx.currentTime + 0.8);
}

function handleInterpolatedNote(e) {
    if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const rect = overlayCanvas.getBoundingClientRect();
    const clickPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    let allPoints = [];
    for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
        const pt = gridPoints[row][col];
        const dx = clickPt.x - pt.x;
        const dy = clickPt.y - pt.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        allPoints.push({ pt, distance: d, clickPt });
    }
    }
    allPoints.sort((a, b) => a.distance - b.distance);
    const selected = allPoints.slice(0, 3);

    const epsilon = 0.001;
    let totalWeight = 0, weightedFreqSum = 0;
    let avgX = 0, avgY = 0;
    let candidateInfo = [];
    selected.forEach(c => {
    let w = 1 / (c.distance + epsilon);
    totalWeight += w;
    let cleanNote = c.pt.note.replace("♯", "#").replace("♭", "b");
    let freq = noteFrequencyMap[cleanNote];
    weightedFreqSum += w * freq;
    avgX += w * c.pt.x;
    avgY += w * c.pt.y;
    candidateInfo.push(`${c.pt.note}(${w.toFixed(2)})`);
    });
    const interpFreq = weightedFreqSum / totalWeight;
    const avgPos = { x: avgX / totalWeight, y: avgY / totalWeight, clickPt };

    const mode = document.getElementById("modeSlider").value;
    const instrument = document.getElementById("instrumentSelect").value;
    
    if (mode == 0) {
    if (instrument.startsWith("basic-")) {
        let oscType = instrument.split("-")[1];
        playBasicTone(interpFreq, oscType);
    } else if (instrument === "fm") {
        playFMSynthTone(interpFreq);
    } else if (instrument === "bell") {
        playBellTone(interpFreq);
    } else if (instrument === "organ") {
        playOrganTone(interpFreq);
    } else {
        playSynthTone(interpFreq);
    }
    } else {
    selected.forEach(c => {
        let w = 1 / (c.distance + epsilon);
        let volume = (w / totalWeight) * 0.3;
        let cleanNote = c.pt.note.replace("♯", "#").replace("♭", "b");
        let freq = noteFrequencyMap[cleanNote];
        if (instrument.startsWith("basic-")) {
        let oscType = instrument.split("-")[1];
        playBasicTone(freq, oscType, volume);
        } else if (instrument === "fm") {
        playFMSynthTone(freq, volume);
        } else if (instrument === "bell") {
        playBellTone(freq, volume);
        } else if (instrument === "organ") {
        playOrganTone(freq, volume);
        } else {
        playSynthTone(freq, volume);
        }
    });
    }

    let simX = Math.floor(avgPos.x) % WIDTH;
    let simY = Math.floor(avgPos.y) % HEIGHT;
    const disturbRadius = 10;
    for (let j = -disturbRadius; j <= disturbRadius; j++) {
    for (let i = -disturbRadius; i <= disturbRadius; i++) {
        if (i * i + j * j <= disturbRadius * disturbRadius) {
        const gridX = (simX + i + WIDTH) % WIDTH;
        const gridY = (simY + j + HEIGHT) % HEIGHT;
        u[gridY][gridX] = 0;
        v[gridY][gridX] = 0;
        }
    }
    }

    document.getElementById("noteInfo").textContent =
    `Interp Freq: ${interpFreq.toFixed(2)} Hz | Candidates: ${candidateInfo.join(", ")}`;
    drawInterpolationVisualization(selected, avgPos);
}

function fadeOverlay() {
    const fadeRate = 0.1;
    for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
        blueOverlay[y][x] = Math.max(0, blueOverlay[y][x] - fadeRate);
    }
    }
}
function drawOnOverlay(e) {
    const rect = overlayCanvas.getBoundingClientRect();
    const fullX = (e.clientX - rect.left) / rect.width * (WIDTH * 2);
    const fullY = (e.clientY - rect.top) / rect.height * (HEIGHT * 2);
    const x = Math.floor(fullX % WIDTH);
    const y = Math.floor(fullY % HEIGHT);
    for (let j = -3; j <= 3; j++) {
    for (let i = -3; i <= 3; i++) {
        const xx = (x + i + WIDTH) % WIDTH;
        const yy = (y + j + HEIGHT) % HEIGHT;
        blueOverlay[yy][xx] = 1;
    }
    }
}

let isDrawing = false;
overlayCanvas.addEventListener("mousedown", e => {
    isDrawing = true;
    drawOnOverlay(e);
    handleInterpolatedNote(e);
});
overlayCanvas.addEventListener("mousemove", e => {
    if (isDrawing) {
    drawOnOverlay(e);
    handleInterpolatedNote(e);
    }
});
overlayCanvas.addEventListener("mouseup", () => { isDrawing = false; });
overlayCanvas.addEventListener("mouseout", () => { isDrawing = false; });
document.getElementById("resetBtn").addEventListener("click", reset);

let scene, camera, renderer, torus, texture;
function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 3;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3,3,3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    texture = new THREE.CanvasTexture(simCanvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2,2);
    const geometry = new THREE.TorusGeometry(1, 0.4, 128, 256);
    const material = new THREE.MeshStandardMaterial({
    map: texture,
    displacementMap: texture,
    displacementScale: 0.2,
    metalness: 0.2,
    roughness: 0.7
    });
    torus = new THREE.Mesh(geometry, material);
    scene.add(torus);
}
function animate() {
    requestAnimationFrame(animate);
    for (let i = 0; i < 10; i++) updateRD();
    fadeOverlay();
    drawRD();
    texture.needsUpdate = true;
    torus.rotation.x += 0.01;
    torus.rotation.y += 0.01;
    renderer.render(scene, camera);
}
reset();
initThree();
animate();