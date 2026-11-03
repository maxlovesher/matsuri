/* Generates each event's image as an inline SVG: a sphere composition seeded from
   the event's slug, so posters are stable between visits and need no image files. */
const Poster = (() => {
  const WIDTH = 640;
  const HEIGHT = 400;

  const THEMES = {
    Music:      { bg: ['#1d3fd6', '#071454'], balls: ['#a8c1ff', '#2f69ff', '#ecefff'] },
    Technology: { bg: ['#2a3303', '#0d1001'], balls: ['#e1fc03', '#b1e200', '#efff69'] },
    Art:        { bg: ['#fff0f1', '#ffc2ca'], balls: ['#ff4d6d', '#ffa6b3', '#ffffff'] },
    Food:       { bg: ['#fff3dc', '#ffd089'], balls: ['#ff8a3d', '#e8590c', '#ffd28f'] },
    Sports:     { bg: ['#dcfbf3', '#8ae9d4'], balls: ['#14b8a6', '#0f766e', '#ffffff'] },
    Workshops:  { bg: ['#f1ecff', '#c8b8ff'], balls: ['#7c5cff', '#4c2fd1', '#ffffff'] },
  };

  const hashString = (text) => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const seededRandom = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const shade = (hex, amount) => {
    const value = parseInt(hex.slice(1), 16);
    const channel = (shift) => Math.round(((value >> shift) & 255) * (1 - amount));
    return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
  };

  /* Each category gets its own arrangement, so the type of event reads at a glance. */
  const LAYOUTS = {
    // Equaliser columns
    Music(random) {
      const balls = [];
      const columns = 11;
      const r = 24 + random() * 6;
      for (let c = 0; c < columns; c++) {
        const wave = Math.abs(Math.sin(c * 0.75 + random() * 0.8));
        const height = 2 + Math.round(wave * 5 + random());
        for (let row = 0; row < height; row++) {
          balls.push({ x: 30 + (c * (WIDTH - 60)) / (columns - 1), y: HEIGHT - 20 - row * r * 1.9, r: r * (1 - row * 0.05) });
        }
      }
      return balls;
    },
    // A lattice of nodes
    Technology(random) {
      const balls = [];
      const gap = 62 + random() * 10;
      for (let x = gap / 2; x < WIDTH; x += gap) {
        for (let y = gap / 2; y < HEIGHT; y += gap) {
          const size = random();
          if (size > 0.2) balls.push({ x, y, r: 6 + size * size * 24 });
        }
      }
      return balls;
    },
    // A filled heart
    Art(random) {
      const balls = [];
      const scale = 118 + random() * 18;
      const shiftX = WIDTH / 2 + (random() - 0.5) * 120;
      let guard = 0;
      while (balls.length < 46 && guard++ < 600) {
        const x = (random() * 2 - 1) * 1.25;
        const y = random() * 2.55 - 1.4;
        const a = x * x + y * y - 1;
        if (a * a * a - x * x * y * y * y <= 0) {
          balls.push({ x: shiftX + x * scale, y: HEIGHT * 0.5 - (y + 0.12) * scale, r: 9 + random() * 24 });
        }
      }
      return balls;
    },
    // A generous pile
    Food(random) {
      const balls = [];
      for (let row = 0; row < 5; row++) {
        const count = 9 - row;
        for (let i = 0; i < count; i++) {
          balls.push({
            x: WIDTH * (0.5 + (i - (count - 1) / 2) * 0.13) + (random() - 0.5) * 22,
            y: HEIGHT - 20 - row * 52 + (random() - 0.5) * 18,
            r: 26 + random() * 24,
          });
        }
      }
      return balls;
    },
    // A trail picking up speed
    Sports(random) {
      const balls = [];
      const lift = 0.5 + random() * 0.4;
      const count = 18;
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        balls.push({
          x: 20 + t * (WIDTH - 90),
          y: HEIGHT - 40 - Math.pow(t, 1.6) * HEIGHT * lift + (random() - 0.5) * 16,
          r: 7 + t * t * 62,
        });
      }
      return balls;
    },
    // A stack built up by hand
    Workshops(random) {
      const balls = [];
      const r = 34 + random() * 6;
      const centre = WIDTH * (0.42 + random() * 0.16);
      for (let row = 0; row < 5; row++) {
        const count = 5 - row;
        for (let i = 0; i < count; i++) {
          balls.push({
            x: centre + (i - (count - 1) / 2) * r * 2,
            y: HEIGHT - r - 6 - row * r * 1.72,
            r: r * (0.92 + random() * 0.08),
          });
        }
      }
      return balls;
    },
  };

  let instance = 0;

  /* Gradient ids must be unique per render: an event can appear several times on one page. */
  const svg = (event) => {
    const theme = THEMES[event.category];
    const random = seededRandom(hashString(event.slug));
    const id = `poster-${instance++}`;

    const tones = theme.balls.map((color, i) => `
      <radialGradient id="${id}-t${i}" cx=".36" cy=".3" r=".78">
        <stop offset="0" stop-color="#fff" stop-opacity=".92"/>
        <stop offset=".3" stop-color="${color}"/>
        <stop offset="1" stop-color="${shade(color, 0.38)}"/>
      </radialGradient>`).join('');

    const circles = LAYOUTS[event.category](random)
      .map((ball) => {
        const tone = Math.floor(random() * theme.balls.length);
        const dim = random() < 0.2 ? ' opacity=".55"' : '';
        return `<circle cx="${ball.x.toFixed(1)}" cy="${ball.y.toFixed(1)}" r="${ball.r.toFixed(1)}" fill="url(#${id}-t${tone})"${dim}/>`;
      })
      .join('');

    return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Poster artwork for ${Events.escapeHtml(event.name)}">
      <defs>
        <radialGradient id="${id}-bg" cx=".35" cy=".25" r="1">
          <stop offset="0" stop-color="${theme.bg[0]}"/>
          <stop offset="1" stop-color="${theme.bg[1]}"/>
        </radialGradient>${tones}
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#${id}-bg)"/>
      ${circles}
    </svg>`;
  };

  return { svg };
})();
