/* Event data and the helpers that read it. All dates are in India Standard Time. */
const Events = (() => {
  const CATEGORIES = ['Music', 'Technology', 'Art', 'Food', 'Sports', 'Workshops'];

  const ALL = [
    {
      slug: 'neon-monsoon-live',
      name: 'Neon Monsoon Live',
      category: 'Music',
      start: '2026-12-12T18:00:00+05:30',
      end: '2026-12-12T23:30:00+05:30',
      venue: 'Lakeside Amphitheatre',
      city: 'Bengaluru',
      price: 1499,
      seatsLeft: 212,
      featured: true,
      host: 'Monsoon Sound Collective',
      short: 'Five synth-pop acts, one open-air stage and a light show timed to every beat.',
      about: 'Neon Monsoon takes over the lake for one night of synth-pop and live electronica. Five acts play back to back on an open-air stage, with a 40-metre light rig programmed to follow the music. Come early for the food courts and stay for the closing set over the water.',
      highlights: ['Five live acts on a single stage', 'Synchronised 40-metre light installation', 'Food courts open from 5 pm'],
      schedule: [['6:00 pm', 'Gates open, opening DJ set'], ['7:30 pm', 'Live acts begin'], ['10:15 pm', 'Headline set and light show']],
    },
    {
      slug: 'build-in-a-weekend',
      name: 'Build in a Weekend',
      category: 'Technology',
      start: '2027-01-16T09:00:00+05:30',
      end: '2027-01-17T18:00:00+05:30',
      venue: 'The Foundry Hall',
      city: 'Hyderabad',
      price: 499,
      seatsLeft: 64,
      featured: true,
      host: 'Foundry Makers Guild',
      short: 'A 36-hour hack sprint with mentors, demo day and a prize pool for working products.',
      about: 'Form a team on Saturday morning and demo a working product on Sunday evening. Mentors from product, design and engineering walk the floor all weekend, and meals, power and coffee are taken care of. Beginners are welcome, and there is a team-matching session if you arrive solo.',
      highlights: ['Open to beginners, with team matching on arrival', 'Mentors available through both days', 'Demo day judged on working products'],
      schedule: [['9:00 am', 'Saturday: team matching and kickoff'], ['8:00 pm', 'Saturday: mentor office hours'], ['4:00 pm', 'Sunday: demos and awards']],
    },
    {
      slug: 'slow-light-art-walk',
      name: 'Slow Light: Projection Art Walk',
      category: 'Art',
      start: '2027-02-06T18:30:00+05:30',
      end: '2027-02-06T22:00:00+05:30',
      venue: 'Old City Haveli Quarter',
      city: 'Jaipur',
      price: 650,
      seatsLeft: 148,
      featured: true,
      host: 'Slow Light Studio',
      short: 'Twelve artists turn haveli walls into a guided walk of large-scale projection pieces.',
      about: 'Slow Light turns the walls of the old city into a canvas after dark. Follow a guided route through twelve large-scale projection pieces, each made for the specific courtyard it appears in. The walk is unhurried, about two hours, with live musicians at the final courtyard.',
      highlights: ['Twelve site-specific projection pieces', 'Guided walk of about two hours', 'Live musicians in the final courtyard'],
      schedule: [['6:30 pm', 'First group departs'], ['8:00 pm', 'Last group departs'], ['9:00 pm', 'Courtyard performance']],
    },
    {
      slug: 'midnight-supper-market',
      name: 'Midnight Supper Market',
      category: 'Food',
      start: '2026-11-28T19:00:00+05:30',
      end: '2026-11-29T01:00:00+05:30',
      venue: 'Dockside Warehouse 9',
      city: 'Mumbai',
      price: 350,
      seatsLeft: 310,
      host: 'Night Table Mumbai',
      short: 'Forty stalls, one warehouse and a menu that only gets better after dark.',
      about: 'Forty of the city\'s best small kitchens set up inside a working dockside warehouse for one night. Expect regional street food, late-night desserts and a coffee bar that stays open until the last stall closes. Your entry fee covers the door; food is paid for at each stall.',
      highlights: ['Forty independent kitchens', 'Vegetarian and vegan stalls marked on the map', 'Coffee bar open until close'],
      schedule: [['7:00 pm', 'Doors open'], ['9:30 pm', 'Chef showdown on the main stage'], ['12:00 am', 'Late-night dessert round']],
    },
    {
      slug: 'clay-and-colour',
      name: 'Clay & Colour Studio Day',
      category: 'Workshops',
      start: '2026-12-06T10:30:00+05:30',
      end: '2026-12-06T16:30:00+05:30',
      venue: 'Earthen Studio',
      city: 'Pune',
      price: 1200,
      seatsLeft: 4,
      host: 'Earthen Studio',
      short: 'Throw, glaze and take home two ceramic pieces in a small hands-on class.',
      about: 'A full day at the wheel in a class capped at twelve people. You\'ll learn centring and throwing, glaze two pieces of your own, and collect them fired two weeks later. All clay, tools and aprons are included, and no experience is needed.',
      highlights: ['Class capped at twelve people', 'All materials and aprons included', 'Two finished pieces to keep'],
      schedule: [['10:30 am', 'Wheel basics and first throw'], ['1:00 pm', 'Lunch in the garden'], ['2:00 pm', 'Trimming and glazing']],
    },
    {
      slug: 'hand-painted-type-walk',
      name: 'Hand-Painted: Type Walk & Expo',
      category: 'Art',
      start: '2026-12-19T16:00:00+05:30',
      end: '2026-12-19T20:00:00+05:30',
      venue: 'Mylapore Arts Courtyard',
      city: 'Chennai',
      price: 0,
      seatsLeft: 90,
      host: 'Letterform Chennai',
      short: 'A free walk through the city\'s sign-painting heritage, ending at a live lettering expo.',
      about: 'Walk the streets where hand-painted signage still survives with a guide who knows who painted what. The route ends at an open courtyard where working sign painters letter live and take small commissions. Entry is free, but places on the walk are limited.',
      highlights: ['Free entry, with limited walk places', 'Live lettering by working sign painters', 'Small commissions available on the day'],
      schedule: [['4:00 pm', 'Walk begins at the courtyard'], ['5:30 pm', 'Expo opens'], ['7:00 pm', 'Panel with sign painters']],
    },
    {
      slug: 'terrace-jazz-sessions',
      name: 'Terrace Jazz Sessions',
      category: 'Music',
      start: '2027-01-09T19:30:00+05:30',
      end: '2027-01-09T22:30:00+05:30',
      venue: 'Casa Azul Terrace',
      city: 'Panaji',
      price: 1100,
      seatsLeft: 0,
      host: 'Casa Azul',
      short: 'A seated trio set under the open sky, with sixty seats and no bad view.',
      about: 'A warm evening of standards and originals from a touring jazz trio, played on a terrace with room for sixty. The kitchen serves small plates through the set, and the band usually stays on for an informal second half.',
      highlights: ['Intimate seated set for sixty guests', 'Small plates served through the set', 'Informal second half with the band'],
      schedule: [['7:30 pm', 'Seating and small plates'], ['8:15 pm', 'First set'], ['9:30 pm', 'Second set']],
    },
    {
      slug: 'coastal-sunrise-10k',
      name: 'Coastal Sunrise 10K',
      category: 'Sports',
      start: '2027-01-31T05:30:00+05:30',
      end: '2027-01-31T09:30:00+05:30',
      venue: 'Marine Drive Promenade',
      city: 'Kochi',
      price: 900,
      seatsLeft: 420,
      host: 'Kochi Run Club',
      short: 'A flat, chip-timed 10K along the water, starting just before the sun comes up.',
      about: 'A flat and fast out-and-back along the backwaters, timed so you finish in the morning light. Every finisher gets a chip time, a medal and breakfast at the end. There is also a 5K fun-run option for first-timers and families.',
      highlights: ['Flat, chip-timed course', 'Medal and breakfast for every finisher', '5K fun-run option on the day'],
      schedule: [['5:30 am', 'Warm-up and bag drop'], ['6:00 am', 'Race start'], ['7:45 am', 'Breakfast and medals']],
    },
    {
      slug: 'harvest-long-table',
      name: 'Harvest Long Table',
      category: 'Food',
      start: '2027-02-20T12:30:00+05:30',
      end: '2027-02-20T17:00:00+05:30',
      venue: 'Godavari Hills Orchard',
      city: 'Nashik',
      price: 2400,
      seatsLeft: 26,
      host: 'Long Table Kitchen',
      short: 'One table, six courses and produce picked within a mile of where you sit.',
      about: 'A slow six-course lunch at a single long table among the orchard rows. Each course is built around what was picked that morning, and the farmers join in to talk through what\'s on your plate. Tell us about dietary needs when you arrive and the kitchen will adapt.',
      highlights: ['Six courses of same-day produce', 'Farmers at the table with you', 'Orchard walk included after lunch'],
      schedule: [['12:30 pm', 'Welcome drinks in the orchard'], ['1:15 pm', 'Lunch is served'], ['4:00 pm', 'Orchard walk']],
    },
    {
      slug: 'night-league-box-cricket',
      name: 'Night League Box Cricket',
      category: 'Sports',
      start: '2027-03-06T18:00:00+05:30',
      end: '2027-03-06T23:00:00+05:30',
      venue: 'Arena 21 Turf',
      city: 'New Delhi',
      price: 600,
      seatsLeft: 38,
      host: 'Arena 21',
      short: 'Fast six-a-side games under floodlights, with solo players welcome to join a squad.',
      about: 'Six-a-side, six overs and no long boundaries. Register as a player and we\'ll place you in a squad if you\'re coming alone. Games run back to back under floodlights until the final, with live scoring on the big screen all night.',
      highlights: ['Six-a-side, six-over format', 'Solo players placed into squads', 'Live scoring on the big screen'],
      schedule: [['6:00 pm', 'Squad draw and warm-up'], ['6:45 pm', 'Group games'], ['10:00 pm', 'Final and trophies']],
    },
    {
      slug: 'craft-frontend-conf',
      name: 'Craft: The Frontend Conference',
      category: 'Technology',
      start: '2027-03-13T09:30:00+05:30',
      end: '2027-03-13T18:30:00+05:30',
      venue: 'Whitefield Convention Centre',
      city: 'Bengaluru',
      price: 2999,
      seatsLeft: 175,
      host: 'Craft Community',
      short: 'One day of talks on motion, performance and the details that make interfaces feel good.',
      about: 'A single-track conference for people who care how the web feels. Expect talks on motion, rendering performance, accessibility and design systems, all from practitioners showing real work. Lunch and the evening social are included in your ticket.',
      highlights: ['Single-track, so you never miss a talk', 'Practitioners showing real production work', 'Lunch and evening social included'],
      schedule: [['9:30 am', 'Registration and coffee'], ['10:30 am', 'Morning talks'], ['5:30 pm', 'Evening social']],
    },
    {
      slug: 'story-lab-pitch',
      name: 'Story Lab: Pitch in Five',
      category: 'Workshops',
      start: '2027-04-10T11:00:00+05:30',
      end: '2027-04-10T15:00:00+05:30',
      venue: 'The Writers\' Room',
      city: 'Gurugram',
      price: 799,
      seatsLeft: 18,
      host: 'Story Lab',
      short: 'Shape your idea into a five-minute pitch, then deliver it to a friendly live panel.',
      about: 'Bring a half-formed idea and leave with a pitch you can actually deliver. Over four hours you\'ll find the story in your idea, cut it to five minutes and practise it in small groups. It ends with an optional live round in front of a friendly panel that gives direct feedback.',
      highlights: ['Small-group coaching throughout', 'A tested structure you can reuse', 'Optional live round with panel feedback'],
      schedule: [['11:00 am', 'Finding the story'], ['12:30 pm', 'Cutting to five minutes'], ['2:00 pm', 'Live pitch round']],
    },
  ];

  const LOCALE = 'en-IN';
  const TIME_ZONE = 'Asia/Kolkata';
  const dateFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE });
  const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIME_ZONE });

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
    status,
    seatLabel,
    countdownText,
    tick,
    formatDate: (event) => dateFormat.format(new Date(event.start)),
    formatTime: (event) => `${timeFormat.format(new Date(event.start))} – ${timeFormat.format(new Date(event.end))}`,
    formatPrice: (event) => (event.price === 0 ? 'Free' : `₹${event.price.toLocaleString(LOCALE)}`),
    escapeHtml,
  };
})();
