/* Event data and the helpers that read it. All dates are in Japan Standard Time. */
const Events = (() => {
  const CATEGORIES = [
    { name: 'Festival', kanji: '祭' },
    { name: 'Music', kanji: '音' },
    { name: 'Art', kanji: '美' },
    { name: 'Food', kanji: '食' },
    { name: 'Sport', kanji: '武' },
    { name: 'Craft', kanji: '工' },
  ];

  const ALL = [
    {
      slug: 'momiji-lantern-night',
      name: 'Momiji Lantern Night',
      kanji: '紅葉灯り',
      category: 'Festival',
      start: '2026-11-28T17:30:00+09:00',
      end: '2026-11-28T21:30:00+09:00',
      venue: 'Kamo Riverside Terraces',
      city: 'Kyoto',
      price: 2200,
      seatsLeft: 212,
      featured: true,
      host: 'Riverside Lantern Society',
      short: 'Thousands of paper lanterns under the last red maples of the year, along a slow night river.',
      about: 'For one evening the riverbank is lit by lantern alone. Walk beneath the last red maples of the season, write a wish on a paper lantern, and set it on the water with everyone else at the closing bell. Warm amazake and roasted chestnuts are sold along the path.',
      highlights: ['Write and float your own lantern', 'Maple path lit by lantern alone', 'Amazake and chestnut stalls along the river'],
      schedule: [['5:30 pm', 'Gates open at dusk'], ['7:00 pm', 'Lantern writing along the terraces'], ['8:45 pm', 'Closing bell and lantern release']],
    },
    {
      slug: 'thunder-on-the-bay',
      name: 'Thunder on the Bay',
      kanji: '太鼓の雷',
      category: 'Music',
      start: '2026-12-12T18:00:00+09:00',
      end: '2026-12-12T21:00:00+09:00',
      venue: 'Nankō Waterfront Stage',
      city: 'Osaka',
      price: 5800,
      seatsLeft: 148,
      featured: true,
      host: 'Naniwa Drum Collective',
      short: 'Sixty taiko drummers on one open-air stage, loud enough to feel in your ribs.',
      about: 'Six taiko troupes come together for one night by the water, ending with all sixty drummers playing as a single ensemble. Bring a warm coat: the stage is open to the bay and the sound travels. Stay after the finale to try a drum yourself.',
      highlights: ['Six troupes and a sixty-drum finale', 'Open-air stage on the waterfront', 'Try-a-drum session after the show'],
      schedule: [['6:00 pm', 'Gates open, first troupe plays'], ['7:15 pm', 'Main performances'], ['8:30 pm', 'Massed finale, then open drums']],
    },
    {
      slug: 'yukiakari-snow-walk',
      name: 'Yukiakari Snow Lantern Walk',
      kanji: '雪あかり',
      category: 'Festival',
      start: '2027-02-13T17:00:00+09:00',
      end: '2027-02-13T21:00:00+09:00',
      venue: 'Old Canal Quarter',
      city: 'Otaru',
      price: 1500,
      seatsLeft: 310,
      featured: true,
      host: 'Canal Quarter Association',
      short: 'Hand-carved snow lanterns line a mile of quiet winter streets, each with a candle inside.',
      about: 'Neighbours spend the week carving snow into hundreds of small lanterns, and on this one night the canal quarter turns off its street lights. Walk the candle-lit route at your own pace, stop for hot soup, and try carving a lantern of your own at the workshop tent.',
      highlights: ['Hundreds of hand-carved lanterns', 'Street lights switched off along the route', 'Carve your own at the workshop tent'],
      schedule: [['5:00 pm', 'Candles lit at dusk'], ['6:00 pm', 'Lantern carving tent opens'], ['8:00 pm', 'Choir at the canal bridge']],
    },
    {
      slug: 'midnight-yatai-market',
      name: 'Midnight Yatai Market',
      kanji: '深夜屋台',
      category: 'Food',
      start: '2026-12-05T19:00:00+09:00',
      end: '2026-12-06T00:30:00+09:00',
      venue: 'Nakasu Riverside Lane',
      city: 'Fukuoka',
      price: 800,
      seatsLeft: 260,
      host: 'Night Table Fukuoka',
      short: 'Forty food stalls along one lane, and a menu that only gets better after dark.',
      about: 'Forty yatai stalls set up along the river for one long night of ramen, yakitori and oden. Your entry fee covers the lane and a welcome drink; food is paid for at each stall. Benches fill quickly, so arrive hungry and be ready to share a table.',
      highlights: ['Forty independent stalls', 'Vegetarian stalls marked on the map', 'Welcome drink included with entry'],
      schedule: [['7:00 pm', 'Lane opens'], ['9:30 pm', 'Ramen showdown'], ['11:30 pm', 'Last orders and dessert round']],
    },
    {
      slug: 'kintsugi-repair-day',
      name: 'Kintsugi Repair Day',
      kanji: '金継ぎ',
      category: 'Craft',
      start: '2026-12-06T10:30:00+09:00',
      end: '2026-12-06T16:00:00+09:00',
      venue: 'Hase Lacquer Studio',
      city: 'Kamakura',
      price: 9800,
      seatsLeft: 4,
      host: 'Hase Lacquer Studio',
      short: 'Mend a broken bowl with lines of gold, in a small class that treats the crack as the point.',
      about: 'Kintsugi repairs broken pottery with lacquer and gold, making the damage part of the story. Bring a chipped favourite or use one of ours. The class is capped at twelve people, and all tools and materials are included. No experience is needed.',
      highlights: ['Class capped at twelve people', 'All tools and materials included', 'Take your mended piece home'],
      schedule: [['10:30 am', 'The history of the craft'], ['12:30 pm', 'Lunch in the garden'], ['1:30 pm', 'Lacquer and gold finishing']],
    },
    {
      slug: 'woodblock-print-fair',
      name: 'Woodblock Print Fair',
      kanji: '版画市',
      category: 'Art',
      start: '2026-12-19T11:00:00+09:00',
      end: '2026-12-19T18:00:00+09:00',
      venue: 'Yanaka Paper Hall',
      city: 'Tokyo',
      price: 0,
      seatsLeft: 90,
      host: 'Yanaka Print Guild',
      short: 'Working printmakers, old and new prints for sale, and a press you can pull yourself.',
      about: 'Twenty printmakers show how a single image passes through carvers, inks and paper. Browse stalls of old and new prints, watch a live carving demonstration, and pull your own print on a working press. Entry is free, but press sessions are limited.',
      highlights: ['Free entry, with limited press sessions', 'Live carving demonstrations', 'Twenty printmakers selling their work'],
      schedule: [['11:00 am', 'Fair opens'], ['1:00 pm', 'Carving demonstration'], ['3:30 pm', 'Talk: reading an old print']],
    },
    {
      slug: 'neon-koto-sessions',
      name: 'Neon Koto Sessions',
      kanji: '電光琴',
      category: 'Music',
      start: '2027-01-09T19:30:00+09:00',
      end: '2027-01-09T22:30:00+09:00',
      venue: 'Basement Nine',
      city: 'Tokyo',
      price: 4200,
      seatsLeft: 0,
      host: 'Basement Nine',
      short: 'A thirteen-string koto meets drum machines, in a basement with sixty seats.',
      about: 'A classically trained koto player and an electronic producer play two sets that move between old court melodies and club rhythms. The room seats sixty, with small plates served throughout, and the pair usually stay on for an informal third set.',
      highlights: ['Intimate room of sixty seats', 'Small plates served through the sets', 'Informal late set with the musicians'],
      schedule: [['7:30 pm', 'Doors and small plates'], ['8:15 pm', 'First set'], ['9:30 pm', 'Second set']],
    },
    {
      slug: 'forest-of-light',
      name: 'Forest of Light',
      kanji: '光の森',
      category: 'Art',
      start: '2027-02-06T18:30:00+09:00',
      end: '2027-02-06T21:30:00+09:00',
      venue: 'Kenroku Cedar Grove',
      city: 'Kanazawa',
      price: 2600,
      seatsLeft: 118,
      host: 'Slow Light Studio',
      short: 'Twelve artists fill an old cedar grove with light, along a guided walk through the dark.',
      about: 'Twelve artists make light pieces for the specific trees they stand among. The route is unhurried, about ninety minutes on gentle ground, and it ends at a clearing with live shakuhachi flute. Warm clothes and flat shoes are recommended.',
      highlights: ['Twelve site-specific light pieces', 'Guided walk of about ninety minutes', 'Live shakuhachi in the final clearing'],
      schedule: [['6:30 pm', 'First group departs'], ['8:00 pm', 'Last group departs'], ['8:45 pm', 'Clearing performance']],
    },
    {
      slug: 'kyudo-open-day',
      name: 'Kyūdō Archery Open Day',
      kanji: '弓道',
      category: 'Sport',
      start: '2027-03-06T10:00:00+09:00',
      end: '2027-03-06T15:00:00+09:00',
      venue: 'Asukayama Practice Hall',
      city: 'Nara',
      price: 3000,
      seatsLeft: 38,
      host: 'Nara Kyūdō Circle',
      short: 'Watch a formal demonstration, then shoot your first arrows with a teacher beside you.',
      about: 'Kyūdō is Japanese archery, practised as much for calm as for accuracy. Watch senior archers shoot in full form, then learn the eight stages of a shot with a teacher beside you. Bows and gloves are provided; wear loose clothing and clean socks.',
      highlights: ['Formal demonstration by senior archers', 'One-to-one teaching on your first shots', 'All equipment provided'],
      schedule: [['10:00 am', 'Formal demonstration'], ['11:00 am', 'First lessons in small groups'], ['2:00 pm', 'Friendly target round']],
    },
    {
      slug: 'fuji-sunrise-run',
      name: 'Fuji Sunrise Run',
      kanji: '富士朝駆け',
      category: 'Sport',
      start: '2027-03-14T05:30:00+09:00',
      end: '2027-03-14T09:30:00+09:00',
      venue: 'Lake Kawaguchi North Shore',
      city: 'Fujikawaguchiko',
      price: 4500,
      seatsLeft: 420,
      host: 'Lakeside Runners',
      short: 'A flat, chip-timed 10K around the lake, with Fuji turning red in front of you.',
      about: 'A flat and fast 10K along the north shore, timed so you run towards the mountain as the sun hits it. Every finisher gets a chip time, a medal and a hot breakfast. There is also a 5K option for first-timers and families.',
      highlights: ['Flat, chip-timed course', 'Medal and breakfast for every finisher', '5K option on the day'],
      schedule: [['5:30 am', 'Warm-up and bag drop'], ['6:00 am', 'Race start'], ['7:45 am', 'Breakfast and medals']],
    },
    {
      slug: 'spring-tea-gathering',
      name: 'Spring Tea Gathering',
      kanji: '春の茶会',
      category: 'Food',
      start: '2027-04-03T11:00:00+09:00',
      end: '2027-04-03T15:30:00+09:00',
      venue: 'Ujigawa Tea House',
      city: 'Uji',
      price: 4800,
      seatsLeft: 26,
      host: 'Ujigawa Tea House',
      short: 'Whisk your own matcha under the cherry trees, then taste three harvests side by side.',
      about: 'An unhurried day at a riverside tea house during cherry blossom season. A tea teacher guides you through whisking your own bowl, followed by a tasting of three harvests with seasonal sweets. No experience or special clothing is needed.',
      highlights: ['Whisk your own bowl of matcha', 'Tasting of three harvests', 'Seasonal sweets from a local maker'],
      schedule: [['11:00 am', 'Welcome and garden walk'], ['12:30 pm', 'Whisking lesson'], ['2:00 pm', 'Harvest tasting']],
    },
    {
      slug: 'indigo-dye-workshop',
      name: 'Indigo Dye Workshop',
      kanji: '藍染め',
      category: 'Craft',
      start: '2027-04-10T10:00:00+09:00',
      end: '2027-04-10T15:00:00+09:00',
      venue: 'Yoshino River Dye House',
      city: 'Tokushima',
      price: 6500,
      seatsLeft: 18,
      host: 'Yoshino River Dye House',
      short: 'Fold, bind and dip your own cloth in a living indigo vat, and watch it turn blue in the air.',
      about: 'Learn three traditional shibori folds, then dip your cloth in a natural indigo vat that the dye house has kept alive for years. The colour only appears as the cloth meets the air, which never stops being surprising. You take home a scarf and a sampler.',
      highlights: ['Three traditional shibori techniques', 'Dye in a natural fermented vat', 'Take home a scarf and a sampler'],
      schedule: [['10:00 am', 'Folding and binding'], ['12:30 pm', 'Lunch by the river'], ['1:30 pm', 'Dyeing and rinsing']],
    },
  ];

  const LOCALE = 'en-GB';
  const TIME_ZONE = 'Asia/Tokyo';
  const MONTHS_KANJI = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const dateFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE });
  const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIME_ZONE });
  const dayFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', timeZone: TIME_ZONE });
  const monthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'numeric', timeZone: TIME_ZONE });

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const startMs = (event) => new Date(event.start).getTime();
  const endMs = (event) => new Date(event.end).getTime();

  const seatsLeft = (event) => Math.max(0, event.seatsLeft - Store.seatsTaken(event.slug));

  /* One of: ended, soldout, open */
  const status = (event) => {
    if (Date.now() >= endMs(event)) return 'ended';
    if (seatsLeft(event) === 0) return 'soldout';
    return 'open';
  };

  const sorted = () => ALL.slice().sort((a, b) => {
    const aEnded = status(a) === 'ended';
    const bEnded = status(b) === 'ended';
    if (aEnded !== bEnded) return aEnded ? 1 : -1;
    return startMs(a) - startMs(b);
  });

  const seatLabel = (event) => {
    const state = status(event);
    if (state === 'ended') return { text: 'Event ended', low: false };
    if (state === 'soldout') return { text: 'Sold out', low: true };
    const left = seatsLeft(event);
    if (left <= 10) return { text: `Only ${left} left`, low: true };
    return { text: `${left} seats left`, low: false };
  };

  const pad = (n) => String(n).padStart(2, '0');

  const timeParts = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    };
  };

  const countdownText = (event) => {
    const now = Date.now();
    if (now >= endMs(event)) return 'Ended';
    if (now >= startMs(event)) return 'Happening now';
    const { days, hours, minutes } = timeParts(startMs(event) - now);
    return days > 0 ? `In ${days}d ${pad(hours)}h` : `In ${pad(hours)}h ${pad(minutes)}m`;
  };

  const find = (slug) => ALL.find((event) => event.slug === slug);

  const renderSegments = (node, event) => {
    const now = Date.now();
    if (now >= startMs(event)) {
      const text = now >= endMs(event) ? 'This event has ended.' : 'Happening right now.';
      if (node.textContent !== text) {
        node.className = 'countdown-note';
        node.textContent = text;
      }
      return;
    }
    const parts = timeParts(startMs(event) - now);
    Object.keys(parts).forEach((unit) => {
      const value = node.querySelector(`[data-unit="${unit}"]`);
      const text = pad(parts[unit]);
      if (value && value.textContent !== text) value.textContent = text;
    });
  };

  /* Ticks every countdown on the page from one timer. */
  const tick = () => {
    document.querySelectorAll('[data-countdown]').forEach((node) => {
      const event = find(node.dataset.countdown);
      if (!event) return;
      if (node.dataset.style === 'segments') {
        renderSegments(node, event);
      } else {
        const text = countdownText(event);
        if (node.textContent !== text) node.textContent = text;
      }
    });
  };

  return {
    CATEGORIES,
    find,
    sorted,
    featured: () => sorted().filter((event) => event.featured),
    next: () => sorted().find((event) => Date.now() < startMs(event) && status(event) === 'open'),
    inCategory: (category) => ALL.filter((event) => event.category === category),
    categoryKanji: (name) => CATEGORIES.find((category) => category.name === name).kanji,
    status,
    seatLabel,
    countdownText,
    tick,
    formatDate: (event) => dateFormat.format(new Date(event.start)),
    formatTime: (event) => `${timeFormat.format(new Date(event.start))} – ${timeFormat.format(new Date(event.end))}`,
    formatPrice: (event) => (event.price === 0 ? 'Free' : `¥${event.price.toLocaleString(LOCALE)}`),
    dayOfMonth: (event) => dayFormat.format(new Date(event.start)),
    monthKanji: (event) => MONTHS_KANJI[Number(monthFormat.format(new Date(event.start))) - 1],
    escapeHtml,
  };
})();
