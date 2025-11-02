(function(){
  const statusEl = document.getElementById("auth-status");
  const form = document.getElementById("auth-form");
  const btnLogin = document.getElementById("btn-login");
  const btnSignup = document.getElementById("btn-signup");
  const btnLogout = document.getElementById("btn-logout");
  const fieldUser = document.getElementById("auth-username");
  const fieldPass = document.getElementById("auth-password");
  const loggedInWrap = document.getElementById("auth-loggedin");
  const authName = document.getElementById("auth-name");

  const googleSection = document.getElementById("google-home-section");
  const googleStatus = document.getElementById("google-status");
  const googleLinkControls = document.getElementById("google-link-controls");
  const googleUnlinkControls = document.getElementById("google-unlink-controls");
  const btnGoogleLink = document.getElementById("btn-google-link");
  const btnGoogleUnlink = document.getElementById("btn-google-unlink");
  const googleAccountName = document.getElementById("google-account-name");

  async function refreshAuth() {
    try{
      const me = await API.me();
      if (me && me.authenticated) {
        statusEl.textContent = "Signed in";
        authName.textContent = me.username || "";
        form.style.display = "none";
        loggedInWrap.style.display = "";
        googleSection.style.display = "";
        await refreshGoogle();
      } else {
        statusEl.textContent = "Not signed in";
        form.style.display = "";
        loggedInWrap.style.display = "none";
        googleSection.style.display = "none";
      }
    } catch {
      statusEl.textContent = "Not signed in";
      form.style.display = "";
      loggedInWrap.style.display = "none";
      googleSection.style.display = "none";
    }
  }

  async function refreshGoogle() {
    try {
      const status = await API.googleStatus();
      if (status.linked) {
        googleStatus.textContent = "Linked";
        googleAccountName.textContent = status.accountName || "Google Home";
        googleLinkControls.style.display = "none";
        googleUnlinkControls.style.display = "";
      } else {
        googleStatus.textContent = "Not linked";
        googleLinkControls.style.display = "";
        googleUnlinkControls.style.display = "none";
      }
    } catch {
      googleStatus.textContent = "Error";
      googleLinkControls.style.display = "";
      googleUnlinkControls.style.display = "none";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const u = fieldUser.value.trim();
    const p = fieldPass.value;
    if (!u || !p) return;
    btnLogin.disabled = true;
    btnLogin.textContent = "Logging in…";
    try{
      await API.login(u, p);
      await refreshAuth();
    } catch (e){
      alert(e.message || "Login failed");
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = "Log in";
    }
  });

  btnSignup.addEventListener("click", async () => {
    const u = fieldUser.value.trim();
    const p = fieldPass.value;
    if (!u || !p) return alert("Enter a username and password");
    btnSignup.disabled = true;
    btnSignup.textContent = "Signing up…";
    try{
      await API.signup(u, p);
      await refreshAuth();
    } catch (e){
      alert(e.message || "Sign up failed");
    } finally {
      btnSignup.disabled = false;
      btnSignup.textContent = "Sign up";
    }
  });

  btnLogout.addEventListener("click", async () => {
    try{
      await API.logout();
      await refreshAuth();
    } catch {
      alert("Failed to log out");
    }
  });

  btnGoogleLink.addEventListener("click", async () => {
    btnGoogleLink.disabled = true;
    btnGoogleLink.textContent = "Pairing…";
    try {
      await API.googleMockLink();
      await refreshGoogle();
    } catch (e) {
      alert(e.message || "Failed to pair Google Home");
    } finally {
      btnGoogleLink.disabled = false;
      btnGoogleLink.textContent = "Pair Google Home (dev)";
    }
  });

  btnGoogleUnlink.addEventListener("click", async () => {
    btnGoogleUnlink.disabled = true;
    btnGoogleUnlink.textContent = "Unlinking…";
    try {
      await API.googleUnlink();
      await refreshGoogle();
    } catch (e) {
      alert(e.message || "Failed to unlink Google Home");
    } finally {
      btnGoogleUnlink.disabled = false;
      btnGoogleUnlink.textContent = "Unlink";
    }
  });

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", refreshAuth) : refreshAuth();
})();
