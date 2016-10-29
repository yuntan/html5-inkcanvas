// pointer info (offset, pressure)
interface InkRenderingSegment {
  x: number,
  y: number,
  pressure: number,
  mode: 'ink' | 'eraser',
}

const π = Math.PI;

const inkLayer = document.querySelector('canvas.ink-layer') as HTMLCanvasElement;
// drawing eraser marker with DOM at nearly 60times/sec is too heavy task, so
// use canvas instead
// const eraserMarker = document.querySelector('.canvas-eraser-marker') as HTMLDivElement;
const markerLayer = document.querySelector('canvas.marker-layer') as HTMLCanvasElement;

window.addEventListener('load', _ev => {
  // adjust canvas size to fit window
  const w = window.innerWidth, h = window.innerHeight;
  inkLayer.width = w; inkLayer.height = h;
  markerLayer.width = w; markerLayer.height = h;
});

const eraserButton = 32; // 6th button
const penPressureSensitivity = 5;
const eraserPressureSensitivity = 100;
const penStyle = '#001128'; // LAMY blue black ink
const eraserStyle = '#fff';

// pointer info buffer
let inkStroke = [] as Array<InkRenderingSegment>;
// for requestAnimationFrame
let requestID: number;

// stat
let pointerCount = 0;
let drawCount = 0;

const isEraser = (ev: PointerEvent) => (ev.buttons | eraserButton) === ev.buttons;

inkLayer.addEventListener('pointerdown', ev => {
  if (ev.pointerType !== 'pen' || ev.pressure === 0) { return; }
  ev.preventDefault();

  const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect();
  console.assert(ev.offsetX === ev.clientX - rect.left, "The value of ev.offsetX is invalid");

  inkStroke = []; // clear buffer
  inkStroke.push({
    x: ev.offsetX,
    y: ev.offsetY,
    pressure: ev.pressure,
    mode: isEraser(ev) ? 'eraser' : 'ink',
  });

  requestID = requestAnimationFrame(draw); // request for draw loop
});

inkLayer.addEventListener('pointermove', ev => {
  if (ev.pointerType !== 'pen' || ev.pressure === 0) { return; }
  ev.preventDefault();

  inkStroke.push({
    x: ev.offsetX,
    // x: ev.clientX - rect.left,
    y: ev.offsetY,
    // y: ev.clientY - rect.top,
    pressure: ev.pressure,
    // if the 6th button is pressed, switch to eraser
    mode: isEraser(ev) ? 'eraser' : 'ink',
  });
});

inkLayer.addEventListener('pointerup', ev => {
  if (ev.pointerType !== 'pen') { return; }
  ev.preventDefault();

  inkStroke = []; // clear buffer
  cancelAnimationFrame(requestID); // break draw loop (for less CPU consumption)
  console.log(`[pointerup] average pointer count: ${pointerCount / drawCount}`);
  pointerCount = 0; drawCount = 0;
});

inkLayer.addEventListener('pointerleave', ev => {
  if (ev.pointerType !== 'pen') { return; }
  ev.preventDefault();

  inkStroke = []; // clear buffer
  cancelAnimationFrame(requestID); // break draw loop (for less CPU consumption)
});

// canvas draw loop
function draw() {
  // if buffer count equals 0 or 1, do nothing
  if (inkStroke.length > 1) {
    const inkCtx = inkLayer.getContext('2d') !;
    const markerCtx = markerLayer.getContext('2d') !;
    const {x, y, pressure, mode} = inkStroke[0];

    switch (mode) {
      case 'ink':
        inkCtx.strokeStyle = penStyle;
        inkCtx.lineWidth = pressure * penPressureSensitivity;
        inkCtx.lineCap = 'round';

        inkCtx.beginPath();
        inkCtx.moveTo(x, y);
        for (const p of inkStroke.slice(1)) {
          inkCtx.lineTo(p.x, p.y);
        }
        inkCtx.stroke();

        // clear eraser marker
        markerCtx.clearRect(0, 0, markerCtx.canvas.width, markerCtx.canvas.height);
        break;

      case 'eraser':
        let width = pressure * eraserPressureSensitivity;
        inkCtx.fillStyle = eraserStyle;

        inkCtx.beginPath();
        for (const p of inkStroke) {
          const radius = p.pressure * eraserPressureSensitivity / 2;
          inkCtx.ellipse(x, y, radius, radius, 0, 0, 2 * π);
          inkCtx.fill();
        }

        // draw eraser marker
        markerCtx.strokeStyle = '#888';
        markerCtx.setLineDash([4, 4]);
        markerCtx.lineWidth = 2;

        markerCtx.clearRect(0, 0, markerCtx.canvas.width, markerCtx.canvas.height);
        markerCtx.beginPath();
        markerCtx.ellipse(x, y, width / 2, width / 2, 0, 0, 2 * π);
        markerCtx.stroke();
        break;
    }

    pointerCount += inkStroke.length - 1;
    drawCount += 1;

    inkStroke = [inkStroke[inkStroke.length - 1]]; // create new buffer with last element
  }

  requestID = requestAnimationFrame(draw); // continue draw loop
}
