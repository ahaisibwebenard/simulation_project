# Editing guide

## Change the page content

Edit `index.html` for headings, introductory text, input labels, table headings, the lake schematic and the assumptions panel. Keep the IDs used by `app.js` when changing the layout. For example, `scenario-form`, `metrics`, `day-slider` and `daily-table` connect the markup to the interface code.

## Change colors and layout

Edit `src/styles/main.css`. The opening `:root` block contains the main color variables. Desktop styles come first; screen-width media queries near the end adjust tablet and phone layouts. The reduced-motion query follows them.

## Change the model

Edit `src/scripts/model.js`. `BASELINE` holds the default input values, `SEASONS` holds seasonal multipliers, `LIMITS` defines validation ranges, `dailyFactors()` creates the repeatable daily variation, and `simulate()` produces daily rows and totals.

The model is independent of the browser interface and is imported by the tests. If changing a default value or input limit, also update the matching HTML input values and bounds in `index.html`, the on-page assumptions and `docs/MODEL.md`. Update reference-result assertions only after confirming that the new behavior is intended.

## Change charts or interface behavior

Edit `src/scripts/app.js`. `renderMetrics()` builds the result cards; `renderChart()` draws the SVG chart; `updateDay()` controls the selected day's figures; `renderActivities()` displays the activity totals; `renderInsights()` explains the scenario; and `renderTable()` builds the exact daily table. The export handler near the end creates CSV output.

## Check a change

1. Run `npm run check` to check JavaScript syntax.
2. Run `npm test` to verify the model and local server.
3. Start the app with `npm start` and open the localhost URL.
4. Run the normal and peak presets. Peak season should increase demand and, with the default beds, produce rejected overnight requests.
5. Enter an invalid input, such as −1 beds, and run it. The error should be shown while the previous results remain.
6. Try zero visitors and zero beds. These are supported scenarios.
7. Switch charts, inspect a day, expand the results table and export the CSV.
8. Check the page at desktop and phone widths.

Changes to model behavior need model tests. Layout and copy changes normally need a browser check.

## Prepare website files

Run `npm run build` to generate `dist/`. The generated directory contains only `index.html`, `src/` and `public/`. Continue editing the source folders and regenerate `dist/` when needed. This command prepares files locally; it does not publish or change the existing private site.
