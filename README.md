# Gravity — Event Management Website

A responsive event management website built with HTML5, CSS3 and JavaScript. Visitors can explore upcoming events, search and filter them, open the full details of any event, and register through a validated form.

The site is built around a real-time 3D "gravity field" of glossy spheres. As you scroll, the spheres float behind the hero, fall and bounce off the floor, assemble into a heart, then fly past the camera to reveal the full event catalogue.

- **Live demo:** _add your deployed link here_
- **Repository:** _add your GitHub link here_

## Features

### Core

- **Hero section** introducing the platform, with a link to the next upcoming event
- **Featured and upcoming events** shown as cards with the event name, date, venue, image and short description
- **Search** by event name, category, venue or city
- **Category filters** for Music, Technology, Art, Food, Sports and Workshops
- **Event details** with the schedule, highlights, host, price and seats left, plus a registration option
- **Registration form** collecting name, email, phone number and selected event
- **JavaScript validation** with a clear message on each field
- **Confirmation message** with a booking reference after a successful registration
- **Responsive layout** for phones, tablets and desktops

### Bonus

- **Dark and light mode**, which follows the system setting by default and remembers your choice
- **Countdown timers** on the hero, event cards, event details and saved tickets
- **Animations**, including the scroll-driven 3D scene, reveal effects and smooth scrolling
- **Local Storage registrations**, so tickets are saved between visits and can be cancelled, which also updates the seats left

## Tech stack

| Technology | Used for |
| --- | --- |
| HTML5 | Page structure, native `<dialog>` for side panels |
| CSS3 | Custom properties for theming, Grid and Flexbox layouts, transitions |
| JavaScript (ES6+) | All interactivity, with no framework or build step |
| [Three.js](https://threejs.org/) r160 | The WebGL sphere scene, loaded from a CDN |
| Git and GitHub | Version control and project submission |

## Project structure

```
.
├── index.html            Page markup
├── css/
│   └── styles.css        Design tokens, layout, components, breakpoints
└── js/
    ├── store.js          Local Storage: registrations and preferences
    ├── events.js         Event data, date and price formatting, countdowns
    ├── poster.js         Generates each event's image as an SVG
    ├── sheets.js         Opens and closes the side panels
    ├── scene.js          Three.js scene and sphere physics
    ├── catalogue.js      Event cards, search and category filters
    ├── registration.js   Event details, form validation, confirmation, saved tickets
    └── app.js            Loader, smooth scroll, theme, palette, startup
```

## How it works

**Scroll-driven scene.** `app.js` turns the scroll position into a progress value: 0 for the hero, 1 for featured, 2 for categories, 3 for release. `scene.js` blends between behaviours using that value. Each sphere has its own velocity, and the simulation handles collisions, a bouncing floor, a pull towards the heart shape, and repulsion from the cursor. The physics runs at a fixed 60 steps per second, so it behaves the same on a 144Hz monitor.

**Event images.** Each poster is an SVG generated from the event's name. Every category has its own arrangement, such as equaliser bars for Music and a heart for Art, so the site needs no image files.

**Validation.** Each field has a validator in `registration.js`. Errors appear when you leave a field or submit the form, and clear as soon as the value is fixed. It also blocks registering the same email for the same event twice, and sold-out or finished events can't be selected.

**Links to events.** Event details use URLs such as `#event/neon-monsoon-live`, so any event can be shared directly and the browser's back button closes the panel.

**Fallbacks.** If WebGL or the CDN is unavailable, the site still works without the sphere scene. The scene also lowers its resolution on slow devices, stops rendering once it's off-screen, and respects the reduced motion setting.

## Run locally

No installation is needed. Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 5173
```

Then visit <http://localhost:5173>.

## Deployment

The site is static, so it can be deployed as it is.

- **GitHub Pages:** in the repository, go to Settings → Pages, choose **Deploy from a branch**, then select `main` and `/ (root)`.
- **Vercel or Netlify:** import the repository, leave the build command empty, and use the project root as the output directory.

## Notes

The events, venues and hosts are fictional. Registrations are stored only in the visitor's own browser, and no payment is taken.
