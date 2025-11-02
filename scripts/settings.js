(function(){
  const baseURL = (window.API_BASE_URL || "").replace(/\/$/, "");
  const statusEl = document.getElementById("google-status");
  const btnAuth = document.getElementById("google-auth-btn");
  const btnDisconnect = document.getElementById("google-disconnect-btn");

  async function http(path, opts={}){
    const res = await fetch(`${baseURL}${path}`, { credentials: "include", ...opts });
    if(!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
    const ct = res.headers.get("content-type");
    return ct && ct.includes("application/json") ? res.json() : res.text();
  }

  async function load(){
    try{
      const me = await http("/api/me");
      const connected = !!(me && me.google && me.google.connected);
      if(connected){
        statusEl.textContent = `Connected${me.google.email ? ` as ${me.google.email}` : ""}`;
        btnAuth.style.display = "none";
        btnDisconnect.style.display = "";
      }else{
        statusEl.textContent = "Not connected";
        btnAuth.style.display = "";
        btnDisconnect.style.display = "none";
      }
    }catch(e){
      statusEl.textContent = "Not connected";
      btnAuth.style.display = "";
      btnDisconnect.style.display = "none";
    }
  }

  btnAuth.addEventListener("click", async () => {
    const returnTo = location.href;
    location.href = `${baseURL}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  });

  btnDisconnect.addEventListener("click", async () => {
    try{
      await http("/auth/logout", { method: "POST" });
      await load();
    }catch(e){
      alert("Failed to disconnect");
    }
  });

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", load) : load();
})();
