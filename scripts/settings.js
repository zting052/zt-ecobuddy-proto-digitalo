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

  async function refresh() {
    try{
      const me = await API.me();
      if (me && me.authenticated) {
        statusEl.textContent = "Signed in";
        authName.textContent = me.username || "";
        form.style.display = "none";
        loggedInWrap.style.display = "";
      } else {
        statusEl.textContent = "Not signed in";
        form.style.display = "";
        loggedInWrap.style.display = "none";
      }
    } catch {
      statusEl.textContent = "Not signed in";
      form.style.display = "";
      loggedInWrap.style.display = "none";
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

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", refresh) : refresh();
})();
