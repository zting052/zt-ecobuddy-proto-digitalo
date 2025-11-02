// Placeholder sketch (Google Device Access “SDM API” for Nest thermostats)
//
// Requirements:
// - Enroll in Device Access Project (one-time fee).
// - Create a Google Cloud project, OAuth 2.0 Web client, and a Device Access project.
// - Implement OAuth 2.0 on your backend to obtain and store a refresh token.
// - Use SDM API to query and command thermostats.
// Docs: https://developers.google.com/nest/device-access
//
// You’d implement:
// - async getDevices(): read structures/devices and map to { thermostats: [...] }
// - async adjustThermostat(): POST SDM commands like SetCool/SetFanSpeed
//
// Example command payloads (abbreviated):
//
// POST https://smartdevicemanagement.googleapis.com/v1/enterprises/{projectId}/devices/{deviceId}:executeCommand
// Authorization: Bearer <access_token>
// {
//   "command": "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool",
//   "params": { "coolCelsius": 25.0 }
// }
//
// Fan speed (supported devices):
// {
//   "command": "sdm.devices.commands.Fan.SetTimer",
//   "params": { "timerMode": "ON", "duration": "300s" }
// }
// or device-specific fan traits if exposed.
//
// Lights via Google Home generally aren’t exposed by a public REST for 3P apps.
// For lights, integrate vendor APIs (Hue, LIFX, Tuya) or Matter locally.
