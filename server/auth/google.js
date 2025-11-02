import { OAuth2Client } from "google-auth-library";

/**
 * Google OAuth for Nest SDM.
 * Required env:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REDIRECT_URI (e.g., http://localhost:8787/auth/google/callback)
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
    return client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state
    });
  }

  async function handleCallback(code = "") {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Optional: decode id_token to get email
    let email = "";
    try {
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
      email = ticket.getPayload()?.email || "";
    } catch {}

    return { tokens, email };
  }

  async function getFreshAccessToken(refresh_token) {
    const c = new OAuth2Client({ clientId, clientSecret, redirectUri });
    c.setCredentials({ refresh_token });
    const { token } = await c.getAccessToken();
    if (!token) throw new Error("Failed to refresh Google access token");
    return token;
  }

  return { getAuthUrl, handleCallback, getFreshAccessToken };
}
