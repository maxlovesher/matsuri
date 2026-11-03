# Matsuri 祭 — Event Management Website

A responsive event management website for festivals and events across Japan, built with HTML5, CSS3 and JavaScript. Visitors can explore upcoming events, search and filter them, open the full details of any event, and register through a validated form.

The whole site is designed like a Japanese print on washi paper. Behind it runs a real-time 3D scene of hand-embroidered temari balls and glowing paper lanterns. As you scroll, they float in front of a red sun, tumble and bounce off the floor, assemble into a torii gate, and then rush past as you walk through it to reach the event calendar.

- **Live demo:** <https://maxlovesher.github.io/matsuri/>
- **Repository:** <https://github.com/maxlovesher/matsuri>

## Features

### Core

- **Hero section** introducing the platform, with a link to the next upcoming event
- **Featured and upcoming events** shown as cards with the event name, date, venue, image and short description
- **Search** by event name, category, venue or city
- **Category filters** for Festival, Music, Art, Food, Sport and Craft
- **Event details** with the schedule, highlights, host, price and seats left, plus a registration option
- **Registration form** collecting name, email, phone number and selected event
- **JavaScript validation** with a clear message on each field
- **Confirmation message** with a booking reference and a red seal stamped onto the page
- **Responsive layout** for phones, tablets and desktops

### Bonus

- **Day and night modes**, which follow the system setting by default and remember your choice
- **Four seasons**: the site opens in the current season, and you can switch to re-thread the temari and change the petals
- **Countdown timers** on the hero, event cards, event details and saved tickets
- **Animations**, including the scroll-driven 3D scene, reveal effects and smooth scrolling
- **Local Storage registrations**, so tickets are saved between visits and can be cancelled, which also updates the seats left

## Design

| Element | Inspiration |
| --- | --- |
| Colours | Traditional Japanese colours: vermilion (朱), undyed paper (生成り), sumi ink (墨) and navy (紺) |
| Type | Shippori Mincho for headings, Zen Kaku Gothic New for text, and vertical Japanese text as an accent |
| Spheres | Temari, embroidered thread balls, and chōchin, paper lanterns |
| Scroll story | A torii, the gate marking the way into somewhere special |
| Event images | Woodblock prints, with graded skies and a vertical title cartouche |
| Details | Hanko seals, an ensō brush circle loader and seigaiha wave patterns |

## Tech stack

| Technology | Used for |
| --- | --- |
| HTML5 | Page structure, native `<dialog>` for side panels |
| CSS3 | Custom properties for theming, Grid and Flexbox layouts, transitions |
| JavaScript (ES6+) | All interactivity, with no framework or build step |
| [Three.js](https://threejs.org/) r160 | The WebGL scene, loaded from a CDN |
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
    ├── poster.js         Draws each event's woodblock-style print as an SVG
    ├── sheets.js         Opens and closes the side panels
    ├── patterns.js       Draws the temari and lantern textures on canvas
    ├── scene.js          Three.js scene, physics, torii gate and petals
    ├── catalogue.js      Event cards, search and category filters
    ├── registration.js   Event details, form validation, confirmation, saved tickets
    └── app.js            Loader, smooth scroll, theme, seasons, startup
```

## How it works

**Scroll-driven scene.** `app.js` turns the scroll position into a progress value: 0 for the hero, 1 for featured, 2 for categories, 3 for passing through the gate. `scene.js` blends between behaviours using that value. Each sphere has its own velocity, and the simulation handles collisions, a bouncing floor, a pull towards its place in the gate, and repulsion from the cursor. The physics runs at a fixed 60 steps per second, so it behaves the same on a 144Hz monitor.

**Temari and lanterns.** `patterns.js` draws embroidery patterns such as kiku (chrysanthemum) and uroko (scales) onto canvases. A small shader change in `scene.js` uses each pattern as a mask between a ball colour and a thread colour, so the same textures can change colour with the scroll and the season. Temari roll as they move, while lanterns stay upright and glow.

**Torii gate.** The balls are laid out along the beams and pillars of a gate and resized to sit shoulder to shoulder, with one lantern hanging in the opening. As you keep scrolling, the gate moves to the centre and grows, as though you're walking up to it.

**Event images.** Each print in `poster.js` is a hand-composed SVG scene built from a small kit of motifs: graded skies, Mount Fuji, seigaiha waves, lanterns, maple leaves and blossom. The site needs no image files.

**Validation.** Each field has a validator in `registration.js`. Errors appear when you leave a field or submit the form, and clear as soon as the value is fixed. It also blocks registering the same email for the same event twice, and sold-out or finished events can't be selected.

**Links to events.** Event details use URLs such as `#event/momiji-lantern-night`, so any event can be shared directly and the browser's back button closes the panel.

**Fallbacks.** If WebGL or the CDN is unavailable, the site still works without the 3D scene. The scene also lowers its resolution on slow devices, stops drawing the spheres once they've flown past, and respects the reduced motion setting.

## Run locally

No installation is needed. Serve the folder and open it in a browser:

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
