import fetch from "node-fetch";

/**
 * Home Assistant provider (fastest real-world path).
 * Requires:
 * - HA_BASE_URL (e.g., http://homeassistant.local:8123)
 * - HA_TOKEN (Long-Lived Access Token from your HA profile)
 */
export function homeAssistantProvider({ baseUrl, token }) {
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  async function ha(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, { headers, ...options });
    if (!res.ok) {
      let msg = `HA HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  function toNumber(x) { const n = Number(x); return Number.isFinite(n) ? n : undefined; }

  return {
    // Return { lights: [...], thermostats: [...] }
    async getDevices() {
      const states = await ha("/api/states"); // requires token
      const lights = [];
      const thermostats = [];

      for (const s of states) {
        const domain = s.entity_id.split(".")[0];
        if (domain === "light") {
          lights.push({
            id: s.entity_id,
            name: s.attributes.friendly_name || s.entity_id,
            room: s.attributes.room_name || s.attributes.area || "",
            on: s.state === "on",
          });
        } else if (domain === "climate") {
          thermostats.push({
            id: s.entity_id,
            name: s.attributes.friendly_name || s.entity_id,
            ambientC: toNumber(s.attributes.current_temperature),
            setpointC: toNumber(s.attributes.temperature ?? s.attributes.target_temp_low ?? s.attributes.target_temp_high),
            fanSpeed: s.attributes.fan_mode || s.attributes.fan_state || "auto",
          });
        }
      }

      return { lights, thermostats };
    },

    async turnLightOff(id) {
      // POST /api/services/light/turn_off { entity_id }
      await ha("/api/services/light/turn_off", {
        method: "POST",
        body: JSON.stringify({ entity_id: id }),
      });
      return true;
    },

    async adjustThermostat({ id, setpointC, fanSpeed }) {
      // Set temperature if provided
      if (typeof setpointC === "number") {
        await ha("/api/services/climate/set_temperature", {
          method: "POST",
          body: JSON.stringify({ entity_id: id, temperature: setpointC }),
        });
      }
      // Set fan mode if provided (device must support it)
      if (fanSpeed) {
        await ha("/api/services/climate/set_fan_mode", {
          method: "POST",
          body: JSON.stringify({ entity_id: id, fan_mode: fanSpeed }),
        });
      }
      return true;
    },
  };
}
