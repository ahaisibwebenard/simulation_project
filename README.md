# Lake Bunyonyi Tourist Simulation

An editable VS Code project for Bunyonyi Visitor Lab. It simulates 30 days of visitor interest, day visits, overnight stays, bed shortages, activities and spending.

## Open and run in VS Code

1. Extract the ZIP using **Extract All** in Windows.
2. In VS Code, choose **File → Open Folder**, then select the extracted `lake-bunyonyi-simulation` folder. This is the folder containing `package.json` and `index.html`.
3. Choose **Terminal → New Terminal**.
4. Check that Node.js 20 or newer is available:

   ```powershell
   node --version
   ```

5. Start the project:

   ```powershell
   npm start
   ```

6. Open **http://127.0.0.1:5500** in your browser.

The project uses Node's built-in tools. There are no npm dependencies to install. Serve it through localhost so its JavaScript modules can load. Save your changes in VS Code, then refresh the browser. Press **Ctrl+C** in the terminal to stop the server.

You can also open `Lake-Bunyonyi.code-workspace` directly. To use the supplied debugger, select **Run and Debug → Open Bunyonyi simulation in Chrome**, then press **F5**. That configuration starts the server for you; use it when another copy of the server is not already running.

### If PowerShell blocks npm.ps1

Use the Windows executable directly:

```powershell
npm.cmd start
```

### If port 5500 is already in use

Choose another port:

```powershell
npm start -- --port 5501
```

Then open **http://127.0.0.1:5501**. The supplied F5 browser configuration uses port 5500; update its URL if you change the port.

## Project organization

| Path | Responsibility |
| --- | --- |
| `index.html` | Page structure, input controls, chart containers and visible assumptions. |
| `src/styles/main.css` | Colors, spacing, responsive layouts and accessibility styling. |
| `src/scripts/app.js` | Form handling, scenario presets, validation display, charts, comparisons, daily table and CSV export. |
| `src/scripts/model.js` | Simulation rules, input limits, default values and daily calculations. It runs independently of the interface. |
| `public/icons/icon.svg` | Site icon. The schematic lake illustration is an inline SVG in `index.html`. |
| `scripts/dev-server.mjs` | Local HTTP server, bound to `127.0.0.1`. |
| `scripts/build.mjs` | Copies website files into the generated `dist/` directory. |
| `tests/model.test.js` | Reproducibility, conservation, capacity, stays, spending and invalid-input tests. |
| `tests/server.test.js` | Checks local page loading, asset paths, MIME types and error responses. |
| `docs/MODEL.md` | Equations, assumptions, baseline results and interpretation. |
| `docs/EDITING_GUIDE.md` | Where to make common changes and how to verify them. |
| `.vscode/` | Editor settings, test task and browser/server debug configurations. |
| `Lake-Bunyonyi.code-workspace` | Opens this project as a VS Code workspace. |

## Useful commands

Run these from the project root:

| Command | What it does |
| --- | --- |
| `npm start` | Starts the local server on port 5500. |
| `npm run dev` | Alias for the same local server. |
| `npm test` | Runs the simulation and local-server tests. |
| `npm run check` | Checks JavaScript syntax. |
| `npm run build` | Generates a static copy in `dist/`. |

## Using the simulation

Choose **Low season**, **Normal**, or **Peak demand**. You can then adjust base visitor interest, season, overnight share, length of stay, available beds and spending per person-day. Select **Run scenario** to update the results.

Switch between **Visitors** and **Bed occupancy** to inspect different patterns. Use **Explore a day** for exact daily values. Results compare against a fixed normal-season baseline. The expandable daily table and **Download daily CSV** use the currently displayed scenario. Input edits take effect after a run.

## Model and privacy

All figures are illustrative teaching assumptions. They are not measured Lake Bunyonyi statistics or calibrated forecasts. The page and `docs/MODEL.md` explain the assumptions.

Calculations run in the browser. The local server listens on this computer's loopback address. Scenarios are held in page memory; reloading starts with the baseline. CSV export saves a local file.

The existing hosted copy remains private at:

https://bunyonyi-visitor-lab-benard.divinepig1.chatgpt.site

The hosted copy's sign-in restriction is supplied by its hosting platform. This downloadable project has no authentication backend. Preparing or editing this folder does not change that hosted copy or its access settings. Publishing files from `dist/` to another host requires that host's own private access controls.
