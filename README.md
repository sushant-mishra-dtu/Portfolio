# Sushant Mishra — Portfolio ("The Silicon Dossier")

A single-page portfolio for an electrical engineering student building hardware accelerators and edge-AI systems. Designed as a declassified engineering dossier: OLED-black canvas, molten-copper accent, viewport-filling display type, and scroll-driven storytelling that runs from raw silicon to accelerated intelligence.

## 🌐 Live
**[https://sushant-mishra-dtu.github.io/Portfolio/](https://sushant-mishra-dtu.github.io/Portfolio/)**

## ✨ Highlights
- **Boot-sequence preloader** and a mask-reveal hero with an animated `57.17µs` inference-latency counter.
- **Subject Profile** with a mono spec sheet, a **live GitHub signal** (repos, followers, stars, last push, top languages via the public API), and a commendations record.
- **Pinned word-by-word manifesto**, a **twelve-card project cascade** across four counter-drifting rows, and an SVG line-draw **timeline**.
- Projects with no photograph get a **hand-drawn inline SVG schematic** of their actual architecture (VRF bank placement, InEKF navigation pipeline, LSTM-autoencoder telemetry pipeline, evidence fusion, audio mux, ML pipeline, gated roadmap, upstream PR ledger, dual-microservice topology) rather than a stock placeholder.
- Corner **status flags** on cards that need them: build state (`PLANNING PHASE`) and live deployments (`LIVE`).
- **Live IST clock** (`GHAZIABAD, IN`) and an oscilloscope waveform as ambient live data.
- **Floating pill nav** with a fullscreen menu overlay (hamburger morphs to X).
- **Web3Forms** contact pipeline with client-side validation, disposable-email + Cloudflare MX checks, a submission cooldown, and hCaptcha.
- Full **`prefers-reduced-motion`** support, semantic landmarks, skip-link, visible focus states, and descriptive alt text.

## 🛠️ Stack
- **Structure:** Semantic HTML5
- **Styling:** Vanilla CSS (custom properties, Grid/Flexbox) — no build step
- **Interactivity:** Vanilla JavaScript
- **Animation:** [GSAP 3.12 + ScrollTrigger](https://gsap.com/) (via cdnjs)
- **Type:** Anton (display), Geist (body), Geist Mono (annotations)
- **Form:** [Web3Forms](https://web3forms.com/) + hCaptcha

## 📁 Structure
- `index.html` — page structure and content
- `sushant-portfolio.css` — all styling (design tokens, layout, motion states, grain overlay)
- `sushant-portfolio.js` — preloader, nav, GSAP choreography, live clock, GitHub signal, contact pipeline
- `404.html` — branded not-found page
- `robots.txt`, `sitemap.xml` — SEO
- Image assets + `CV_Sushant.pdf`
- `main.tex` — LaTeX source for the resume

---
*Designed and built by Sushant Mishra.*
