/* The event sheet (details -> form -> confirmation) and the saved-tickets list. */
const Registration = (() => {
  const icon = (name) => `<svg class="icon"><use href="#i-${name}"/></svg>`;
  const { escapeHtml: esc } = Events;

  const sheet = document.getElementById('eventSheet');
  const body = document.getElementById('eventSheetBody');
  const ticketList = document.getElementById('ticketList');

  const ROUTE_EVENT = /^#event\/([\w-]+)$/;
  const ROUTE_REGISTER = '#register';

  const closeButton = (extraClass = '') => `
    <button class="round-btn ${extraClass}" type="button" data-sheet-close aria-label="Close">${icon('x')}</button>`;

  const setContent = (html, label) => {
    body.innerHTML = html;
    body.scrollTop = 0;
    sheet.setAttribute('aria-label', label);
    Events.tick();
  };

  /* --- Details view --- */

  const renderDetail = (event) => {
    const state = Events.status(event);
    const seats = Events.seatLabel(event);
    const cta = {
      open: 'Register now',
      soldout: 'Sold out',
      ended: 'Event ended',
    }[state];

    setContent(`
      <div class="detail__art">
        ${Poster.svg(event)}
        ${closeButton('detail__close')}
      </div>
      <div class="detail__body">
        <p class="detail__kicker">${esc(event.category)}</p>
        <h2 class="detail__title">${esc(event.name)}</h2>
        <ul class="detail__facts">
          <li>${icon('calendar')}<span><strong>${esc(Events.formatDate(event))}</strong>${esc(Events.formatTime(event))}</span></li>
          <li>${icon('pin')}<span><strong>${esc(event.venue)}</strong>${esc(event.city)}</span></li>
          <li>${icon('users')}<span><strong>Hosted by</strong>${esc(event.host)}</span></li>
          <li>${icon('ticket')}<span><strong>${Events.formatPrice(event)}</strong>${event.price === 0 ? 'No ticket fee' : 'Per person'}</span></li>
        </ul>

        <div class="countdown" data-countdown="${event.slug}" data-style="segments" aria-hidden="true">
          <div><b data-unit="days">00</b><span>Days</span></div>
          <div><b data-unit="hours">00</b><span>Hours</span></div>
          <div><b data-unit="minutes">00</b><span>Mins</span></div>
          <div><b data-unit="seconds">00</b><span>Secs</span></div>
        </div>

        <h3 class="detail__heading">About this event</h3>
        <p class="detail__about">${esc(event.about)}</p>

        <h3 class="detail__heading">What to expect</h3>
        <ul class="detail__highlights">
          ${event.highlights.map((item) => `<li>${icon('check')}<span>${esc(item)}</span></li>`).join('')}
        </ul>

        <h3 class="detail__heading">On the day</h3>
        <ul class="schedule">
          ${event.schedule.map(([time, label]) => `<li><time>${esc(time)}</time><span>${esc(label)}</span></li>`).join('')}
        </ul>
      </div>
      <div class="sheet-bar">
        <div>
          <span class="sheet-bar__price">${Events.formatPrice(event)}</span>
          <span class="sheet-bar__seats${seats.low ? ' seats--low' : ''}">${seats.text}</span>
        </div>
        <button class="btn btn--primary" type="button" data-to-form="${event.slug}"${state === 'open' ? '' : ' disabled'}>${cta}</button>
      </div>
    `, event.name);
  };

  /* --- Form view --- */

  const VALIDATORS = {
    name(value) {
      if (!value) return 'Enter your full name.';
      if (value.length < 2) return 'That name looks too short.';
      if (!/^[\p{L}][\p{L}\p{M}' .-]*$/u.test(value)) return 'Use letters, spaces, hyphens and apostrophes only.';
      return '';
    },
    email(value, values) {
      if (!value) return 'Enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Enter a valid email, like name@example.com.';
      if (values.event && Store.isRegistered(values.event, value)) return 'This email is already registered for this event.';
      return '';
    },
    phone(value) {
      if (!value) return 'Enter your phone number.';
      const compact = value.replace(/[\s()-]/g, '');
      if (!/^\+?\d{10,15}$/.test(compact)) return 'Enter a valid phone number with 10 to 15 digits.';
      return '';
    },
    event(value) {
      if (!value) return 'Choose the event you want to attend.';
      const chosen = Events.find(value);
      if (!chosen || Events.status(chosen) !== 'open') return 'That event is no longer taking registrations.';
      return '';
    },
  };

  const eventOptions = (selectedSlug) => Events.sorted().map((event) => {
    const state = Events.status(event);
    const suffix = state === 'open' ? '' : state === 'soldout' ? ' (sold out)' : ' (ended)';
    const selected = event.slug === selectedSlug ? ' selected' : '';
    const disabled = state === 'open' ? '' : ' disabled';
    return `<option value="${event.slug}"${selected}${disabled}>${esc(event.name)}, ${esc(Events.formatDate(event))}${suffix}</option>`;
  }).join('');

  const field = (name, label, type, autocomplete, placeholder) => `
    <div class="field-group">
      <label for="reg-${name}">${label}</label>
      <input id="reg-${name}" name="${name}" type="${type}" autocomplete="${autocomplete}" placeholder="${placeholder}" aria-describedby="reg-${name}-error">
      <p class="field-error" id="reg-${name}-error"></p>
    </div>`;

  const renderForm = (event) => {
    setContent(`
      <div class="form-view">
        <div class="form-view__nav">
          ${event
            ? `<button class="round-btn" type="button" data-to-detail="${event.slug}" aria-label="Back to event details">${icon('arrow-left')}</button>`
            : '<span></span>'}
          ${closeButton()}
        </div>
        <h2 class="form-view__title">Save your seat.</h2>
        <p class="form-view__sub">It takes under a minute. We'll keep your confirmation in this browser under My registrations.</p>

        <form class="reg-form" id="regForm" novalidate>
          ${field('name', 'Full name', 'text', 'name', 'Your full name')}
          ${field('email', 'Email address', 'email', 'email', 'name@example.com')}
          ${field('phone', 'Phone number', 'tel', 'tel', '+91 98765 43210')}
          <div class="field-group">
            <label for="reg-event">Event</label>
            <select id="reg-event" name="event" aria-describedby="reg-event-error">
              <option value=""${event ? '' : ' selected'}>Choose an event</option>
              ${eventOptions(event && event.slug)}
            </select>
            <p class="field-error" id="reg-event-error"></p>
          </div>
          <button class="btn btn--primary btn--block" type="submit">Confirm registration</button>
          <p class="form-note">This is a demo project, so your details stay in your own browser and no payment is taken.</p>
        </form>
      </div>
    `, 'Register for an event');

    wireForm(document.getElementById('regForm'));
  };

  const readValues = (form) => ({
    name: form.elements.name.value.trim().replace(/\s+/g, ' '),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
    event: form.elements.event.value,
  });

  const showFieldState = (form, name, values) => {
    const message = VALIDATORS[name](values[name], values);
    const input = form.elements[name];
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    document.getElementById(`reg-${name}-error`).textContent = message;
    return message;
  };

  /* Errors appear on blur or submit, then clear live as soon as the value is fixed. */
  const wireForm = (form) => {
    const fields = Object.keys(VALIDATORS);

    fields.forEach((name) => {
      const input = form.elements[name];
      input.addEventListener('blur', () => {
        if (input.value.trim()) showFieldState(form, name, readValues(form));
      });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') showFieldState(form, name, readValues(form));
      });
    });

    form.elements.event.addEventListener('change', () => {
      const values = readValues(form);
      showFieldState(form, 'event', values);
      if (values.email) showFieldState(form, 'email', values);
    });

    form.addEventListener('submit', (submitEvent) => {
      submitEvent.preventDefault();
      const values = readValues(form);
      const invalid = fields.filter((name) => showFieldState(form, name, values));
      if (invalid.length) {
        form.elements[invalid[0]].focus();
        return;
      }
      const entry = Store.addRegistration({
        slug: values.event,
        name: values.name,
        email: values.email,
        phone: values.phone,
      });
      Catalogue.refresh();
      renderTickets();
      renderSuccess(entry);
    });
  };

  /* --- Confirmation view --- */

  const renderSuccess = (entry) => {
    const event = Events.find(entry.slug);
    const firstName = entry.name.split(' ')[0];
    setContent(`
      <div class="success" role="status">
        <div class="success__mark">${icon('check')}</div>
        <h2 tabindex="-1" id="successHeading">You're in, ${esc(firstName)}.</h2>
        <p>Your seat is confirmed. Keep your reference handy for the door, and we've noted ${esc(entry.email)} as your contact.</p>
        <div class="success__ticket">
          <span class="ticket__ref">${esc(entry.ref)}</span>
          <strong>${esc(event.name)}</strong>
          <ul class="meta">
            <li>${icon('calendar')}<span>${esc(Events.formatDate(event))}, ${esc(Events.formatTime(event))}</span></li>
            <li>${icon('pin')}<span>${esc(event.venue)}, ${esc(event.city)}</span></li>
          </ul>
        </div>
        <div class="success__actions">
          <a class="btn btn--primary" href="#my-registrations">View my registrations</a>
          <a class="btn btn--ghost" href="#events">Keep browsing</a>
        </div>
      </div>
    `, 'Registration confirmed');
    document.getElementById('successHeading').focus();
  };

  /* --- Saved registrations --- */

  const renderTickets = () => {
    const tickets = Store.registrations()
      .map((entry) => ({ entry, event: Events.find(entry.slug) }))
      .filter(({ event }) => event);

    if (!tickets.length) {
      ticketList.innerHTML = `
        <div class="ticket-empty">
          <p>You haven't saved a seat yet. Once you register, your tickets will show up here.</p>
          <a class="btn btn--ghost" href="#events">Browse events</a>
        </div>`;
      return;
    }

    ticketList.innerHTML = tickets.map(({ entry, event }) => `
      <article class="ticket">
        <div>
          <span class="ticket__ref">${esc(entry.ref)}</span>
          <h3><a href="#event/${event.slug}">${esc(event.name)}</a></h3>
          <p class="ticket__who">${esc(entry.name)} · ${esc(entry.email)}</p>
          <ul class="meta">
            <li>${icon('calendar')}<span>${esc(Events.formatDate(event))}</span></li>
            <li>${icon('pin')}<span>${esc(event.venue)}, ${esc(event.city)}</span></li>
          </ul>
        </div>
        <div class="ticket__side">
          <span class="ticket__count" data-countdown="${event.slug}" aria-hidden="true">${Events.countdownText(event)}</span>
          <button class="ticket__cancel" type="button" data-cancel="${esc(entry.ref)}">Cancel</button>
        </div>
      </article>
    `).join('');
  };

  /* Cancelling takes two clicks so a stray tap can't lose a ticket. */
  const handleCancel = (button) => {
    if (!button.classList.contains('is-armed')) {
      button.classList.add('is-armed');
      button.textContent = 'Confirm cancel';
      setTimeout(() => {
        if (!button.isConnected) return;
        button.classList.remove('is-armed');
        button.textContent = 'Cancel';
      }, 4000);
      return;
    }
    Store.removeRegistration(button.dataset.cancel);
    Catalogue.refresh();
    renderTickets();
  };

  /* --- Routing: #event/<slug> and #register open the sheet, so both can be linked to --- */

  const route = () => {
    const hash = window.location.hash;
    const match = hash.match(ROUTE_EVENT);
    const event = match && Events.find(match[1]);

    if (event) {
      renderDetail(event);
      Sheets.show(sheet);
    } else if (hash === ROUTE_REGISTER) {
      renderForm(null);
      Sheets.show(sheet);
    } else if (sheet.open) {
      Sheets.hide(sheet);
    }
  };

  const clearRoute = () => {
    const hash = window.location.hash;
    if (ROUTE_EVENT.test(hash) || hash === ROUTE_REGISTER) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const init = () => {
    Sheets.register(sheet);
    sheet.addEventListener('sheetclosed', clearRoute);

    sheet.addEventListener('click', (clickEvent) => {
      const toForm = clickEvent.target.closest('[data-to-form]');
      if (toForm) renderForm(Events.find(toForm.dataset.toForm));
      const toDetail = clickEvent.target.closest('[data-to-detail]');
      if (toDetail) renderDetail(Events.find(toDetail.dataset.toDetail));
    });

    ticketList.addEventListener('click', (clickEvent) => {
      const button = clickEvent.target.closest('[data-cancel]');
      if (button) handleCancel(button);
    });

    window.addEventListener('hashchange', route);
    renderTickets();
  };

  return { init, route };
})();
