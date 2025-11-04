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
  const googleStatusEl = document.getElementById("google-status");
  const googleUnlinkedWrap = document.getElementById("google-unlinked");
  const googleLinkedWrap = document.getElementById("google-linked");
  const googleAccountEl = document.getElementById("google-account");
  const btnGoogleLink = document.getElementById("btn-google-link");
  const btnGoogleUnlink = document.getElementById("btn-google-unlink");

  async function refreshGoogleStatus() {
    try {
      const status = await API.googleStatus();
      if (status.linked) {
        googleStatusEl.textContent = "Linked";
        googleAccountEl.textContent = status.accountName || "";
        googleUnlinkedWrap.style.display = "none";
        googleLinkedWrap.style.display = "";
      } else {
        googleStatusEl.textContent = "Not linked";
        googleUnlinkedWrap.style.display = "";
        googleLinkedWrap.style.display = "none";
      }
    } catch {
      googleStatusEl.textContent = "Not linked";
      googleUnlinkedWrap.style.display = "";
      googleLinkedWrap.style.display = "none";
    }
  }

  async function refresh() {
    try{
      const me = await API.me();
      if (me && me.authenticated) {
        statusEl.textContent = "Signed in";
        authName.textContent = me.username || "";
        form.style.display = "none";
        loggedInWrap.style.display = "";
        googleSection.style.display = "";
        await refreshGoogleStatus();
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const u = fieldUser.value.trim();
    const p = fieldPass.value;
    if (!u || !p) return;
    btnLogin.disabled = true;
    btnLogin.textContent = "Logging in…";
    try{
      await API.login(u, p);
      await refresh();
      // Trigger progress refresh for Home page
      if (window.EcoProgress?.refresh) {
        window.EcoProgress.refresh().catch(() => {});
      }
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
      await refresh();
      // Trigger progress refresh for Home page
      if (window.EcoProgress?.refresh) {
        window.EcoProgress.refresh().catch(() => {});
      }
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
      await refresh();
    } catch {
      alert("Failed to log out");
    }
  });

  btnGoogleLink.addEventListener("click", async () => {
    btnGoogleLink.disabled = true;
    btnGoogleLink.textContent = "Linking…";
    try {
      await API.googleMockLink();
      await refreshGoogleStatus();
    } catch (e) {
      alert(e.message || "Failed to link Google Home");
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
      await refreshGoogleStatus();
    } catch (e) {
      alert(e.message || "Failed to unlink Google Home");
    } finally {
      btnGoogleUnlink.disabled = false;
      btnGoogleUnlink.textContent = "Unlink";
    }
  });

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", refresh) : refresh();
})();
