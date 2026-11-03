/* Boots the page: loader, smooth scroll, scroll progress, theme, palette and reveals. */
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PALETTES = [
    { id: 'royal', name: 'Royal Blue & Pearl', description: 'Hyper-distinct cobalt spheres floating in soft white-slate gradients.', swatch: '#2F69FF', ball: '#2F69FF' },
    { id: 'blush', name: 'Rose Blush & Crème', description: 'Sweet candy pinks and juicy strawberry accents in a pearl studio.', swatch: '#FFA6B3', ball: '#FFC5C2' },
    { id: 'volt', name: 'Volt Lime & Slate', description: 'Electric neon volt-lime against a clean white-slate horizon.', swatch: '#E1FC03', ball: '#E1FC03' },
    { id: 'arctic', name: 'Arctic Sky & Crystal', description: 'Cool arctic crystal blues with a translucent glass sheen.', swatch: '#96E5FF', ball: '#96E5FF' },
  ];
  const DEFAULT_PALETTE = PALETTES[0];

  const control = { progress: 0, started: false, paused: false };
  const mouse = { x: 99, y: 99, isDown: false };
  let scene = null;

  /* --- Smooth wheel scrolling --- */

  const SmoothScroll = (() => {
    const LERP = 0.09;
    let target = window.scrollY;
    let current = window.scrollY;
    let animating = false;
    let lastTime = 0;

    const maxScroll = () => root.scrollHeight - window.innerHeight;
    const clamp = (value) => Math.max(0, Math.min(value, maxScroll()));

    const frame = (time) => {
      const dt = Math.max(0, Math.min((time - lastTime) / 1000, 0.05));
      lastTime = time;
      // Same glide on any refresh rate: 0.09 per frame at 60Hz.
      current += (target - current) * (1 - Math.pow(1 - LERP, dt * 60));
      if (Math.abs(target - current) < 0.5) {
        current = target;
        animating = false;
      }
      window.scrollTo(0, current);
      if (animating) requestAnimationFrame(frame);
    };

    const run = () => {
      if (animating) return;
      animating = true;
      current = window.scrollY;
      lastTime = performance.now();
      requestAnimationFrame(frame);
    };

    const onWheel = (event) => {
      const sheet = Sheets.active();
      if (sheet) {
        // Modal open: the sheet may scroll itself, but the page behind must stay put.
        const scroller = sheet.querySelector('.sheet__scroll');
        const onScrim = event.target === sheet;
        if (onScrim || scroller.scrollHeight <= scroller.clientHeight) event.preventDefault();
        return;
      }
      if (event.ctrlKey || reducedMotion || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? window.innerHeight : 1;
      target = clamp(target + event.deltaY * unit);
      run();
    };

    // Keyboard, scrollbar and touch scrolling stay native; just keep the target in step.
    const onNativeScroll = () => {
      if (!animating) {
        target = window.scrollY;
        current = window.scrollY;
      }
    };

    const to = (y) => {
      target = clamp(y);
      if (reducedMotion) window.scrollTo(0, target);
      else run();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    return { to };
  })();

  /* --- Scroll progress --- */

  const header = document.getElementById('siteHeader');
  const backdrop = document.getElementById('backdrop');
  const storySections = ['hero', 'featured', 'categories', 'release', 'events'].map((id) => document.getElementById(id));
  let sectionTops = [];

  const measureSections = () => {
    sectionTops = storySections.map((section) => section.getBoundingClientRect().top + window.scrollY);
  };

  /* Sections can be taller than the screen on phones, so progress is measured
     against each section's real position rather than multiples of the viewport. */
  const computeProgress = (y) => {
    for (let i = 0; i < sectionTops.length - 1; i++) {
      if (y < sectionTops[i + 1]) {
        return i + (y - sectionTops[i]) / (sectionTops[i + 1] - sectionTops[i]);
      }
    }
    return sectionTops.length - 1;
  };

  const stageFor = (progress) => {
    if (progress > 3.3) return 3;
    if (progress > 1.55) return 2;
    if (progress > 0.7) return 1;
    return 0;
  };

  let scrollQueued = false;
  const updateScroll = () => {
    scrollQueued = false;
    const progress = computeProgress(window.scrollY);
    control.progress = progress;
    const stage = String(stageFor(progress));
    if (backdrop.dataset.stage !== stage) backdrop.dataset.stage = stage;
    header.classList.toggle('is-scrolled', window.scrollY > 60);
  };
  const queueScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  };

  /* --- Pointer --- */

  const resetMouse = () => {
    mouse.x = 99;
    mouse.y = 99;
    mouse.isDown = false;
  };
  window.addEventListener('pointermove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('mousedown', () => { mouse.isDown = true; });
  window.addEventListener('mouseup', () => { mouse.isDown = false; });
  root.addEventListener('pointerleave', resetMouse);
  // A finger that has lifted shouldn't keep pushing spheres from where it last was.
  ['pointerup', 'pointercancel'].forEach((type) => {
    window.addEventListener(type, (event) => {
      if (event.pointerType === 'touch') resetMouse();
    });
  });

  /* --- Theme --- */

  const THEME_COLORS = { light: '#ecefff', dark: '#04060f' };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = THEME_COLORS[theme];
    document.querySelectorAll('[data-set-theme]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.setTheme === theme));
    });
    const next = theme === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('.glass-btn[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-label', `Switch to ${next} theme`);
    });
  };

  const setTheme = (theme) => {
    Store.setPref('theme', theme);
    applyTheme(theme);
  };

  /* --- Palette --- */

  const paletteList = document.getElementById('paletteList');

  const applyPalette = (id) => {
    const palette = PALETTES.find((item) => item.id === id) || DEFAULT_PALETTE;
    root.dataset.palette = palette.id;
    paletteList.querySelectorAll('[data-palette-id]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.paletteId === palette.id));
    });
    if (scene) scene.setBallColor(palette.ball);
    return palette;
  };

  const renderPalettes = () => {
    paletteList.innerHTML = PALETTES.map((palette) => `
      <button class="palette" type="button" data-palette-id="${palette.id}" aria-pressed="false">
        <span class="palette__top">${palette.name}<span class="palette__swatch" style="background:${palette.swatch}"></span></span>
        <span class="palette__desc">${palette.description}</span>
      </button>
    `).join('');
  };

  /* --- Reveal on scroll --- */

  const startReveals = () => {
    const targets = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((node) => node.classList.add('is-in'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    targets.forEach((node) => observer.observe(node));
  };

  /* --- Loader --- */

  const runLoader = (isReady, onDone) => {
    const loader = document.getElementById('loader');
    const fill = document.getElementById('loaderFill');
    const count = document.getElementById('loaderCount');
    const status = document.getElementById('loaderStatus');
    let value = 0;
    let last = performance.now();

    const frame = (now) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      const ready = isReady();

      if (ready) {
        value += (100 - value) * 6 * dt;
        if (value >= 99.4) value = 100;
      } else {
        value += (92 - value) * 1.7 * dt;
      }

      fill.style.width = `${value}%`;
      count.textContent = `${String(Math.floor(value)).padStart(3, '0')}%`;
      if (value >= 100) status.textContent = 'Entering orbit';

      if (value >= 99.9 && ready) {
        setTimeout(() => loader.classList.add('is-leaving'), 140);
        setTimeout(() => {
          loader.hidden = true;
          onDone();
        }, 660);
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  /* --- In-page links --- */

  const scrollToSection = (id) => {
    const section = id === 'top' ? null : document.getElementById(id);
    SmoothScroll.to(section ? section.getBoundingClientRect().top + window.scrollY : 0);
    if (section) section.focus({ preventScroll: true });
  };

  const closeOpenSheet = () => {
    const sheet = Sheets.active();
    if (sheet) Sheets.hide(sheet);
  };

  const wireLinks = () => {
    document.addEventListener('click', (event) => {
      const categoryButton = event.target.closest('[data-category]');
      if (categoryButton) {
        Catalogue.setCategory(categoryButton.dataset.category);
        scrollToSection('events');
        return;
      }

      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href').slice(1);
      const isSection = id === 'top' || document.getElementById(id);

      // Routes like #register open a sheet via hashchange; just make way from the mobile menu.
      if (!isSection) {
        const menu = document.getElementById('menuSheet');
        if (menu.open) Sheets.hide(menu);
        return;
      }
      event.preventDefault();
      closeOpenSheet();
      history.pushState(null, '', `#${id}`);
      scrollToSection(id);
    });
  };

  const wireControls = () => {
    const controls = document.getElementById('controlsSheet');
    const menu = document.getElementById('menuSheet');
    Sheets.register(controls);
    Sheets.register(menu);

    document.querySelectorAll('[data-open-controls]').forEach((button) => {
      button.addEventListener('click', () => Sheets.show(controls));
    });
    document.getElementById('openMenu').addEventListener('click', () => Sheets.show(menu));

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
    });
    document.querySelectorAll('[data-set-theme]').forEach((button) => {
      button.addEventListener('click', () => setTheme(button.dataset.setTheme));
    });

    paletteList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-palette-id]');
      if (!button) return;
      Store.setPref('palette', button.dataset.paletteId);
      applyPalette(button.dataset.paletteId);
    });

    document.getElementById('resetControls').addEventListener('click', () => {
      Store.setPref('palette', DEFAULT_PALETTE.id);
      applyPalette(DEFAULT_PALETTE.id);
    });
  };

  /* --- Boot --- */

  const boot = () => {
    Catalogue.init();
    Registration.init();
    renderPalettes();
    wireLinks();
    wireControls();
    applyTheme(root.dataset.theme);
    const activePalette = applyPalette(root.dataset.palette);

    measureSections();
    updateScroll();
    window.addEventListener('scroll', queueScroll, { passive: true });
    new ResizeObserver(() => {
      measureSections();
      queueScroll();
    }).observe(document.body);

    Events.tick();
    setInterval(Events.tick, 1000);

    // Modals cover the field, so don't render behind them. Controls stay live to preview palettes.
    Sheets.onChange(() => {
      const sheet = Sheets.active();
      control.paused = Boolean(sheet) && sheet.id !== 'controlsSheet';
    });

    let ready = false;
    const markReady = () => { ready = true; };
    // A slow CDN must never hold the page hostage: reveal anyway, and the field joins when it arrives.
    setTimeout(markReady, 7000);

    GravityScene.start({
      container: document.getElementById('field'),
      canvas: document.getElementById('fieldCanvas'),
      control,
      mouse,
      ballColor: activePalette.ball,
      reducedMotion,
      onReady: markReady,
    }).then((instance) => {
      scene = instance;
      scene.setBallColor(PALETTES.find((item) => item.id === root.dataset.palette).ball);
    }).catch((error) => {
      // Without WebGL the site still works; only the sphere field is missing.
      console.warn('Sphere field unavailable:', error);
      document.getElementById('field').hidden = true;
      markReady();
    });

    runLoader(() => ready, () => {
      control.started = true;
      root.classList.add('is-revealed');
      startReveals();
      measureSections();
      Registration.route();
    });
  };

  boot();
})();
