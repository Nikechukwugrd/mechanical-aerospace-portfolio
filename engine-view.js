'use strict';

const byId = id => document.getElementById(id);
const canvas = byId('model');
const ctx = canvas.getContext('2d');
const bore = byId('bore');
const stroke = byId('stroke');
const angle = byId('angle');
const play = byId('play');
const baseline = byId('baseline');
const shorter = byId('short');
const tau = 2 * Math.PI;
const centers = [-165, -55, 55, 165];
const rodLength = 145;
let phase = Number(angle.value);
let yaw = 0.34;
let previousTime = null;
let frame = null;
let drag = null;

function shade(rgb, intensity) {
  return `rgb(${rgb.map(component => Math.min(255, Math.round(component * intensity))).join(',')})`;
}

function render() {
  const {width, height} = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * density);
  const pixelHeight = Math.round(height * density);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ctx.setTransform(density, 0, 0, density, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const scale = Math.min((width - 20) / 525, (height - 64) / 345);
  const elevation = 0.34;
  const faces = [];

  function project([x, y, z]) {
    const distance = z * Math.cos(yaw) - x * Math.sin(yaw);
    return {
      x: width / 2 + scale * (x * Math.cos(yaw) + z * Math.sin(yaw)),
      y: height / 2 + scale * (113 - y * Math.cos(elevation) + distance * Math.sin(elevation)),
      depth: distance * Math.cos(elevation) + y * Math.sin(elevation),
    };
  }

  function path(points, closed = false) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    if (closed) ctx.closePath();
  }

  function face(vertices, fill) {
    const points = vertices.map(project);
    const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
    faces.push({points, depth, fill});
  }

  function ring(axis, x, y, z, radius, segments = 28) {
    return Array.from({length: segments}, (_, index) => {
      const phi = index * tau / segments;
      const a = radius * Math.cos(phi);
      const b = radius * Math.sin(phi);
      return axis === 'x' ? [x, y + a, z + b] : [x + a, y, z + b];
    });
  }

  function cylinder(axis, start, end, radius, color) {
    const first = ring(axis, ...start, radius);
    const last = ring(axis, ...end, radius);
    face(first, shade(color, .64));
    face(last, shade(color, 1.15));
    first.forEach((point, index) => {
      const next = (index + 1) % first.length;
      const light = .78 + .31 * Math.cos(index * tau / first.length - 1);
      face([point, first[next], last[next], last[index]], shade(color, light));
    });
  }

  function rod(x, y1, z1, y2, z2, radius1, radius2, color) {
    const length = Math.hypot(y2 - y1, z2 - z1);
    const dy = (z1 - z2) / length;
    const dz = (y2 - y1) / length;
    const outline = [[y1 + dy * radius1, z1 + dz * radius1], [y2 + dy * radius2, z2 + dz * radius2], [y2 - dy * radius2, z2 - dz * radius2], [y1 - dy * radius1, z1 - dz * radius1]];
    const near = outline.map(([y, z]) => [x + 8, y, z]);
    const far = outline.map(([y, z]) => [x - 8, y, z]);
    face(near, shade(color, 1.03));
    face(far, shade(color, .76));
    near.forEach((point, index) => {
      const next = (index + 1) % near.length;
      face([point, near[next], far[next], far[index]], shade(color, .9));
    });
  }

  const crank = [105, 203, 184];
  const metal = [187, 209, 225];
  const gold = [233, 168, 94];
  const radius = Number(bore.value) / 2;
  const throwRadius = Number(stroke.value) / 2;
  const shaftY = 20;
  ctx.strokeStyle = '#4e718c45';
  ctx.lineWidth = 1;
  for (let i = -240; i <= 240; i += 30) {
    path([[i, -42, -85], [i, -42, 85]].map(project));
    ctx.stroke();
  }
  for (let i = -80; i <= 80; i += 20) {
    path([[-240, -42, i], [240, -42, i]].map(project));
    ctx.stroke();
  }

  ctx.strokeStyle = '#87abc380';
  centers.forEach(x => {
    [100, 242].forEach(y => {
      path(ring('y', x, y, 0, radius + 4).map(project), true);
      ctx.stroke();
    });
    [-1, 1].forEach(side => {
      path([[x + side * (radius + 4), 100, 0], [x + side * (radius + 4), 242, 0]].map(project));
      ctx.stroke();
    });
  });

  [-220, -110, 0, 110, 220].forEach(x => {
    cylinder('x', [x - 12, shaftY, 0], [x + 12, shaftY, 0], 17, crank);
  });
  centers.forEach((x, index) => {
    const radians = phase * Math.PI / 180 + ([1, 2].includes(index) ? Math.PI : 0);
    const pinZ = throwRadius * Math.sin(radians);
    const pinY = shaftY + throwRadius * Math.cos(radians);
    const pistonY = pinY + Math.sqrt(rodLength ** 2 - pinZ ** 2);
    cylinder('x', [x - 33, shaftY, 0], [x - 24, shaftY, 0], 30, crank);
    cylinder('x', [x + 24, shaftY, 0], [x + 33, shaftY, 0], 30, crank);
    rod(x - 25, shaftY, 0, pinY, pinZ, 17, 13, crank);
    rod(x + 25, shaftY, 0, pinY, pinZ, 17, 13, crank);
    cylinder('x', [x - 29, pinY, pinZ], [x + 29, pinY, pinZ], 12, crank);
    rod(x, pinY, pinZ, pistonY, 0, 9, 6, gold);
    cylinder('x', [x - 10, pinY, pinZ], [x + 10, pinY, pinZ], 15, gold);
    cylinder('y', [x, pistonY - 13, 0], [x, pistonY + 21, 0], radius, metal);
    [pistonY + 8, pistonY + 14].forEach(y => {
      cylinder('y', [x, y, 0], [x, y + 2, 0], radius + .65, [69, 91, 107]);
    });
  });

  faces.sort((a, b) => a.depth - b.depth);
  faces.forEach(({points, fill}) => {
    path(points, true);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = fill;
    ctx.lineWidth = .65;
    ctx.stroke();
  });
}

function update() {
  const diameter = Number(bore.value);
  const travel = Number(stroke.value);
  byId('bore-value').value = `${diameter} mm`;
  byId('stroke-value').value = `${travel} mm`;
  byId('angle-value').value = `${Math.round(phase)}°`;
  byId('volume').textContent = `${(Math.PI * diameter ** 2 * travel / 1e6).toFixed(3)} L`;
  byId('speed').textContent = `${(travel * .2).toFixed(2)} m/s`;
  baseline.setAttribute('aria-pressed', String(diameter === 86 && travel === 86));
  shorter.setAttribute('aria-pressed', String(diameter === 90 && travel === 78.5));
  render();
}

function animate(now) {
  if (previousTime !== null) phase = (phase + Math.min(now - previousTime, 50) * .072) % 360;
  previousTime = now;
  angle.value = Math.round(phase);
  byId('angle-value').value = `${angle.value}°`;
  render();
  frame = requestAnimationFrame(animate);
}

baseline.addEventListener('click', () => { bore.value = 86; stroke.value = 86; update(); });
shorter.addEventListener('click', () => { bore.value = 90; stroke.value = 78.5; update(); });
bore.addEventListener('input', update);
stroke.addEventListener('input', update);
angle.addEventListener('input', () => { phase = Number(angle.value); update(); });
play.addEventListener('click', () => {
  const playing = frame !== null;
  if (playing) {
    cancelAnimationFrame(frame);
    frame = null;
  } else {
    previousTime = null;
    frame = requestAnimationFrame(animate);
  }
  play.textContent = playing ? 'Play motion' : 'Pause motion';
  play.setAttribute('aria-pressed', String(!playing));
});

canvas.addEventListener('pointerdown', event => {
  drag = {x: event.clientX, yaw};
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!drag) return;
  yaw = Math.min(.8, Math.max(-.8, drag.yaw + (event.clientX - drag.x) * .006));
  render();
});
canvas.addEventListener('lostpointercapture', () => { drag = null; });
new ResizeObserver(render).observe(canvas);
update();
