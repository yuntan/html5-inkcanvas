// pointer info (offset, pressure)
interface Point {
  x: number,
  y: number,
  pressure: number,
}

const canvas = document.querySelector('canvas');

const pressureSensitivity = 5;

// pointer info buffer
let tracks = [] as Array<Point>;
// for requestAnimationFrame
let requestID: number;

canvas.addEventListener('pointerdown', ev => {
  ev.preventDefault();
  tracks = []; // clear buffer
  requestID = requestAnimationFrame(draw); // request for draw loop
  console.log('pointerdown');
})

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
  });
});

canvas.addEventListener('pointerup', ev => {
  ev.preventDefault();
  tracks = [];
  cancelAnimationFrame(requestID); // break draw loop (for less CPU consumption)
  console.log('pointerup');
});

// canvas draw loop
function draw() {
  const ctx = canvas.getContext('2d') !;

  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  // if buffer count equals 0 or 1, do nothing
  if (tracks.length > 1) {
    const {x, y, pressure} = tracks[0];
    ctx.strokeStyle = '#000';
    // ctx.lineWidth = 2;
    ctx.lineWidth = pressure * pressureSensitivity;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
    for (const p of tracks.slice(1)) {
      ctx.lineTo(p.x, p.y);
    }
    // ctx.closePath();
    ctx.stroke();

    tracks = [tracks[tracks.length - 1]];
  }

  requestID = requestAnimationFrame(draw); // continue draw loop
}
