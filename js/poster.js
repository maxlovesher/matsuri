/* Each event's image is a woodblock-style print drawn as inline SVG: flat colour layers,
   a graded sky (bokashi) and a small kit of traditional motifs composed differently per event. */
const Poster = (() => {
  const W = 600;
  const H = 720;
  const INK = '#1b1a18';
  const PAPER = '#f3eee3';
  const SHU = '#c23a22';

  const seeded = (text) => {
    let seed = 2166136261;
    for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619);
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* A new kit per render, because gradient ids must be unique when a print appears twice. */
  const kit = (id, random) => {
    let gradients = 0;
    const defs = [];

    const k = {
      defs,
      random,

      /* A graded sky. stops: [[offset, colour], ...] */
      sky(stops) {
        const gid = `${id}-g${gradients++}`;
        defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);
        return `<rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
      },

      disc: (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`,

      /* A range of hills built from a seeded walk. */
      hills(y, amp, fill) {
        let d = `M0 ${H} L0 ${y}`;
        for (let x = 0; x <= W + 60; x += 60) d += ` Q${x + 30} ${y - amp * random()} ${x + 60} ${y - amp * 0.4 * random()}`;
        return `<path d="${d} L${W} ${H} Z" fill="${fill}"/>`;
      },

      fuji(cx, baseY, size, fill, snow) {
        const top = baseY - size;
        return `<path d="M${cx - size * 1.5} ${baseY} C${cx - size * 0.8} ${baseY - size * 0.35} ${cx - size * 0.32} ${top + size * 0.18} ${cx - size * 0.15} ${top} L${cx + size * 0.15} ${top} C${cx + size * 0.32} ${top + size * 0.18} ${cx + size * 0.8} ${baseY - size * 0.35} ${cx + size * 1.5} ${baseY} Z" fill="${fill}"/>
          <path d="M${cx - size * 0.15} ${top} L${cx + size * 0.15} ${top} C${cx + size * 0.22} ${top + size * 0.12} ${cx + size * 0.3} ${top + size * 0.2} ${cx + size * 0.4} ${top + size * 0.3} L${cx + size * 0.24} ${top + size * 0.24} L${cx + size * 0.14} ${top + size * 0.36} L${cx + size * 0.02} ${top + size * 0.24} L${cx - size * 0.1} ${top + size * 0.38} L${cx - size * 0.22} ${top + size * 0.24} L${cx - size * 0.4} ${top + size * 0.3} C${cx - size * 0.3} ${top + size * 0.2} ${cx - size * 0.22} ${top + size * 0.12} ${cx - size * 0.15} ${top} Z" fill="${snow}"/>`;
      },

      /* Suyari-gasumi: the stylised banks of mist in traditional painting. */
      mist(x, y, width, fill, opacity = 1) {
        const r = 12;
        return `<g fill="${fill}" opacity="${opacity}">
          <rect x="${x}" y="${y}" width="${width}" height="${r * 2}" rx="${r}"/>
          <rect x="${x + width * 0.18}" y="${y - r * 1.6}" width="${width * 0.5}" height="${r * 2}" rx="${r}"/>
          <rect x="${x - width * 0.14}" y="${y + r * 1.6}" width="${width * 0.7}" height="${r * 2}" rx="${r}"/>
        </g>`;
      },

      torii(cx, baseY, h, fill, beam = INK) {
        const w = h * 1.05;
        return `<g fill="${fill}">
          <path d="M${cx - w * 0.36} ${baseY} L${cx - w * 0.31} ${baseY - h * 0.92} L${cx - w * 0.25} ${baseY - h * 0.92} L${cx - w * 0.29} ${baseY} Z"/>
          <path d="M${cx + w * 0.36} ${baseY} L${cx + w * 0.31} ${baseY - h * 0.92} L${cx + w * 0.25} ${baseY - h * 0.92} L${cx + w * 0.29} ${baseY} Z"/>
          <rect x="${cx - w * 0.44}" y="${baseY - h * 0.74}" width="${w * 0.88}" height="${h * 0.07}"/>
          <rect x="${cx - w * 0.03}" y="${baseY - h * 0.9}" width="${w * 0.06}" height="${h * 0.16}"/>
          <rect x="${cx - w * 0.5}" y="${baseY - h * 0.93}" width="${w}" height="${h * 0.07}"/>
        </g>
        <path d="M${cx - w * 0.6} ${baseY - h * 1.04} Q${cx} ${baseY - h * 0.94} ${cx + w * 0.6} ${baseY - h * 1.04} L${cx + w * 0.54} ${baseY - h * 0.93} L${cx - w * 0.54} ${baseY - h * 0.93} Z" fill="${beam}"/>`;
      },

      lantern(x, y, r, fill = SHU, glow = '') {
        const ribs = [-0.5, -0.17, 0.17, 0.5].map((f) => `<path d="M${x - r * Math.sqrt(1 - f * f)} ${y + r * f * 1.1} Q${x} ${y + r * f * 1.25} ${x + r * Math.sqrt(1 - f * f)} ${y + r * f * 1.1}" fill="none" stroke="${INK}" stroke-opacity=".28" stroke-width="${Math.max(1, r * 0.05)}"/>`).join('');
        return `${glow ? `<circle cx="${x}" cy="${y}" r="${r * 2.3}" fill="${glow}" opacity=".28"/>` : ''}
          <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${fill}"/>${ribs}
          <rect x="${x - r * 0.5}" y="${y - r * 1.27}" width="${r}" height="${r * 0.2}" fill="${INK}"/>
          <rect x="${x - r * 0.5}" y="${y + r * 1.07}" width="${r}" height="${r * 0.2}" fill="${INK}"/>`;
      },

      /* Five-lobed maple leaf */
      maple(x, y, s, fill, angle = 0) {
        return `<path transform="translate(${x} ${y}) rotate(${angle}) scale(${s})" fill="${fill}" d="M0 -10 L2 -4 L7 -6 L5 -1 L10 1 L5 3 L6 7 L1 5 L0.6 11 L-0.6 11 L-1 5 L-6 7 L-5 3 L-10 1 L-5 -1 L-7 -6 L-2 -4 Z"/>`;
      },

      /* Five-petalled cherry blossom */
      blossom(x, y, r, fill, centre = '#c23a55') {
        const petals = [0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="${-r * 0.62}" rx="${r * 0.46}" ry="${r * 0.62}" fill="${fill}" transform="rotate(${a})"/>`).join('');
        return `<g transform="translate(${x} ${y})">${petals}<circle r="${r * 0.2}" fill="${centre}"/></g>`;
      },

      /* A bare branch reaching in from an edge, carrying leaves or blossom. */
      branch(points, stroke, width, drawLeaf, leaves = 14) {
        let d = `M${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length; i++) d += ` L${points[i][0]} ${points[i][1]}`;
        let out = `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
        for (let i = 0; i < leaves; i++) {
          const a = points[Math.floor(random() * (points.length - 1))];
          const b = points[points.indexOf(a) + 1];
          const t = random();
          out += drawLeaf(a[0] + (b[0] - a[0]) * t + (random() - 0.5) * 70, a[1] + (b[1] - a[1]) * t + (random() - 0.5) * 70);
        }
        return out;
      },

      /* Seigaiha wave scales filling a band of water */
      seigaiha(y, fill, line) {
        const gid = `${id}-w${gradients++}`;
        defs.push(`<pattern id="${gid}" width="72" height="36" patternUnits="userSpaceOnUse"><rect width="72" height="36" fill="${fill}"/><g fill="${fill}" stroke="${line}" stroke-width="2">${[[0, 36], [72, 36], [36, 18]].map(([cx, cy]) => [33, 23, 13].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('')).join('')}</g></pattern>`);
        return `<rect y="${y}" width="${W}" height="${H - y}" fill="url(#${gid})"/>`;
      },

      ripples(y, count, stroke, opacity = 0.5) {
        let out = '';
        for (let i = 0; i < count; i++) {
          const yy = y + i * ((H - y) / count) + 6;
          const x = random() * W * 0.7;
          out += `<path d="M${x} ${yy} q40 -8 80 0 t80 0" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" opacity="${opacity}"/>`;
        }
        return out;
      },

      scatter(count, draw) {
        let out = '';
        for (let i = 0; i < count; i++) out += draw(random() * W, random() * H, random());
        return out;
      },
    };
    return k;
  };

  const SCENES = {
    // Red maples and a line of lanterns on a night river
    'momiji-lantern-night': (k) => {
      let out = k.sky([[0, '#0f1b38'], [0.5, '#2a3768'], [0.72, '#b4553c'], [0.78, '#e39a5a']]);
      out += k.disc(170, 180, 62, '#f4e7cc');
      out += k.hills(520, 90, '#1d1f3c');
      out += `<rect y="540" width="${W}" height="${H - 540}" fill="#101a35"/>`;
      out += k.ripples(560, 10, '#e39a5a', 0.45);
      [[70, 590, 19], [165, 618, 23], [270, 584, 18], [365, 630, 26], [470, 596, 21], [555, 640, 27]].forEach(([x, y, r]) => {
        out += `<path d="M${x} ${y + r} v${r * 1.5}" stroke="#ffb066" stroke-width="${r * 0.7}" opacity=".35"/>`;
        out += k.lantern(x, y, r, '#f0a24a', '#ffb066');
      });
      const reds = ['#c8321f', '#e0522a', '#a8201a', '#ee7a30'];
      out += k.branch([[600, 40], [470, 110], [360, 120], [270, 200]], '#17121f', 11, (x, y) => k.maple(x, y, 2.3 + k.random() * 1.5, reds[Math.floor(k.random() * 4)], k.random() * 360), 34);
      out += k.branch([[600, 230], [500, 270], [420, 340]], '#17121f', 7, (x, y) => k.maple(x, y, 2 + k.random() * 1.2, reds[Math.floor(k.random() * 4)], k.random() * 360), 16);
      return out;
    },

    // A taiko drum against a gold sun over waves
    'thunder-on-the-bay': (k) => {
      let out = k.sky([[0, '#8e1d14'], [0.55, '#d23f22'], [1, '#ef8a3c']]);
      out += k.disc(300, 280, 215, '#f2c14e');
      out += k.seigaiha(560, '#14233f', '#e9dfc8');
      // Barrel
      out += `<path d="M130 240 Q95 380 130 520 L470 520 Q505 380 470 240 Z" fill="#3b1a10"/>`;
      out += `<path d="M130 240 Q95 380 130 520 L210 520 Q180 380 210 240 Z" fill="#54281a"/>`;
      out += `<ellipse cx="300" cy="520" rx="170" ry="34" fill="#22100a"/>`;
      // Rope band and studs
      for (let i = 0; i < 15; i++) {
        const a = (i / 14) * Math.PI;
        out += k.disc(300 - Math.cos(a) * 168, 266 + Math.sin(a) * 34, 6, '#f2c14e');
      }
      // Skin and mitsudomoe
      out += `<ellipse cx="300" cy="240" rx="170" ry="44" fill="#f4e7cc"/>`;
      out += `<g transform="translate(300 240) scale(1 .26)">${[0, 120, 240].map((a) => `<path transform="rotate(${a})" d="M0 -100 A50 50 0 1 1 -12 -2 A70 70 0 0 0 0 -100 Z" fill="${SHU}"/>`).join('')}</g>`;
      // Sticks
      out += `<path d="M60 70 L262 214" stroke="#f4e7cc" stroke-width="15" stroke-linecap="round"/><path d="M540 70 L338 214" stroke="#f4e7cc" stroke-width="15" stroke-linecap="round"/>`;
      return out;
    },

    // Snow lanterns on a path up to a small red gate
    'yukiakari-snow-walk': (k) => {
      let out = k.sky([[0, '#16233f'], [0.5, '#46618a'], [0.78, '#c7d4e0']]);
      out += k.fuji(310, 470, 200, '#5f7a9f', '#f6f8fa');
      out += k.mist(70, 300, 240, '#dfe7ee', 0.7);
      out += k.hills(470, 70, '#e8edf2');
      out += k.torii(300, 500, 120, '#c23a22', '#1b1a18');
      out += `<path d="M285 500 C250 570 170 610 60 ${H} L420 ${H} C380 640 330 570 315 500 Z" fill="#f8fafb"/>`;
      [[255, 545, 11], [345, 545, 11], [215, 590, 15], [385, 590, 15], [150, 650, 21], [445, 650, 21]].forEach(([x, y, r]) => {
        out += k.disc(x, y, r * 2.6, '#ffb066', 'opacity=".35"');
        out += `<path d="M${x - r} ${y + r * 0.6} A${r} ${r * 1.3} 0 0 1 ${x + r} ${y + r * 0.6} Z" fill="#fff"/>`;
        out += k.disc(x, y + r * 0.1, r * 0.42, '#f7922e');
      });
      out += k.scatter(90, (x, y, s) => k.disc(x, y, 1.5 + s * 3.2, '#fff', 'opacity=".9"'));
      return out;
    },

    // A koto across a neon night
    'neon-koto-sessions': (k) => {
      let out = k.sky([[0, '#140b2c'], [0.6, '#3a1356'], [1, '#7a1f68']]);
      out += k.disc(430, 170, 110, '#f0569a');
      // City blocks with lit windows
      [[0, 300, 110], [100, 370, 90], [185, 330, 100], [280, 400, 90], [365, 350, 120], [480, 300, 120]].forEach(([x, y, w]) => {
        out += `<rect x="${x}" y="${y}" width="${w}" height="${H - y}" fill="#120a24"/>`;
        for (let wy = y + 16; wy < 620; wy += 26) {
          for (let wx = x + 10; wx < x + w - 12; wx += 20) {
            if (k.random() > 0.55) out += `<rect x="${wx}" y="${wy}" width="9" height="13" fill="${k.random() > 0.5 ? '#ffcb5c' : '#46d6e0'}" opacity=".85"/>`;
          }
        }
      });
      // Koto body, laid diagonally
      out += `<g transform="rotate(-24 300 520)"><rect x="-60" y="462" width="720" height="118" rx="26" fill="#e7c98c"/><rect x="-60" y="462" width="720" height="26" rx="13" fill="#b8884a"/>`;
      for (let i = 0; i < 9; i++) {
        const y = 494 + i * 8.6;
        out += `<path d="M-60 ${y} H660" stroke="#3a1a10" stroke-width="2"/>`;
        out += `<path d="M${60 + ((i * 53) % 340)} ${y + 6} l10 -13 l10 13 Z" fill="#fdf3dc" stroke="#3a1a10"/>`;
      }
      out += `</g>`;
      return out;
    },

    // A great wave rearing over a small Fuji
    'woodblock-print-fair': (k) => {
      let out = k.sky([[0, '#2f5a83'], [0.22, '#a8c0c9'], [0.5, '#efe5cf']]);
      out += k.fuji(400, 470, 120, '#2a4a70', '#f7f3e8');
      out += `<path d="M0 ${H} L0 430 C40 290 180 170 340 196 C440 212 490 278 450 340 C420 300 360 296 326 340 C282 400 310 530 440 600 L${W} 640 L${W} ${H} Z" fill="#17335c"/>`;
      out += `<path d="M0 ${H} L0 520 C50 400 150 300 260 290 C210 370 220 520 340 620 L${W} 680 L${W} ${H} Z" fill="#2f5f96"/>`;
      out += `<path d="M30 ${H} C70 560 130 460 200 410 C180 500 220 610 330 680 L440 ${H} Z" fill="#7ba6c4"/>`;
      // Foam: claws of white reaching from the crest
      [[338, 196, 30], [400, 208, 24], [448, 250, 22], [462, 300, 18], [428, 334, 15], [386, 322, 13], [344, 334, 13], [292, 196, 20], [244, 214, 16], [200, 240, 13]].forEach(([x, y, r]) => {
        out += k.disc(x, y, r, PAPER);
      });
      out += k.scatter(26, (x, y, s) => (y < 330 && x > 170 && x < 520 ? k.disc(x, y, 2 + s * 5, PAPER) : ''));
      for (let i = 0; i < 5; i++) {
        out += `<path d="M${70 + i * 34} ${620 - i * 26} C${100 + i * 34} ${500 - i * 22} ${170 + i * 22} ${420 - i * 10} ${240 + i * 16} ${370 - i * 14}" fill="none" stroke="${PAPER}" stroke-width="3" opacity=".55"/>`;
      }
      return out;
    },

    // Shafts of light through a dark cedar forest
    'forest-of-light': (k) => {
      let out = k.sky([[0, '#071a1f'], [0.5, '#0f4a45'], [0.85, '#7fc29a']]);
      out += k.disc(300, 250, 90, '#f7f0c8');
      [[90, 180], [210, 130], [360, 150], [480, 120]].forEach(([x, w]) => {
        out += `<path d="M${x} 0 L${x + w} 0 L${x + w * 1.8} ${H} L${x - w * 0.5} ${H} Z" fill="#f7f0c8" opacity=".1"/>`;
      });
      [[30, 44, '#0a2a2b'], [130, 30, '#07201f'], [226, 58, '#0a2a2b'], [370, 34, '#07201f'], [455, 66, '#061b1b'], [565, 40, '#0a2a2b']].forEach(([x, w, fill]) => {
        out += `<path d="M${x} 0 L${x + w} 0 L${x + w * 1.2} ${H} L${x - w * 0.2} ${H} Z" fill="${fill}"/>`;
        for (let i = 0; i < 7; i++) out += `<path d="M${x + 4 + k.random() * (w - 8)} ${k.random() * 600} v${40 + k.random() * 60}" stroke="#113e3a" stroke-width="2"/>`;
      });
      out += k.hills(630, 40, '#051615');
      out += k.scatter(40, (x, y, s) => (y > 280 ? k.disc(x, y, 1.6 + s * 2.6, '#f4f09a', `opacity="${0.5 + s * 0.5}"`) : ''));
      return out;
    },

    // A yatai food stall glowing at night
    'midnight-yatai-market': (k) => {
      let out = k.sky([[0, '#10163a'], [0.7, '#3a2352'], [1, '#6e2f44']]);
      out += k.scatter(46, (x, y, s) => (y < 280 ? k.disc(x, y, 0.8 + s * 1.6, PAPER) : ''));
      out += k.disc(300, 420, 300, '#ffb066', 'opacity=".16"');
      // Ground, counter, posts
      out += `<rect y="600" width="${W}" height="120" fill="#1a1020"/>`;
      out += `<rect x="96" y="210" width="14" height="330" fill="#2a1710"/><rect x="490" y="210" width="14" height="330" fill="#2a1710"/>`;
      out += `<rect x="96" y="250" width="408" height="240" fill="#f7d48a"/>`;
      // Steam
      [220, 300, 380].forEach((x) => {
        out += `<path d="M${x} 450 c-26 -34 26 -54 0 -88 c-20 -28 20 -44 0 -70" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".6"/>`;
      });
      // Noren cloths
      for (let i = 0; i < 5; i++) {
        out += `<rect x="${108 + i * 78}" y="240" width="72" height="104" fill="#14233f"/>`;
        out += `<path d="M${144 + i * 78} 270 a14 14 0 1 0 .01 0" fill="none" stroke="${PAPER}" stroke-width="3"/>`;
      }
      // Striped awning
      for (let i = 0; i < 8; i++) {
        out += `<path d="M${60 + i * 60} 150 h60 l${i < 4 ? -8 : 8} 90 h-60 Z" fill="${i % 2 ? PAPER : SHU}"/>`;
      }
      out += `<rect x="60" y="136" width="480" height="18" fill="${INK}"/>`;
      // Counter and stools
      out += `<rect x="70" y="486" width="460" height="26" fill="#6e3d20"/><rect x="88" y="512" width="424" height="90" fill="#4a2815"/>`;
      [140, 300, 460].forEach((x) => { out += `<rect x="${x - 30}" y="610" width="60" height="14" fill="#a8691f"/><rect x="${x - 5}" y="624" width="10" height="50" fill="#3a1f10"/>`; });
      out += k.lantern(70, 330, 34, SHU, '#ff9a4a') + k.lantern(530, 330, 34, SHU, '#ff9a4a');
      return out;
    },

    // A tea bowl under spring blossom
    'spring-tea-gathering': (k) => {
      let out = k.sky([[0, '#f7f3df'], [0.55, '#dfe6b4'], [1, '#a9bd72']]);
      out += k.disc(450, 180, 120, '#ffe0d9', 'opacity=".75"');
      out += k.branch([[0, 60], [120, 120], [230, 110], [340, 180]], '#3f2a22', 12, (x, y) => k.blossom(x, y, 11 + k.random() * 10, k.random() > 0.5 ? '#f7c6d2' : '#fbdfe6'), 34);
      out += k.branch([[120, 120], [150, 220]], '#3f2a22', 7, (x, y) => k.blossom(x, y, 12, '#f7c6d2'), 7);
      // Steam
      out += `<path d="M260 400 c-22 -30 22 -48 0 -78" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/><path d="M340 396 c-22 -30 22 -48 0 -78" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>`;
      // Chawan
      out += `<path d="M110 430 C120 590 190 640 300 640 C410 640 480 590 490 430 Z" fill="#2c2420"/>`;
      out += `<path d="M110 430 C112 480 124 520 142 552 C160 510 170 540 190 500 C210 540 240 500 262 524 C290 490 330 530 360 498 C390 530 420 500 450 540 C474 510 486 470 490 430 Z" fill="#6b4a3a"/>`;
      out += `<rect x="255" y="636" width="90" height="26" rx="6" fill="#1b1512"/>`;
      out += `<ellipse cx="300" cy="430" rx="190" ry="38" fill="#3c2c24"/><ellipse cx="300" cy="432" rx="172" ry="29" fill="#7da33a"/><ellipse cx="270" cy="428" rx="66" ry="10" fill="#a6c75b"/>`;
      out += k.scatter(14, (x, y, s) => k.blossom(x, y, 4 + s * 5, '#f7c6d2'));
      return out;
    },

    // A red Fuji at dawn, with a runner's path curving up to it
    'fuji-sunrise-run': (k) => {
      let out = k.sky([[0, '#1b4a7c'], [0.42, '#7fb2c9'], [0.66, '#f3e3c2']]);
      for (let row = 0; row < 7; row++) {
        for (let i = 0; i < 9; i++) {
          out += `<ellipse cx="${(row % 2 ? 30 : 0) + i * 72 + k.random() * 12}" cy="${40 + row * 26}" rx="${13 + k.random() * 11}" ry="4" fill="#fff" opacity=".82"/>`;
        }
      }
      out += `<path d="M-60 620 C90 540 200 320 262 216 L338 216 C400 320 510 540 660 620 Z" fill="#b5381f"/>`;
      out += `<path d="M262 216 L338 216 C356 246 374 276 392 310 L366 292 L348 340 L322 288 L298 352 L276 290 L248 340 L232 288 L208 310 C226 276 244 246 262 216 Z" fill="#25180f"/>`;
      for (let i = 0; i < 9; i++) out += `<path d="M${208 + i * 22} ${346 + (i % 3) * 18} l${-24 + i * 6} ${70 + (i % 2) * 40}" stroke="#7d2312" stroke-width="3" opacity=".55"/>`;
      out += k.hills(600, 50, '#23452f');
      for (let i = 0; i < 26; i++) {
        const x = k.random() * W;
        const y = 610 + k.random() * 60;
        out += `<path d="M${x} ${y} l14 34 h-28 Z" fill="#132a1d"/>`;
      }
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        out += k.disc(120 + Math.sin(t * 3.1) * 90 + t * 150, 712 - t * 120, 7 - t * 4.2, PAPER);
      }
      return out;
    },

    // An archery target pierced among bamboo
    'kyudo-open-day': (k) => {
      let out = k.sky([[0, '#f6efdc'], [1, '#e2d2ab']]);
      [[60, 34, '#5c8a4f'], [130, 24, '#6f9c5c'], [500, 28, '#5c8a4f'], [556, 38, '#47733f']].forEach(([x, w, fill]) => {
        out += `<rect x="${x - w / 2}" y="0" width="${w}" height="${H}" fill="${fill}"/>`;
        for (let y = 60 + k.random() * 50; y < H; y += 120) {
          out += `<rect x="${x - w / 2 - 2}" y="${y}" width="${w + 4}" height="6" fill="#2f5230"/>`;
          out += `<path d="M${x} ${y} q${x < 300 ? 60 : -60} -34 ${x < 300 ? 110 : -110} -8 q${x < 300 ? -60 : 60} 14 ${x < 300 ? -110 : 110} 8 Z" fill="#3f6b3b"/>`;
        }
      });
      // Mato target
      out += k.disc(310, 340, 182, '#f7f3e6', `stroke="${INK}" stroke-width="3"`);
      [[150, INK], [116, '#f7f3e6'], [84, INK], [52, '#f7f3e6'], [24, SHU]].forEach(([r, fill]) => { out += k.disc(310, 340, r, fill); });
      // Arrow
      out += `<path d="M322 332 L588 88" stroke="#6b3f1c" stroke-width="7"/>`;
      out += `<path d="M560 88 L600 56 L598 104 Z M536 114 L580 84 L578 128 Z" fill="${SHU}"/>`;
      out += `<rect y="600" width="${W}" height="120" fill="#b89f6b"/><path d="M0 600 H${W}" stroke="${INK}" stroke-width="3"/>`;
      return out;
    },

    // A broken bowl mended with lines of gold
    'kintsugi-repair-day': (k) => {
      let out = k.sky([[0, '#23302f'], [1, '#0f1616']]);
      out += k.disc(300, 340, 240, '#2f4240', 'opacity=".7"');
      out += `<path d="M78 262 C84 470 170 590 300 590 C430 590 516 470 522 262 Z" fill="#8fa89f"/>`;
      out += `<path d="M78 262 C84 470 170 590 300 590 C230 560 170 440 168 262 Z" fill="#a9c0b5"/>`;
      out += `<path d="M390 262 C388 440 360 540 300 590 C430 590 516 470 522 262 Z" fill="#6f8a81"/>`;
      out += `<ellipse cx="300" cy="262" rx="222" ry="52" fill="#3a4c49"/><ellipse cx="300" cy="266" rx="198" ry="38" fill="#26332f"/>`;
      out += `<rect x="238" y="586" width="124" height="32" rx="8" fill="#5f7770"/>`;
      // Gold seams
      const gold = `fill="none" stroke="#e9bf52" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;
      out += `<path d="M196 304 L232 372 L204 424 L262 478 L250 560" ${gold}/>`;
      out += `<path d="M232 372 L318 346 L372 396 L350 452 L420 500" ${gold}/>`;
      out += `<path d="M318 346 L336 306" ${gold}/><path d="M262 478 L350 452" ${gold}/><path d="M372 396 L460 368" ${gold}/>`;
      out += `<path d="M196 304 L232 372 L204 424 L262 478 L250 560" fill="none" stroke="#fff3c4" stroke-width="2" opacity=".7"/>`;
      return out;
    },

    // Indigo-dyed cloth drying on a bamboo pole
    'indigo-dye-workshop': (k) => {
      let out = k.sky([[0, '#f6f1e3'], [1, '#d9d3bf']]);
      out += `<rect x="-10" y="82" width="620" height="16" fill="#a88a4e"/>`;
      for (let x = 60; x < W; x += 120) out += `<rect x="${x}" y="80" width="5" height="20" fill="#6e5730"/>`;

      const panel = (x, w, h, fill, draw) => {
        let inner = `<path d="M${x} 92 H${x + w} V${h} L${x + w * 0.8} ${h + 10} L${x + w * 0.55} ${h - 6} L${x + w * 0.28} ${h + 12} L${x} ${h} Z" fill="${fill}"/>`;
        inner += draw(x, w, h);
        return inner;
      };
      // Shibori rings
      out += panel(30, 164, 560, '#14305c', (x, w, h) => {
        let d = '';
        for (let cy = 140; cy < h - 20; cy += 62) {
          for (let cx = x + 34; cx < x + w; cx += 62) {
            d += `<circle cx="${cx}" cy="${cy}" r="20" fill="none" stroke="#e9eef4" stroke-width="3.5" stroke-dasharray="3 5"/><circle cx="${cx}" cy="${cy}" r="6" fill="#e9eef4"/>`;
          }
        }
        return d;
      });
      // Asanoha, the hemp-leaf star
      out += panel(214, 176, 620, '#20457c', (x, w, h) => {
        let d = '';
        const s = 58;
        for (let cy = 130; cy < h - 20; cy += s) {
          for (let cx = x + 30; cx < x + w; cx += s) {
            d += `<path d="M${cx} ${cy - s / 2} L${cx} ${cy + s / 2} M${cx - s / 2} ${cy} L${cx + s / 2} ${cy} M${cx - s / 2} ${cy - s / 2} L${cx + s / 2} ${cy + s / 2} M${cx + s / 2} ${cy - s / 2} L${cx - s / 2} ${cy + s / 2}" stroke="#e9eef4" stroke-width="2.2"/>`;
          }
        }
        return d;
      });
      // Arashi: diagonal rain lines
      out += panel(410, 160, 530, '#0f2547', (x, w, h) => {
        let d = '';
        for (let i = -6; i < 16; i++) {
          d += `<path d="M${Math.max(x, x + i * 22)} ${i < 0 ? 92 - i * 22 : 92} L${Math.min(x + w, x + i * 22 + (h - 110))} ${Math.min(h - 8, 92 + (i < 0 ? -i * 22 : 0) + (Math.min(x + w, x + i * 22 + (h - 110)) - Math.max(x, x + i * 22)))}" stroke="#cfdbe8" stroke-width="2.5" opacity=".9"/>`;
        }
        return d;
      });
      out += `<ellipse cx="300" cy="${H - 8}" rx="330" ry="44" fill="#14305c" opacity=".2"/>`;
      return out;
    },
  };

  let instance = 0;

  const svg = (event) => {
    const id = `print-${instance++}`;
    const k = kit(id, seeded(event.slug));
    const body = SCENES[event.slug](k);
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Woodblock-style print for ${Events.escapeHtml(event.name)}">
      <defs>${k.defs.join('')}</defs>${body}
    </svg>`;
  };

  /* The print plus its vertical title cartouche and publisher's seal. */
  const print = (event) => `
    <div class="print">
      ${svg(event)}
      <span class="print__title" lang="ja" aria-hidden="true">${event.kanji}</span>
      <span class="seal print__seal" lang="ja" aria-hidden="true">${Events.categoryKanji(event.category)}</span>
    </div>`;

  return { print };
})();
