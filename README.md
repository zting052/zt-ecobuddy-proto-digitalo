# EcoBuddy prototype — energy-saving tasks

This adds a tiny backend so the Checkbox tab can act on real (or mock) devices:
- Lights that are ON → “Turn off” task (disappears on success).
- Thermostats above 26°C → “Optimize” task with setpoint slider and fan selection.

## Run the backend (mock devices)

```bash
cd server
npm install
npm run dev
```

Open `checkbox.html` in your browser. It will call `http://localhost:8787` (set by `window.API_BASE_URL`).

## Connect Google (Nest) for thermostats

Google Nest thermostat control uses the Smart Device Management (SDM) API.

Prereqs:
- Enroll in Device Access and create a Device Access Project.
- Create a Google Cloud OAuth 2.0 Web client and enable the SDM API.
- Add the redirect URI: `http://localhost:8787/auth/google/callback`.

Configure `.env` (see `.env.example`) and start the backend. Then:
- Open `settings.html`.
- Click “Sign in with Google”.
- After consent, you’ll see “Connected as …”.
- Open `checkbox.html` to see thermostat tasks (ambient > 26°C).

Note: SDM does not provide generic light control. Use vendor APIs or Home Assistant for lights.

## Lights via Home Assistant (optional, fast real path)

Create a Long‑Lived Access Token in HA and run:

```bash
cd server
npm install
PROVIDER_LIGHTS=homeassistant \
HA_BASE_URL=http://homeassistant.local:8123 \
HA_TOKEN=YOUR_LONG_LIVED_TOKEN \
npm run dev
```

Now ON lights appear as tasks you can turn off.

## Frontend → Backend

The frontend uses `window.API_BASE_URL` (defaults to `http://localhost:8787`). If you deploy the backend elsewhere, set:

```html
<script>window.API_BASE_URL = "https://your-backend.example.com";</script>
```

## Security notes

- OAuth secrets and tokens live only on the backend (session cookie is httpOnly).
- For production, use HTTPS and a persistent session/token store.
- SDM fan control is limited (timer-based), so fan changes are a no-op in this prototype.
