Halden Weather (Yr / Met Norway)

This is a minimal static website that fetches current weather for Halden using the Yr/Met Norway LocationForecast API (v2, compact).

Files:
- index.html — page UI
- styles.css — simple styles
- app.js — fetch and DOM logic

How to run locally
1. Open a terminal (PowerShell on Windows) in the project folder (the folder containing index.html).
2. Run a simple static server (Python 3):

```powershell
python -m http.server 8000
```

3. Open http://localhost:8000 in your browser.

Notes and caveats
- The Met Norway API recommends providing a meaningful User-Agent header including contact information when making automated requests. Browsers do not allow setting the User-Agent header from client-side JavaScript. If the API blocks or returns CORS errors, run a tiny server-side proxy that adds a User-Agent header, or call the API from your backend.

- If you need a proxy example (server-side) I can add a small Node/Express or Python Flask example that forwards requests and sets the required header.

Icons and hourly forecast
- The UI now includes a simple hourly forecast row (next 12 forecast points) with small cards showing time, a simple emoji icon (derived from Yr symbol_code), temperature and precipitation (1h) where available.
- The emoji mapping is intentionally simple; if you prefer image icons or a complete mapping of all Yr symbol_code variants I can add SVG/icon assets.

- The app uses the compact endpoint and displays the first relevant timeseries entry. It shows temperature, wind, precipitation (1h), pressure and the symbol_code from the forecast.

Replace contact info / improve UI
- If you plan to deploy an automated client, follow the API policy and set User-Agent properly (e.g. "my-app/1.0 myemail@example.com").

If you want, I can:
- Add a small server-side proxy example that sets User-Agent.
- Show icons instead of symbol_code.
- Add more forecast hours and a chart.

