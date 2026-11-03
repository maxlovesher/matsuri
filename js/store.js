/* Local Storage layer. Every access is guarded: private windows and blocked
   site data can make it throw, and the page has to keep working regardless. */
const Store = (() => {
  const KEYS = {
    registrations: 'gravity.registrations.v1',
    theme: 'gravity.theme',
    palette: 'gravity.palette',
  };

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Falls back to in-memory state for this visit. */
    }
  };

  let registrations = read(KEYS.registrations, []);
  if (!Array.isArray(registrations)) registrations = [];

  const makeRef = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = 'GRV-';
    for (let i = 0; i < 6; i++) ref += alphabet[Math.floor(Math.random() * alphabet.length)];
    return ref;
  };

  return {
    registrations: () => registrations.slice(),

    addRegistration({ slug, name, email, phone }) {
      const entry = { ref: makeRef(), slug, name, email, phone, createdAt: new Date().toISOString() };
      registrations.push(entry);
      write(KEYS.registrations, registrations);
      return entry;
    },

    removeRegistration(ref) {
      registrations = registrations.filter((r) => r.ref !== ref);
      write(KEYS.registrations, registrations);
    },

    seatsTaken: (slug) => registrations.filter((r) => r.slug === slug).length,

    isRegistered: (slug, email) =>
      registrations.some((r) => r.slug === slug && r.email.toLowerCase() === email.toLowerCase()),

    setPref: (name, value) => write(KEYS[name], value),
  };
})();
