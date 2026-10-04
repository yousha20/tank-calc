# TankCalc

A web-based calculator for designing and estimating costs for industrial food-grade tanks. It calculates wall thickness, weight, price, and manufacturing lead times based on the ГОСТ 14249-89 standard. 

Originally developed as a graduation project (ВКР 2026).

## Features

* **4 Tank Types:** Vertical, horizontal, rectangular, and conical.
* **Custom Specs:** Choose from standard volumes (0.5 to 50 m³) or input custom sizes. Preloaded with standard densities for products like milk, juice, oil, and honey.
* **Materials & Add-ons:** Select steel grades (AISI 304, 316L, Ст3) and toggle options like hatches, mixers, and thermal insulation to see real-time price updates.
* **Local History:** Automatically logs all calculations locally using a WebAssembly SQLite database (`sql.js`). You can export the history as a `.db` file or copy the raw SQL queries.

## Project Structure

* `index.html`: Main interface and inline SVG graphics.
* `style.css`: Responsive layouts and styling.
* `script.js`: Core calculation algorithms and SQLite database handling.

## Usage

Just download the files and open `index.html` in any modern web browser. No backend server is needed. 

*Note: You need an active internet connection the first time you run it so the app can fetch the `sql.js` library. The core calculations will still work offline, but the database logging won't initialize.*
