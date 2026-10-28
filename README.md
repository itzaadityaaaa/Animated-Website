# AURA — Headphone Product Landing Page

AURA is a concept landing page for a premium headphone brand. It focuses on bold typography, immersive product visuals, animated colour selection, and scroll-driven storytelling.

> **Project type:** Front-end website / product landing page  
> **Status:** Creative concept — update product details and visuals before treating it as a real commercial product page.

## Features

- **Product-focused landing page** with a minimal, editorial layout.
- **Anime-inspired headphone gallery** with three colour themes and floating illustrations.
- **Colour selector** for Midnight Black, Lunar Silver, and Cloud White, with animated colour changes and a glowing transition.
- **Interactive product stage** with pointer-based tilt on supported desktop devices.
- **Scroll-driven chip showcase** using Three.js to animate a custom 3D headphone construction, camera zoom, and a glowing processor-chip visual.
- **Responsive layouts** for desktop, tablet, and mobile.
- **Reduced-motion support** for visitors who prefer less animation.

## Built With

- HTML5
- CSS3, including custom properties, keyframe animations, gradients, and responsive media queries
- Vanilla JavaScript
- [Three.js](https://threejs.org/) for the procedural 3D headphone/chip scene

The colour chooser's headphones are an embedded SVG illustration. The Three.js chip section is a procedural 3D concept model rather than an exact model of a commercially available headphone or its internal electronics.

## Getting Started

### 1. Download or clone the project

Place the website files in one project folder. A suggested structure is:

```text
aura-website/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── aura-chip-3d.js
├── images/
│   └── (optional image assets)
└── README.md
```

Your filenames can differ, as long as the paths in `index.html` match your actual files.

### 2. Link the files in `index.html`

Example links inside the document's `<head>` and just before `</body>`:

```html
<link rel="stylesheet" href="css/style.css">

<!-- Add the site's regular JavaScript, if used. -->
<script src="js/main.js" defer></script>

<!-- Required for the procedural Three.js chip section. -->
<script type="module" src="js/aura-chip-3d.js"></script>
```

Use the correct paths for your own folder structure. If the Three.js code is already inside a module script in `index.html`, do not include it a second time.

### 3. Run through a local server

The Three.js file uses an ES module import from jsDelivr. Run the website through a local development server rather than opening the HTML directly with `file://`.

For example, in Visual Studio Code, open the project folder and use **Live Server**. You can also use another local HTTP server.

An internet connection is needed for the CDN-hosted Three.js module unless you download and configure Three.js locally.

## Animation Notes

### Colour selector

The colour buttons update the selected finish, product labels, and CSS colour variables. The product stage adds a rotation, glow burst, and pointer tilt. The headphone artwork is SVG, so the spin is a stylized 3D-like effect, not a physically accurate 3D model rotation.

### Chip showcase

The Three.js scene builds a conceptual headphone and circuit board from 3D geometry. Scroll progress controls the headphone rotation, camera distance, camera focus, chip emissive glow, and on-screen labels.

If the sticky scroll scene does not behave as expected, check whether a parent element uses `overflow: hidden`, `overflow: auto`, or a CSS `transform`, since these can affect sticky positioning. Also check the browser console for JavaScript or module-loading errors.

## Customization

- **Brand copy:** Edit the headings and text in `index.html`.
- **Colour names:** Update the colour button `data-name` and `data-description` attributes, as well as the relevant CSS palette rules.
- **Colour palette:** Adjust the CSS variables on `.aura-colors` and its `[data-color]` variants.
- **Animation intensity:** Change the CSS keyframe timings and the rotation/zoom ranges in the JavaScript.
- **Chip zoom timing:** Adjust the `smoothStep()` progress ranges in `aura-chip-3d.js`.
- **Typography:** Change the page's font family and sizing rules to match the rest of the website.
- **Accessibility:** Keep meaningful alternative text, visible keyboard focus, and the reduced-motion styles when adding effects.

## Troubleshooting

**The 3D section is blank**
- Make sure `aura-chip-3d.js` is loaded as a module with `type="module"`.
- Run the page through a local server.
- Check that the browser supports WebGL and inspect the console for failed module imports.

**The colour selector does not change the product**
- Confirm the HTML contains `data-color-option`, `data-color-name`, and `data-color-description` as shown in the section markup.
- Check that the colour-selector JavaScript is loaded only once.
- Remove older colour-selector scripts and conflicting CSS that target the same elements.

**The scroll animation is not triggering**
- Confirm the section ID and JavaScript selector match.
- Check for duplicate animation scripts and errors earlier in the console.
- Inspect ancestor elements for overflow or transforms that interfere with `position: sticky`.

**Animations feel too strong**
- Reduce the rotation and scale values in the JavaScript and CSS.
- Test with the operating system's reduced-motion setting enabled.

## Browser Notes

A modern browser with CSS custom-property support is recommended. The Three.js section additionally requires WebGL and support for JavaScript ES modules. Performance may vary by device, especially on phones with limited graphics capability.

## Credits and Assets

- [Three.js](https://threejs.org/) powers the procedural 3D scene.
- Some earlier drafts may use third-party image URLs. Verify usage rights and reliability before publishing; for a production site, prefer assets you own or are licensed to use.

## Disclaimer

AURA is a visual website concept. Unless replaced with verified product information, names, colour options, internal-chip visuals, and any displayed specifications are illustrative and should not be interpreted as factual claims about a real product.
