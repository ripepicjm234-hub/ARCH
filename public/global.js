// ── ASTRIEX GLOBAL.JS ──
// Loaded on every page. Applies persistent settings from localStorage.

(function () {
  const GUEST_PROFILE_KEY = "arch_guest_profile";
  const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024;

  function load(k, def) {
    try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); }
    catch { return def; }
  }
  function loadSession(k, def) {
    try { const v = sessionStorage.getItem(k); return v === null ? def : JSON.parse(v); }
    catch { return def; }
  }

  function getGuestProfile() {
    const profile = loadSession(GUEST_PROFILE_KEY, null);
    if (!profile?.username) return null;
    return {
      username: String(profile.username),
      status: profile.status || "Guest",
      avatar: typeof profile.avatar === "string" && /^data:image\/(?:png|jpeg|webp);base64,/i.test(profile.avatar)
        ? profile.avatar
        : "",
      playedGames: Array.isArray(profile.playedGames) ? profile.playedGames : [],
      favorites: Array.isArray(profile.favorites) ? profile.favorites : []
    };
  }

  function saveGuestProfile(profile) {
    try {
      sessionStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      return false;
    }
    window.ARCH_GUEST_PROFILE = profile;
    renderGuestProfile(profile);
    return true;
  }

  function readProfileImage(file, onSuccess, onError) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      onError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      onError("Choose an image smaller than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        onError("The selected picture could not be read.");
        return;
      }
      onSuccess(reader.result);
    });
    reader.addEventListener("error", () => onError("The selected picture could not be read."));
    reader.readAsDataURL(file);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function downloadGuestProfile(profile) {
    const playedGames = Array.isArray(profile.playedGames) ? profile.playedGames : [];
    const favorites = Array.isArray(profile.favorites) ? profile.favorites : [];
    const initials = escapeHtml(profile.username.trim().charAt(0).toUpperCase() || "?");
    const avatar = /^data:image\/(?:png|jpeg|webp);base64,/i.test(profile.avatar || "")
      ? `<img src="${escapeHtml(profile.avatar)}" alt="Profile picture">`
      : `<span class="avatar-fallback">${initials}</span>`;
    const gameList = games => games.length
      ? `<ul>${games.map(game => `<li>${escapeHtml(game.title)}</li>`).join("")}</ul>`
      : "<p>None yet.</p>";
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(profile.username)} - Arch Profile</title>
<style>
  *{box-sizing:border-box}body{margin:0;padding:2rem;background:#09090b;color:#f5f5f5;font:16px/1.5 system-ui,sans-serif}
  main{max-width:760px;margin:2rem auto;padding:2rem;border:1px solid #ffffff25;border-radius:24px;background:#ffffff0b}
  header{display:flex;align-items:center;gap:1rem;margin-bottom:2rem}.avatar-fallback,header img{display:grid;width:80px;height:80px;place-items:center;border-radius:50%;background:#27272a;color:#fff;font-size:2rem;object-fit:cover}
  h1{margin:0}header p{margin:.25rem 0;color:#a1a1aa}section{margin-top:1.5rem;padding:1.25rem;border-radius:16px;background:#ffffff08}
  li{margin:.4rem 0}footer{margin-top:1.5rem;color:#a1a1aa;font-size:.8rem}
</style></head><body><main>
<header>${avatar}<div><h1>${escapeHtml(profile.username)}</h1><p>Arch guest profile</p></div></header>
<section><h2>Games played (${playedGames.length})</h2>${gameList(playedGames)}</section>
<section><h2>Favorites (${favorites.length})</h2>${gameList(favorites)}</section>
<footer>This profile report was downloaded from Arch. Your profile remains temporary in the browser tab.</footer>
</main></body></html>`;
    const objectUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const link = document.createElement("a");
    const filename = profile.username.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "guest";
    link.href = objectUrl;
    link.download = `${filename}-arch-profile.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function renderGuestProfile(profile) {
    const panel = document.querySelector(".arch-guest-profile");
    if (!panel) return;
    panel.replaceChildren();
    panel.hidden = !profile?.username;
    if (panel.hidden) return;

    const header = document.createElement("div");
    header.className = "arch-profile-header";
    const avatarButton = document.createElement("button");
    avatarButton.className = "arch-profile-avatar";
    avatarButton.type = "button";
    avatarButton.setAttribute("aria-label", "Change profile picture");
    const avatarFallback = document.createElement("span");
    avatarFallback.className = "arch-profile-avatar-fallback";
    avatarFallback.textContent = profile.username.trim().charAt(0).toUpperCase() || "?";
    avatarButton.appendChild(avatarFallback);
    if (profile.avatar) {
      const avatar = document.createElement("img");
      avatar.className = "arch-profile-avatar-image";
      avatar.src = profile.avatar;
      avatar.alt = "";
      avatarButton.replaceChildren(avatar);
    }
    const photoInput = document.createElement("input");
    photoInput.className = "arch-profile-photo-input";
    photoInput.type = "file";
    photoInput.accept = "image/png,image/jpeg,image/webp";
    photoInput.hidden = true;
    avatarButton.addEventListener("click", () => photoInput.click());
    photoInput.addEventListener("change", () => {
      const error = panel.querySelector(".arch-profile-error");
      readProfileImage(photoInput.files[0], image => {
        if (!saveGuestProfile({ ...profile, avatar: image })) {
          error.textContent = "Could not save this picture in the current tab. Try a smaller image.";
        }
      }, message => { error.textContent = message; });
    });

    const profileInfo = document.createElement("div");
    profileInfo.className = "arch-profile-info";
    const username = document.createElement("span");
    username.className = "arch-profile-name";
    username.textContent = profile.username;
    const status = document.createElement("span");
    status.className = "arch-profile-status";
    status.textContent = `${profile.status || "Guest"} profile · temporary`;
    profileInfo.append(username, status);
    header.append(avatarButton, profileInfo);

    const stats = document.createElement("div");
    stats.className = "arch-profile-stats";
    const details = document.createElement("div");
    details.className = "arch-profile-details";
    details.hidden = true;
    let openStat = "";
    const makeStat = (label, items, key) => {
      const button = document.createElement("button");
      button.className = "arch-profile-stat";
      button.type = "button";
      button.setAttribute("aria-expanded", "false");
      const count = document.createElement("strong");
      count.textContent = String(items.length);
      const name = document.createElement("span");
      name.textContent = label;
      button.append(count, name);
      button.addEventListener("click", () => {
        const opening = openStat !== key;
        openStat = opening ? key : "";
        stats.querySelectorAll(".arch-profile-stat").forEach(stat => {
          stat.setAttribute("aria-expanded", String(stat === button && opening));
        });
        details.replaceChildren();
        details.hidden = !opening;
        details.dataset.type = opening ? key : "";
        button.setAttribute("aria-expanded", String(opening));
        if (!opening) return;
        const list = document.createElement("ul");
        const currentItems = key === "playedGames" ? profile.playedGames : profile.favorites;
        if (currentItems.length) {
          currentItems.forEach(game => {
            const item = document.createElement("li");
            item.textContent = game.title;
            list.appendChild(item);
          });
        } else {
          const item = document.createElement("li");
          item.textContent = key === "playedGames" ? "No games played yet." : "No favorites yet.";
          list.appendChild(item);
        }
        details.appendChild(list);
      });
      stats.appendChild(button);
    };
    makeStat("Games played", profile.playedGames, "playedGames");
    makeStat("Favorites", profile.favorites, "favorites");

    const changePhoto = document.createElement("button");
    changePhoto.className = "arch-profile-action";
    changePhoto.type = "button";
    changePhoto.textContent = "Change PFP";
    changePhoto.addEventListener("click", () => photoInput.click());
    const download = document.createElement("button");
    download.className = "arch-profile-action";
    download.type = "button";
    download.textContent = "Download Profile";
    const error = document.createElement("p");
    error.className = "arch-profile-error";
    error.setAttribute("role", "status");
    download.addEventListener("click", () => {
      try {
        downloadGuestProfile(profile);
      } catch {
        error.textContent = "Could not download the profile. Check your browser's download settings and try again.";
      }
    });
    panel.append(header, photoInput, stats, details, changePhoto, download, error);
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
    sidebar.innerHTML = '<div class="arch-sidebar-header"><a class="arch-sidebar-brand" href="/"><img src="/img/arch-logo.svg" alt=""><span>Arch</span></a><button class="arch-sidebar-toggle" type="button" aria-label="Minimize navigation" aria-controls="arch-sidebar-links" aria-expanded="true" title="Minimize navigation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button></div><nav class="arch-sidebar-links" id="arch-sidebar-links"></nav><div class="arch-guest-profile" hidden></div>';
    const toggle = sidebar.querySelector(".arch-sidebar-toggle");
    toggle.addEventListener("click", () => {
      const collapsed = document.body.classList.toggle("arch-sidebar-collapsed");
      const label = collapsed ? "Expand navigation" : "Minimize navigation";
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.querySelector("svg").style.transform = collapsed ? "rotate(180deg)" : "";
    });
    const nav = sidebar.querySelector(".arch-sidebar-links");

    links.forEach(({ href, label, icon }) => {
      const link = document.createElement("a");
      link.className = "arch-sidebar-link";
      link.href = href;
      link.setAttribute("aria-label", label);
      link.title = label;
      link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span>${label}</span>`;
      if (currentPath === href || (href !== "/" && currentPath.startsWith(href))) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
      nav.appendChild(link);
    });

    document.body.classList.add("arch-layout");
    document.body.appendChild(sidebar);
    renderGuestProfile(getGuestProfile());
  }

  function mountDisclaimer() {
    if (getGuestProfile()) return;

    const overlay = document.createElement("div");
    overlay.className = "arch-disclaimer";
    overlay.innerHTML = `
      <section class="arch-disclaimer-card" role="dialog" aria-modal="true" aria-labelledby="arch-disclaimer-title">
        <p class="arch-disclaimer-brand"><img src="/img/arch-logo.svg" alt=""><span>Arch</span></p>
        <h1 class="arch-disclaimer-title" id="arch-disclaimer-title">Before you play</h1>
        <p class="arch-disclaimer-copy">Arch is intended for after-school browser gaming and educational use. Please follow your school's rules. If you choose to use Arch at school and get in trouble, Arch's maintainers are not responsible for disciplinary consequences.</p>
        <p class="arch-disclaimer-note">Accept the notice, then choose a guest username to continue. Your guest profile is temporary and is not saved to an account.</p>
        <div class="arch-guest-signup" hidden>
          <h2 class="arch-guest-signup-title">Sign up as Guest</h2>
          <label class="arch-username-label" for="arch-guest-username">Guest username</label>
          <input class="arch-username-input" id="arch-guest-username" type="text" maxlength="24" autocomplete="off" placeholder="Choose a username" />
          <label class="arch-username-label" for="arch-signup-pfp">Profile picture (optional)</label>
          <input class="arch-pfp-input" id="arch-signup-pfp" type="file" accept="image/png,image/jpeg,image/webp" />
          <div class="arch-signup-pfp-preview" hidden><img alt="Profile picture preview" /><span></span></div>
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

      const profile = {
        username, status: "Guest", avatar: overlay.dataset.avatar || "",
        playedGames: [], favorites: []
      };
      if (!saveGuestProfile(profile)) {
        error.textContent = "Your browser could not keep a temporary guest profile. Enable session storage and try again.";
        return;
      }
      document.body.classList.remove("arch-gated");
      overlay.remove();
    });

    overlay.querySelector("#arch-signup-pfp").addEventListener("change", event => {
      const error = overlay.querySelector("#arch-disclaimer-error");
      const preview = overlay.querySelector(".arch-signup-pfp-preview");
      const image = preview.querySelector("img");
      readProfileImage(event.target.files[0], data => {
        overlay.dataset.avatar = data;
        image.src = data;
        preview.hidden = false;
        error.textContent = "";
      }, message => { error.textContent = message; });
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
  window.ARCH_GET_GUEST_PROFILE = getGuestProfile;
  window.ARCH_SAVE_GUEST_PROFILE = saveGuestProfile;

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
