# Paris Olympics 2024 Stats

This tool compares medal counts of multiple countries.

The circle packing chart shows the relative number of athletes in each discipline (e.g. Badminton), event (e.g. Mixed Doubles), and then country. Clicking on a circle causes the timeline to highlight days in cyan in which medals were awarded for that event or discipline.

The world map shows relative medal counts for selected days and selected countries.

The timeline shows the medal tally of the selected countries over the two weeks. Users can select days to compare in the world map. Additionally, with days selected, users may highlight circles in the packing chart for events that took place on the selected days.

## Running

1. In a terminal, `cd` into `garchan`.
2. Install Node packages. This tool uses `topojson-client` in addition to those included in the template.
   ```
   npm install
   ```
3. Start the application:
   ```
   npm run dev
   ```
4. In a web browser, navigate to `localhost:3000`

## Notes

- Athletes participating in multiple events are counted each time in the circle packing chart.
- Tooltip drop shadows leave artifacts in Safari.