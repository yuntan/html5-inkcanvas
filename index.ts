// pointer info (offset, pressure)
interface Point {
  x: number,
  y: number,
  pressure: number,
  mode: 'pen' | 'eraser',
}

const π = Math.PI;

const canvas = document.querySelector('canvas.draw-layer') as HTMLCanvasElement;
// drawing eraser marker with DOM at nearly 60times/sec is too heavy task, so
// use canvas instead
// const eraserMarker = document.querySelector('.canvas-eraser-marker') as HTMLDivElement;
const markerLayer = document.querySelector('canvas.marker-layer') as HTMLCanvasElement;

window.addEventListener('load', _ev => {
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = w; canvas.height = h;
  markerLayer.width = w; markerLayer.height = h;
});

const penPressureSensitivity = 5;
const eraserPressureSensitivity = 100;
const penStyle = '#001128'; // LAMY blue black ink
const eraserStyle = '#fff';

// pointer info buffer
let tracks = [] as Array<Point>;
// for requestAnimationFrame
let requestID: number;

// stat
let pointerCount = 0;
let drawCount = 0;

canvas.addEventListener('pointerdown', ev => {
  ev.preventDefault();
  tracks = []; // clear buffer
  requestID = requestAnimationFrame(draw); // request for draw loop
  console.log('pointerdown');
});

canvas.addEventListener('pointermove', ev => {
  ev.preventDefault();

  // if (ev.pointerType !== 'pen' || ev.pressure === 0) { return; }
  if (ev.pressure === 0) { return; }

  // const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect();
  // console.assert(ev.offsetX === ev.clientX - rect.left, "The value of ev.offsetX is invalid");

  tracks.push({
    x: ev.offsetX,
    // x: ev.clientX - rect.left,
    y: ev.offsetY,
    // y: ev.clientY - rect.top,
    pressure: ev.pressure,
    // if the 6th button is pressed, switch to eraser
    mode: (ev.buttons | 32) === ev.buttons ? 'eraser' : 'pen',
  });
});

canvas.addEventListener('pointerup', ev => {
  ev.preventDefault();
  tracks = [];
  cancelAnimationFrame(requestID); // break draw loop (for less CPU consumption)
  console.log('pointerup');
  console.log(`average pointer count: ${pointerCount / drawCount}`);
  pointerCount = 0; drawCount = 0;
});

// canvas draw loop
function draw() {
  const ctx = canvas.getContext('2d') !;

  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  // if buffer count equals 0 or 1, do nothing
  if (tracks.length > 1) {
    const {x, y, pressure, mode} = tracks[0];

    switch (mode) {
      case 'pen':
        ctx.strokeStyle = penStyle;
        ctx.lineWidth = pressure * penPressureSensitivity;
        // eraserMarker.style.display = 'none';
        break;

      case 'eraser':
        let width = pressure * eraserPressureSensitivity;
        ctx.strokeStyle = eraserStyle;
        ctx.fillStyle = eraserStyle;
        ctx.lineWidth = width;

        // eraserMarker.style.display = 'block';
        // eraserMarker.style.width = width + 'px';
        // eraserMarker.style.height = width + 'px';
        // eraserMarker.style.left = (x - width / 2) + 'px';
        // eraserMarker.style.top = (y - width / 2) + 'px';
        const ctx_ = markerLayer.getContext('2d') !;
        ctx_.strokeStyle = '#888';
        ctx_.setLineDash([4, 4]);
        ctx_.lineWidth = 2;
        ctx_.clearRect(0, 0, ctx_.canvas.width, ctx_.canvas.height);
        ctx_.beginPath();
        ctx_.ellipse(x, y, width / 2, width / 2, 0, 0, 2 * π);
        ctx_.stroke();
        break;
    }
    // ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
    for (const p of tracks.slice(1)) {
      switch (mode) {
        case 'pen':
          ctx.lineTo(p.x, p.y);
          break;

        case 'eraser':
          const radius = p.pressure * eraserPressureSensitivity / 2;
          ctx.ellipse(x, y, radius, radius, 0, 0, 2 * π);
          ctx.fill();
          break;
      }
    }
    // ctx.closePath();
    if (mode === 'pen') { ctx.stroke(); }

    pointerCount += tracks.length - 1;
    drawCount += 1;

    tracks = [tracks[tracks.length - 1]];
  }

  requestID = requestAnimationFrame(draw); // continue draw loop
}
