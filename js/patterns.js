/* Draws the masks the field's spheres are wrapped in, as equirectangular canvases.
   White means "thread" (or ink, on a lantern) and black means the ball showing through;
   the scene's shader mixes two colours by this mask, so they can change as you scroll. */
const Patterns = (() => {
  const surface = (height) => {
    const canvas = document.createElement('canvas');
    canvas.width = height * 2;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    return { canvas, ctx, w: canvas.width, h: canvas.height };
  };

  /* Fine parallel strands, so filled areas read as wound silk rather than paint. */
  const addStrands = ({ ctx, w, h }) => {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = '#a8a8a8';
    ctx.lineWidth = Math.max(1, h / 340);
    const gap = Math.max(3, h / 128);
    for (let y = 0; y < h; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const polygon = (ctx, points) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  };

  const TEMARI = [
    // Kiku: chrysanthemum petals meeting at both poles
    (s) => {
      const count = 14;
      const step = s.w / count;
      for (let i = 0; i < count; i++) {
        const x = i * step;
        polygon(s.ctx, [[x, 0], [x + step, 0], [x + step / 2, s.h * 0.47]]);
        polygon(s.ctx, [[x, s.h], [x + step, s.h], [x + step / 2, s.h * 0.53]]);
      }
    },
    // Bands around a zigzag equator
    (s) => {
      [0.12, 0.26, 0.74, 0.88].forEach((v) => s.ctx.fillRect(0, s.h * (v - 0.035), s.w, s.h * 0.07));
      const count = 18;
      const step = s.w / count;
      s.ctx.lineWidth = s.h * 0.05;
      s.ctx.beginPath();
      for (let i = 0; i <= count; i++) s.ctx.lineTo(i * step, s.h * (i % 2 ? 0.38 : 0.62));
      s.ctx.stroke();
    },
    // Uroko: a belt of scales between solid caps
    (s) => {
      s.ctx.fillRect(0, 0, s.w, s.h * 0.14);
      s.ctx.fillRect(0, s.h * 0.86, s.w, s.h * 0.14);
      const count = 16;
      const step = s.w / count;
      for (let row = 0; row < 2; row++) {
        const top = s.h * (0.3 + row * 0.2);
        const offset = row * step * 0.5;
        for (let i = -1; i < count + 1; i++) {
          const x = i * step + offset;
          polygon(s.ctx, [[x, top + s.h * 0.2], [x + step, top + s.h * 0.2], [x + step / 2, top]]);
        }
      }
    },
    // Kagari: threads crossing into a diamond net
    (s) => {
      const count = 10;
      s.ctx.lineWidth = s.h * 0.035;
      for (let i = -count; i < count * 2; i++) {
        const x = (i * s.w) / count;
        [1, -1].forEach((direction) => {
          s.ctx.beginPath();
          s.ctx.moveTo(x, 0);
          s.ctx.lineTo(x + (direction * s.w) / 5, s.h);
          s.ctx.stroke();
        });
      }
    },
    // Hishi: large diamonds on the equator
    (s) => {
      const count = 7;
      const step = s.w / count;
      for (let i = 0; i < count; i++) {
        const x = i * step + step / 2;
        polygon(s.ctx, [[x, s.h * 0.2], [x + step * 0.46, s.h / 2], [x, s.h * 0.8], [x - step * 0.46, s.h / 2]]);
        s.ctx.save();
        s.ctx.fillStyle = '#000';
        polygon(s.ctx, [[x, s.h * 0.36], [x + step * 0.22, s.h / 2], [x, s.h * 0.64], [x - step * 0.22, s.h / 2]]);
        s.ctx.restore();
      }
      s.ctx.fillRect(0, 0, s.w, s.h * 0.08);
      s.ctx.fillRect(0, s.h * 0.92, s.w, s.h * 0.08);
    },
    // A slow spiral wound from pole to pole
    (s) => {
      const count = 9;
      const step = s.w / count;
      for (let i = -count; i < count * 2; i++) {
        const x = i * step;
        polygon(s.ctx, [[x, 0], [x + step * 0.5, 0], [x + step * 0.5 + s.w * 0.35, s.h], [x + s.w * 0.35, s.h]]);
      }
    },
  ];

  const temari = (index, height) => {
    const s = surface(height);
    TEMARI[index % TEMARI.length](s);
    addStrands(s);
    return s.canvas;
  };

  /* A chōchin: ink caps, bamboo ribs, and a large character facing each way. */
  const lantern = (kanji, height) => {
    const s = surface(height);
    s.ctx.fillRect(0, 0, s.w, s.h * 0.1);
    s.ctx.fillRect(0, s.h * 0.9, s.w, s.h * 0.1);

    s.ctx.save();
    s.ctx.globalAlpha = 0.2;
    s.ctx.lineWidth = Math.max(1, s.h / 200);
    const ribs = 18;
    for (let i = 1; i < ribs; i++) {
      s.ctx.beginPath();
      s.ctx.moveTo(0, (s.h * i) / ribs);
      s.ctx.lineTo(s.w, (s.h * i) / ribs);
      s.ctx.stroke();
    }
    s.ctx.restore();

    s.ctx.font = `700 ${s.h * 0.44}px "Shippori Mincho", "Yu Mincho", "Hiragino Mincho ProN", serif`;
    s.ctx.textAlign = 'center';
    s.ctx.textBaseline = 'middle';
    // A sphere's +z side (facing the camera) sits at a quarter of the way around.
    [0.25, 0.75].forEach((u) => s.ctx.fillText(kanji, s.w * u, s.h * 0.52));
    return s.canvas;
  };

  const glow = () => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return canvas;
  };

  return { temari, lantern, glow, temariCount: TEMARI.length };
})();
