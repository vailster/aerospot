# AeroSpot ✈️

AeroSpot is a premium, responsive Single Page Application (SPA) and Operational Simulator designed for aviation enthusiasts and plane spotters tracking operations at major London airports:
* **London Heathrow (LHR)**
* **London Gatwick (LGW)**
* **London City (LCY)**

The application combines beautiful modern aesthetics, real-time-like simulations, and detailed maps to help spotters find the best locations and anticipate active runways based on current weather conditions.

---

## ✨ Features

### 1. Client-Side SPA Router
* Hash-based routing (`#/`, `#/lhr`, `#/lgw`, `#/lcy`) allows seamless subpage transitions without page reloads.
* Persists the global simulation state (custom wind direction/speed and custom date/time overrides) across all views.

### 2. Interactive Runway & Alternation Simulator
* **Heathrow (LHR):** Fully implements the 15:00 daytime runway alternation schedule (swapping active landing runways) and Westerly/Easterly preference calculations.
* **Gatwick (LGW):** Simulates standard operations on the main runway 08R/26L, with dynamic alerts for emergency standby configurations (08L/26R).
* **London City (LCY):** Displays the steep 5.5° approach requirements and calculates the weekly noise curfew (closure from Saturday 13:00 to Sunday 10:00).

### 3. Smart Date & Time Simulator
* Centralized toggle allows switching between **Live Time** and **Simulated Time**.
* Overriding date/time dynamically recalculates alternation cycles, curfew states, and schedules across all views.

### 4. High-Quality Spotting Guides & Interactive Maps
* **Interactive SVG Vector Maps:** Beautiful custom-drawn maps showing landing approaches and take-off trajectories with pulsating animations.
* **Text Halo Masking:** SVG runway labels feature custom text strokes to prevent crossing flight paths from overlapping text elements.
* **Spotting Location Database:** Catalog of famous spotting points (such as Myrtle Avenue at LHR, Lowfield Heath Road at LGW, and Royal Docks at LCY) featuring detailed access info, transport tips, and photos.
* **Dynamic Active/Inactive Pins:** Map pins dynamically dim or illuminate based on whether the spotting point matches the active runway configurations.

### 5. Advanced Responsive Layouts
* Tablet and mobile optimized grid views stack map panels to the very top, recovering space on smaller viewports.
* Compact sidebar wind simulator collapses to a clean grid layout on mobile screens, and the interactive compass needle blocks page scroll actions during touch-drag interactions.

---

## 🛠️ Technology Stack
* **Markup & UI:** Semantic HTML5, CSS Glassmorphism
* **Icons:** [Lucide Icons](https://lucide.dev/)
* **Logic:** Vanilla JavaScript (ES6+), SVG Manipulation
* **Styling:** Vanilla CSS Custom Properties (Variables) and Responsive CSS Grid/Flexbox layouts.

---

## 🚀 Running Locally

1. Clone or download the repository.
2. Serve the directory using any static web server. For example, using `npx`:
   ```bash
   npx http-server -p 8080 ./
   ```
3. Open `http://127.0.0.1:8080` in your web browser.
