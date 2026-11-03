/* Renders the featured list, category links, event grid, search and filters. */
const Catalogue = (() => {
  const icon = (name) => `<svg class="icon"><use href="#i-${name}"/></svg>`;
  const { escapeHtml: esc } = Events;

  const grid = document.getElementById('eventGrid');
  const featuredList = document.getElementById('featuredList');
  const searchInput = document.getElementById('eventSearch');
  const chips = document.getElementById('categoryChips');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');

  const state = { query: '', category: 'All' };

  const featureCard = (event) => `
    <article class="feature-card">
      ${Poster.print(event)}
      <div class="feature-card__body">
        <div class="feature-card__top">
          <span>${esc(event.category)} · ${esc(event.city)}</span>
          <span class="feature-card__count" data-countdown="${event.slug}" aria-hidden="true">${Events.countdownText(event)}</span>
        </div>
        <h3><a class="stretched" href="#event/${event.slug}">${esc(event.name)}</a></h3>
        <p>${esc(Events.formatDate(event))} · ${esc(event.venue)}</p>
        <p>${esc(event.short)}</p>
      </div>
    </article>`;

  const eventCard = (event, index) => {
    const seats = Events.seatLabel(event);
    return `
    <article class="event-card${Events.status(event) === 'open' ? '' : ' is-muted'}" style="--i:${Math.min(index, 8)}">
      <div class="event-card__art">
        ${Poster.print(event)}
        <span class="event-card__count" data-countdown="${event.slug}" aria-hidden="true">${Events.countdownText(event)}</span>
      </div>
      <div class="event-card__body">
        <div class="date-block" aria-hidden="true">
          <b>${Events.dayOfMonth(event)}</b>
          <span lang="ja">${Events.monthKanji(event)}</span>
        </div>
        <h3><a class="stretched" href="#event/${event.slug}">${esc(event.name)}</a></h3>
        <p class="venue">${icon('pin')}<span>${esc(event.venue)}, ${esc(event.city)}<span class="visually-hidden">, ${esc(Events.formatDate(event))}</span></span></p>
        <p class="event-card__desc">${esc(event.short)}</p>
        <div class="event-card__foot">
          <span class="event-card__price">${Events.formatPrice(event)}</span>
          <span class="seats${seats.low ? ' seats--low' : ''}">${seats.text}</span>
        </div>
      </div>
    </article>`;
  };

  const matches = (event) => {
    if (state.category !== 'All' && event.category !== state.category) return false;
    const words = state.query.toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = `${event.name} ${event.category} ${event.venue} ${event.city} ${event.short}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  };

  const renderGrid = () => {
    const results = Events.sorted().filter(matches);
    grid.innerHTML = results.map(eventCard).join('');
    grid.hidden = results.length === 0;
    emptyState.hidden = results.length !== 0;
    resultCount.textContent = `${results.length} ${results.length === 1 ? 'event' : 'events'}`;
  };

  const renderChips = () => {
    const all = `<button class="chip" type="button" data-chip="All" aria-pressed="${state.category === 'All'}">All</button>`;
    chips.innerHTML = all + Events.CATEGORIES.map(({ name, kanji }) => `
      <button class="chip" type="button" data-chip="${name}" aria-pressed="${state.category === name}"><b lang="ja" aria-hidden="true">${kanji}</b>${name}</button>
    `).join('');
  };

  const setCategory = (category) => {
    state.category = category;
    renderChips();
    renderGrid();
  };

  const clear = () => {
    state.query = '';
    searchInput.value = '';
    setCategory('All');
  };

  const renderStatic = () => {
    featuredList.innerHTML = Events.featured().map(featureCard).join('');

    document.getElementById('categoryLinks').innerHTML = Events.CATEGORIES.map(({ name, kanji }) => `
      <li><button type="button" data-category="${name}"><b lang="ja" aria-hidden="true">${kanji}</b>${name} <small>${Events.inCategory(name).length} events</small></button></li>
    `).join('');

    document.getElementById('footerCategories').innerHTML = Events.CATEGORIES.slice(0, 4).map(({ name }) => `
      <li><button type="button" data-category="${name}">${name}</button></li>
    `).join('');

    const next = Events.next();
    if (next) {
      document.getElementById('nextUpName').textContent = next.name;
      document.getElementById('nextUpCount').dataset.countdown = next.slug;
      document.getElementById('nextUp').href = `#event/${next.slug}`;
    }
  };

  const init = () => {
    renderStatic();
    renderChips();
    renderGrid();

    searchInput.addEventListener('input', () => {
      state.query = searchInput.value.trim();
      renderGrid();
    });
    chips.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-chip]');
      if (chip) setCategory(chip.dataset.chip);
    });
    document.getElementById('clearFilters').addEventListener('click', () => {
      clear();
      searchInput.focus();
    });
  };

  return { init, setCategory, refresh: renderGrid };
})();
