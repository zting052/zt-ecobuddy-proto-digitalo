import { OAuth2Client } from "google-auth-library";

/**
 * Google OAuth for Nest SDM.
 * Required env:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REDIRECT_URI (e.g., http://localhost:8787/auth/google/callback)
 * - DEVICE_ACCESS_PROJECT_ID (Device Access "project id" for SDM paths)
 */
export function createGoogleAuth({
  clientId = process.env.GOOGLE_CLIENT_ID,
  clientSecret = process.env.GOOGLE_CLIENT_SECRET,
  redirectUri = process.env.GOOGLE_REDIRECT_URI,
} = {}) {
  if (!clientId || !clientSecret || !redirectUri) {
    console.warn("[auth] Missing Google OAuth env; Google pairing will not work.");
  }
  const client = new OAuth2Client({ clientId, clientSecret, redirectUri });

  const scopes = [
    "openid",
    "email",
    "profile",
    // Smart Device Management scope
    "https://www.googleapis.com/auth/sdm.service"
  ];

  function getAuthUrl(state = "") {
    const url = client.generateAuthUrl({
      access_type: "offline",        // get refresh_token
      prompt: "consent",             // force consent to ensure refresh_token on first try
      scope: scopes,
      state
    });
    return url;
  }

  async function handleCallback(code = "") {
    const { tokens } = await client.getToken(code);
    // tokens: { access_token, refresh_token, expiry_date, id_token, ... }
    client.setCredentials(tokens);

    // decode id_token to get email (optional)
    let email = "";
    try {
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
      const payload = ticket.getPayload();
      email = payload?.email || "";
    } catch (_) {}

    return { tokens, email };
  }

  // Create a short-lived access token for API calls from a stored refresh_token
  async function getFreshAccessToken(refresh_token) {
    const c = new OAuth2Client({ clientId, clientSecret, redirectUri });
    c.setCredentials({ refresh_token });
    const { token } = await c.getAccessToken();
    if (!token) throw new Error("Failed to refresh Google access token");
    return token;
  }

  return { getAuthUrl, handleCallback, getFreshAccessToken };
}
