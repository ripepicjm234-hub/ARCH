// ── ASTRIEX GLOBAL.JS ──
// Loaded on every page. Applies persistent settings from localStorage.

(function () {
  function load(k, def) {
    try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); }
    catch { return def; }
  }
  function loadSession(k, def) {
    try { const v = sessionStorage.getItem(k); return v === null ? def : JSON.parse(v); }
    catch { return def; }
  }

  function renderGuestProfile(profile) {
    const panel = document.querySelector(".arch-guest-profile");
    if (!panel) return;
    panel.replaceChildren();
    panel.hidden = !profile?.username;
    if (panel.hidden) return;

    const username = document.createElement("span");
    username.className = "arch-profile-name";
    username.textContent = profile.username;
    const status = document.createElement("span");
    status.className = "arch-profile-status";
    status.textContent = `${profile.status || "Guest"} profile · temporary`;
    const stats = document.createElement("span");
    stats.className = "arch-profile-stats";
    stats.textContent = `${profile.gamesPlayed ?? 0} games · ${profile.favorites ?? 0} favorites`;
    panel.append(username, status, stats);
  }

  function mountSidebar() {
    const currentPath = location.pathname;
    const links = [
      { href: "/", label: "Home", icon: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/>' },
      { href: "/g", label: "Games", icon: '<rect x="3" y="7" width="18" height="12" rx="3"/><path d="M7 13h4M9 11v4"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="14" r="1" fill="currentColor" stroke="none"/>' },
      { href: "/m", label: "Media", icon: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>' },
      { href: "/s", label: "Settings", icon: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.1a2 2 0 1 1-4 0V19a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.5l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5v-.1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.5 1 1.7 1.7 0 0 0-.1.9z"/>' }
    ];
    const sidebar = document.createElement("aside");
    sidebar.className = "arch-sidebar";
    sidebar.setAttribute("aria-label", "Main navigation");
    sidebar.innerHTML = '<a class="arch-sidebar-brand" href="/">Arch</a><nav class="arch-sidebar-links"></nav><div class="arch-guest-profile" hidden></div>';
    const nav = sidebar.querySelector(".arch-sidebar-links");

    links.forEach(({ href, label, icon }) => {
      const link = document.createElement("a");
      link.className = "arch-sidebar-link";
      link.href = href;
      link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span>${label}</span>`;
      if (currentPath === href || (href !== "/" && currentPath.startsWith(href))) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
      nav.appendChild(link);
    });

    document.body.classList.add("arch-layout");
    document.body.appendChild(sidebar);
    renderGuestProfile(loadSession("arch_guest_profile", null));
  }

  function mountDisclaimer() {
    if (loadSession("arch_guest_profile", null)?.username) return;

    const overlay = document.createElement("div");
    overlay.className = "arch-disclaimer";
    overlay.innerHTML = `
      <section class="arch-disclaimer-card" role="dialog" aria-modal="true" aria-labelledby="arch-disclaimer-title">
        <p class="arch-disclaimer-brand">Arch</p>
        <h1 class="arch-disclaimer-title" id="arch-disclaimer-title">Before you play</h1>
        <p class="arch-disclaimer-copy">Arch is intended for after-school browser gaming and educational use. Please follow your school's rules. If you choose to use Arch at school and get in trouble, Arch's maintainers are not responsible for disciplinary consequences.</p>
        <p class="arch-disclaimer-note">Accept the notice, then choose a guest username to continue. Your guest profile is temporary and is not saved to an account.</p>
        <div class="arch-guest-signup" hidden>
          <h2 class="arch-guest-signup-title">Sign up as Guest</h2>
          <label class="arch-username-label" for="arch-guest-username">Guest username</label>
          <input class="arch-username-input" id="arch-guest-username" type="text" maxlength="24" autocomplete="off" placeholder="Choose a username" />
          <p class="arch-stats-label">Starter profile stats</p>
          <div class="arch-profile-stats-grid">
            <div><strong>0</strong><span>Games played</span></div>
            <div><strong>0</strong><span>Favorites</span></div>
          </div>
          <p class="arch-disclaimer-note">This profile exists only in this browser tab and resets when the tab session ends. No data is sent to a server.</p>
        </div>
        <p class="arch-disclaimer-error" id="arch-disclaimer-error" role="alert"></p>
        <div class="arch-disclaimer-actions">
          <button type="button" class="arch-disagree">I Disagree</button>
          <button type="button" class="arch-accept">I Accept</button>
          <button type="button" class="arch-start-guest" hidden>Sign Up as Guest</button>
        </div>
      </section>`;

    overlay.querySelector(".arch-accept").addEventListener("click", () => {
      overlay.querySelector(".arch-disclaimer-copy").hidden = true;
      overlay.querySelector(".arch-disclaimer-note").hidden = true;
      overlay.querySelector(".arch-guest-signup").hidden = false;
      overlay.querySelector(".arch-accept").hidden = true;
      overlay.querySelector(".arch-start-guest").hidden = false;
      overlay.querySelector("#arch-guest-username").focus();
    });

    overlay.querySelector(".arch-start-guest").addEventListener("click", () => {
      const usernameInput = overlay.querySelector("#arch-guest-username");
      const username = usernameInput.value.trim();
      const error = overlay.querySelector("#arch-disclaimer-error");
      if (!username) {
        error.textContent = "Enter a username to continue as a guest.";
        usernameInput.focus();
        return;
      }

      const profile = { username, status: "Guest", gamesPlayed: 0, favorites: 0 };
      try {
        sessionStorage.setItem("arch_guest_profile", JSON.stringify(profile));
      } catch {
        error.textContent = "Your browser could not keep a temporary guest profile. Enable session storage and try again.";
        return;
      }
      window.ARCH_GUEST_PROFILE = profile;
      renderGuestProfile(profile);
      document.body.classList.remove("arch-gated");
      overlay.remove();
    });

    overlay.querySelector(".arch-disagree").addEventListener("click", () => {
      document.title = "Arch — Closed";
      document.body.replaceChildren();
      document.body.classList.remove("arch-gated");
    });

    document.body.classList.add("arch-gated");
    document.body.appendChild(overlay);
    overlay.querySelector(".arch-accept").focus();
  }

  mountSidebar();
  mountDisclaimer();

  // ── DEVICE DETECTION: auto-minimal on low-power devices ──
  (function() {
    // Only auto-set if user hasn't manually chosen a background
    if (localStorage.getItem("astriex_background") !== null) return;
    var ua = navigator.userAgent.toLowerCase();
    var isChromebook = ua.includes("cros");
    var isLowEnd = false;
    // Check hardware concurrency (CPU cores) — 4 or fewer = likely low-end
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) isLowEnd = true;
    // Check device memory API if available — under 4GB = low-end
    if (navigator.deviceMemory && navigator.deviceMemory < 4) isLowEnd = true;
    if (isChromebook || isLowEnd) {
      localStorage.setItem("astriex_background", JSON.stringify("minimal"));
    }
  })();

  // ── TAB CLOAK ──
  if (load("astriex_cloak_enabled", false)) {
    const title   = load("astriex_cloak_title", "");
    const _fav = load("astriex_cloak_favicon", "");
    const favicon = _fav === "custom" ? load("astriex_cloak_favicon_custom", "") : _fav;
    if (title) document.title = title;
    if (favicon) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "shortcut icon"; document.head.appendChild(link); }
      link.href = favicon;
    }
  }

  // ── ANTI CLOSE ──
  // Only block unload when navigating away from the site entirely
  if (load("astriex_anti_close", false)) {
    window.addEventListener("beforeunload", e => {
      const el = document.activeElement;
      const dest = (el && el.href) ? el.href : "";
      if (dest && dest.startsWith(location.origin)) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }

  // ── PANIC KEY ──
  // Skip if inside an iframe — the about:blank parent handles panic itself
  document.addEventListener("keydown", e => {
    if (window.self !== window.top) return;
    if (!load("astriex_panic_enabled", false)) return;
    const key = load("astriex_panic_key", "");
    if (!key || e.key !== key) return;
    const url  = load("astriex_panic_url", "https://classroom.google.com");
    const dest = url === "custom" ? load("astriex_panic_custom_url", "https://www.google.com") : url;
    window.location.replace(dest);
  });

  // ── ALWAYS ABOUT:BLANK ──
  if (load("astriex_always_blank", false) && window.self === window.top) {
    const cloakTitle   = load("astriex_cloak_title", "") || "Arch";
    const cloakFavRaw  = load("astriex_cloak_favicon", "");
    const cloakFav     = cloakFavRaw === "custom" ? load("astriex_cloak_favicon_custom", "") : cloakFavRaw;
    const favicon      = cloakFav || (location.origin + "/img/favicon.ico");
    const panicEnabled = load("astriex_panic_enabled", false);
    const panicKey     = load("astriex_panic_key", "");
    const panicUrl     = load("astriex_panic_url", "https://classroom.google.com");
    const panicCustom  = load("astriex_panic_custom_url", "");
    const finalPanic   = panicUrl === "custom" ? panicCustom : panicUrl;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(
        '<!DOCTYPE html><html><head>' +
        '<title>' + cloakTitle + '</title>' +
        '<link rel="icon" href="' + favicon + '">' +
        '</head>' +
        '<body style="margin:0;padding:0;background:#000;overflow:hidden">' +
        '<iframe src="' + location.href + '" ' +
        'style="position:fixed;inset:0;width:100%;height:100%;border:none" allowfullscreen>' +
        '</iframe>' +
        '<script>' +
        'var _pe=' + JSON.stringify(panicEnabled) + ',' +
        '_pk=' + JSON.stringify(panicKey) + ',' +
        '_pu=' + JSON.stringify(finalPanic) + ';' +
        'document.addEventListener("keydown",function(e){' +
        '  if(_pe&&_pk&&e.key===_pk){window.location.replace(_pu);}' +
        '});' +
        '<\/script>' +
        '</body></html>'
      );
      w.document.close();
      window.close();
    }
  }

  // ── EXPOSE GLOBALS ──
  window.ASTRIEX_SEARCH         = load("astriex_search", "https://duckduckgo.com/?q=");
  // Central API — always points to main instance regardless of where the fork is hosted
  window.ASTRIEX_CENTRAL_API = "https://astriex.vercel.app/api/community-games";
  window.ASTRIEX_GAMES_OVERRIDE = load("astriex_games_override", null);

})();
