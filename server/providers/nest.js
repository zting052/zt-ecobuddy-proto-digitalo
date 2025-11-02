import fetch from "node-fetch";

/**
 * Minimal Nest SDM provider for thermostats.
 * Env:
 * - DEVICE_ACCESS_PROJECT_ID (from Device Access console)
 */
const SDM_BASE = "https://smartdevicemanagement.googleapis.com/v1";

export function nestProvider({ projectId = process.env.DEVICE_ACCESS_PROJECT_ID } = {}) {
  if (!projectId) {
    console.warn("[nest] DEVICE_ACCESS_PROJECT_ID missing; Nest calls will fail until it is set.");
  }

  async function sdm(path, accessToken, options = {}) {
    const res = await fetch(`${SDM_BASE}/enterprises/${projectId}${path}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      let msg = `SDM HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error?.message || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  function parseThermostats(list = []) {
    const out = [];
    for (const d of list) {
      const traits = d.traits || {};
      const temp = traits["sdm.devices.traits.Temperature"];
      const setpoint = traits["sdm.devices.traits.ThermostatTemperatureSetpoint"];
      const fan = traits["sdm.devices.traits.Fan"];
      const ambientC = temp?.ambientTemperatureCelsius;
      // Prefer coolCelsius if present, fallback to heatCelsius
      const setpointC = setpoint?.coolCelsius ?? setpoint?.heatCelsius;
      const fanMode = fan?.timerMode || "auto";

      if (d.type?.includes("THERMOSTAT") || (ambientC !== undefined || setpointC !== undefined)) {
        out.push({
          id: d.name,                 // full SDM device resource name
          name: d.parentRelations?.[0]?.displayName || d.assignee || d.name.split("/").pop(),
          ambientC,
          setpointC,
          fanSpeed: fanMode
        });
      }
    }
    return out;
  }

  return {
    async listThermostats(accessToken) {
      const data = await sdm(`/devices`, accessToken);
      const devices = data.devices || [];
      return parseThermostats(devices);
    },

    async setCoolSetpoint({ deviceName, accessToken, coolCelsius }) {
      return sdm(`/devices/${encodeURIComponent(deviceName)}:executeCommand`, accessToken, {
        method: "POST",
        body: JSON.stringify({
          command: "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool",
          params: { coolCelsius }
        })
      });
    },

    // Note: SDM doesn't expose generic "fan speed" the way some systems do.
    // The available Fan command is SetTimer (turn on fan for a duration), which
    // isn’t a persistent speed setting. We NOOP fanSpeed to keep UI happy.
    async maybeSetFan({ /* deviceName, accessToken, fanSpeed */ }) {
      return true; // No-op; SDM fan control is limited
    }
  };
}
