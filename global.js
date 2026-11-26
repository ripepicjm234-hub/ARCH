// ── ASTRIEX GLOBAL.JS ──
// Loaded on every page. Applies persistent settings from localStorage.

(function () {
  const GUEST_PROFILE_KEY = "arch_guest_profile";
  const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024;
  const SITE_TOUR_KEY = "arch_site_tour_step";
  const SITE_TOUR_STEPS = [
    { path: "index.html", section: "Navigation", selector: ".arch-sidebar-links", title: "Move around Arch", text: "Use these links to switch between Home, Games, Media, and Settings." },
    { path: "index.html", section: "Navigation", selector: ".arch-sidebar-toggle", title: "Make room", text: "Collapse the sidebar to icons when you want more room. Select the arrow again to expand it." },
    { path: "index.html", section: "Your profile", selector: ".arch-guest-profile", title: "Your guest profile", text: "Your profile shows games played and favorites saved on this device." },
    { path: "index.html", section: "Home", selector: ".wordmark", title: "Welcome to Arch", text: "This is the home page. Use the navigation to get to the game and media libraries or adjust settings." },
    { path: "index.html", section: "Home", selector: ".search-wrap", title: "Search or open a site", text: "Enter a web address or a search query here, then press Go or Enter." },
    { path: "games.html", section: "Games", selector: ".controls", title: "Find a game", text: "Search by game title or use Favorites to filter the library to games you have saved." },
    { path: "games.html", section: "Games", selector: ".games-grid", title: "Game library", text: "Choose a game card to play it. Use the star on a card to add or remove it from favorites." },
    { path: "games.html", section: "Games", selector: ".best-games", title: "Recommendations", text: "Browse a rotating selection of recommended games. Shuffle to get a different mix." },
    { path: "media.html", section: "Media", selector: ".controls", title: "Browse media", text: "Search for a title and switch between Movies, TV Shows, and Trending." },
    { path: "media.html", section: "Media", selector: ".movies-grid", title: "Media library", text: "Select a movie or show to view available playback options." },
    { path: "settings.html", section: "Settings", selector: "#search-engine", title: "Search engine", text: "Choose which search provider Arch uses when you enter a search query instead of a web address." },
    { path: "settings.html", section: "Settings", selector: "#cloak-enabled", title: "Tab appearance", text: "Tab Cloaking lets you change the browser tab title and icon." },
    { path: "settings.html", section: "Settings", selector: "#bg-style", title: "Background", text: "Choose the animated background style, or use the minimal option to turn it off." },
    { path: "settings.html", section: "Settings", selector: "#panic-enabled", title: "Panic key", text: "If enabled, a chosen key quickly redirects the page to the address you set below." },
    { path: "settings.html", section: "Settings", selector: "#anti-close", title: "Close protection", text: "This option asks for confirmation before leaving the site or closing its tab." },
    { path: "settings.html", section: "Settings", selector: "#always-blank", title: "Stealth launch", text: "These options open the site in an about:blank tab. Use them only if you understand how they affect navigation." },
    { path: "settings.html", section: "Settings", selector: "#sw-status", title: "About Arch", text: "The About section shows technical information about the site, including its service worker status." }
  ];
  let activeTourTarget = null;
  let tourResizeHandler = null;
  let tourKeydownHandler = null;

  function load(k, def) {
    try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); }
    catch { return def; }
  }
  const backgroundStyle = load("astriex_background", "clouds");
  document.body.dataset.bgStyle = ["clouds", "clouds_slow", "minimal"].includes(backgroundStyle)
    ? backgroundStyle
    : "clouds";

  function getGuestProfile() {
    let profile = load(GUEST_PROFILE_KEY, null);
    if (!profile) {
      try {
        const sessionProfile = sessionStorage.getItem(GUEST_PROFILE_KEY);
        if (sessionProfile) {
          profile = JSON.parse(sessionProfile);
          localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
          sessionStorage.removeItem(GUEST_PROFILE_KEY);
        }
      } catch {}
    }
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
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
      sessionStorage.removeItem(GUEST_PROFILE_KEY);
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

  function renderGuestProfile(profile) {
    const panel = document.querySelector(".arch-guest-profile");
    if (!panel) return;
    panel.replaceChildren();
    panel.hidden = !profile?.username;
    if (panel.hidden) return;

    const header = document.createElement("div");
    header.className = "arch-profile-header";
    const avatarButton = document.createElement("div");
    avatarButton.className = "arch-profile-avatar";
    avatarButton.setAttribute("aria-hidden", "true");
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
    const profileInfo = document.createElement("div");
    profileInfo.className = "arch-profile-info";
    const username = document.createElement("span");
    username.className = "arch-profile-name";
    username.textContent = profile.username;
    const status = document.createElement("span");
    status.className = "arch-profile-status";
    status.textContent = `${profile.status || "Guest"} profile · saved on this device`;
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

    const error = document.createElement("p");
    error.className = "arch-profile-error";
    error.setAttribute("role", "status");
    panel.append(header, stats, details, error);
  }

  function clearSiteTour() {
    if (tourResizeHandler) {
      window.removeEventListener("resize", tourResizeHandler);
      window.removeEventListener("scroll", tourResizeHandler);
    }
    if (tourKeydownHandler) document.removeEventListener("keydown", tourKeydownHandler);
    tourResizeHandler = null;
    tourKeydownHandler = null;
    activeTourTarget?.classList.remove("arch-tour-target");
    activeTourTarget = null;
    document.querySelector(".arch-tour-layer")?.remove();
    document.body.classList.remove("arch-tour-active");
  }

  function positionSiteTour(target, layer) {
    if (!target.isConnected) return;
    const rect = target.getBoundingClientRect();
    const padding = 8;
    const left = Math.max(0, rect.left - padding);
    const top = Math.max(0, rect.top - padding);
    const right = Math.min(window.innerWidth, rect.right + padding);
    const bottom = Math.min(window.innerHeight, rect.bottom + padding);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    const panels = layer.querySelectorAll(".arch-tour-shade");
    const sizes = [
      [0, 0, window.innerWidth, top],
      [0, bottom, window.innerWidth, Math.max(0, window.innerHeight - bottom)],
      [0, top, left, height],
      [right, top, Math.max(0, window.innerWidth - right), height]
    ];
    panels.forEach((panel, index) => {
      const [x, y, panelWidth, panelHeight] = sizes[index];
      Object.assign(panel.style, {
        left: `${x}px`, top: `${y}px`, width: `${panelWidth}px`, height: `${panelHeight}px`
      });
    });
  }

  function showSiteTour(stepIndex) {
    const step = SITE_TOUR_STEPS[stepIndex];
    if (!step) {
      clearSiteTour();
      sessionStorage.removeItem(SITE_TOUR_KEY);
      return;
    }
    const currentPage = window.location.pathname.endsWith("/")
      ? "index.html"
      : window.location.pathname.split("/").pop();
    if (currentPage !== step.path) {
      sessionStorage.setItem(SITE_TOUR_KEY, String(stepIndex));
      window.location.assign(step.path);
      return;
    }

    if (step.selector.startsWith(".arch-sidebar") || step.selector === ".arch-guest-profile") {
      document.body.classList.remove("arch-sidebar-collapsed");
      const sidebarToggle = document.querySelector(".arch-sidebar-toggle");
      sidebarToggle?.setAttribute("aria-expanded", "true");
      sidebarToggle?.setAttribute("aria-label", "Minimize navigation");
      sidebarToggle?.setAttribute("title", "Minimize navigation");
      if (sidebarToggle) sidebarToggle.querySelector("svg").style.transform = "";
    }

    clearSiteTour();
    let attempts = 0;
    let stepText = step.text;
    const findTarget = () => {
      let target = document.querySelector(step.selector);
      const targetVisible = target && !target.hidden && getComputedStyle(target).display !== "none" && target.getClientRects().length;
      const waitingForCards = targetVisible &&
        [".games-grid", ".movies-grid"].includes(step.selector) &&
        !target.children.length;
      if (!targetVisible || waitingForCards) {
        if (++attempts < (waitingForCards ? 20 : 80)) {
          window.setTimeout(findTarget, 100);
          return;
        }
        if (waitingForCards) {
          target = document.querySelector(".page-header");
          stepText = "The library is still loading. Once its cards appear below, select one to open a game or media title.";
        } else {
          clearSiteTour();
          sessionStorage.removeItem(SITE_TOUR_KEY);
          window.alert(`The tour could not find "${step.title}" on this page. Please try starting the tour again.`);
          return;
        }
      }

      if (!target) return;
      activeTourTarget = target;
      target.classList.add("arch-tour-target");
      if (getComputedStyle(target).position !== "fixed") {
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }

      const layer = document.createElement("div");
      layer.className = "arch-tour-layer";
      layer.innerHTML = `
        <div class="arch-tour-shade" aria-hidden="true"></div>
        <div class="arch-tour-shade" aria-hidden="true"></div>
        <div class="arch-tour-shade" aria-hidden="true"></div>
        <div class="arch-tour-shade" aria-hidden="true"></div>
        <section class="arch-tour-card" role="dialog" aria-modal="true" aria-labelledby="arch-tour-title" aria-describedby="arch-tour-text">
          <p class="arch-tour-count"></p>
          <h2 id="arch-tour-title"></h2>
          <p class="arch-tour-text" id="arch-tour-text"></p>
          <div class="arch-tour-actions">
            <button type="button" class="arch-tour-skip">End tour</button>
            <div class="arch-tour-step-actions">
              <button type="button" class="arch-tour-back">Back</button>
              <button type="button" class="arch-tour-next">Next</button>
            </div>
          </div>
        </section>`;
      const count = layer.querySelector(".arch-tour-count");
      count.textContent = `Step ${stepIndex + 1} of ${SITE_TOUR_STEPS.length} · ${step.section}`;
      layer.querySelector("#arch-tour-title").textContent = step.title;
      layer.querySelector("#arch-tour-text").textContent = stepText;
      const back = layer.querySelector(".arch-tour-back");
      const next = layer.querySelector(".arch-tour-next");
      back.disabled = stepIndex === 0;
      next.textContent = stepIndex === SITE_TOUR_STEPS.length - 1 ? "Finish" : "Next";
      back.addEventListener("click", () => showSiteTour(stepIndex - 1));
      next.addEventListener("click", () => showSiteTour(stepIndex + 1));
      layer.querySelector(".arch-tour-skip").addEventListener("click", () => {
        clearSiteTour();
        sessionStorage.removeItem(SITE_TOUR_KEY);
      });
      tourKeydownHandler = event => {
        if (event.key === "Escape") {
          clearSiteTour();
          sessionStorage.removeItem(SITE_TOUR_KEY);
          return;
        }
        if (event.key !== "Tab") return;
        const focusable = [...layer.querySelectorAll("button:not(:disabled)")];
        const currentIndex = focusable.indexOf(document.activeElement);
        const nextIndex = event.shiftKey
          ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1)
          : (currentIndex === focusable.length - 1 ? 0 : currentIndex + 1);
        event.preventDefault();
        focusable[nextIndex].focus();
      };
      document.addEventListener("keydown", tourKeydownHandler);
      document.body.appendChild(layer);
      document.body.classList.add("arch-tour-active");
      window.setTimeout(() => positionSiteTour(target, layer), 250);
      tourResizeHandler = () => positionSiteTour(target, layer);
      window.addEventListener("resize", tourResizeHandler);
      window.addEventListener("scroll", tourResizeHandler, { passive: true });
      layer.querySelector(".arch-tour-next").focus();
    };
    findTarget();
  }

  function startSiteTour() {
    sessionStorage.setItem(SITE_TOUR_KEY, "0");
    showSiteTour(0);
  }

  function resumeSiteTour() {
    const step = sessionStorage.getItem(SITE_TOUR_KEY);
    if (step === null) return;
    const stepIndex = Number(step);
    if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= SITE_TOUR_STEPS.length) {
      sessionStorage.removeItem(SITE_TOUR_KEY);
      return;
    }
    showSiteTour(stepIndex);
  }

  function mountSidebar() {
    const currentPath = location.pathname;
    const links = [
      { href: "index.html", label: "Home", icon: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/>' },
      { href: "games.html", label: "Games", icon: '<rect x="3" y="7" width="18" height="12" rx="3"/><path d="M7 13h4M9 11v4"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="14" r="1" fill="currentColor" stroke="none"/>' },
      { href: "media.html", label: "Media", icon: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>' },
      { href: "settings.html", label: "Settings", icon: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.1a2 2 0 1 1-4 0V19a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.5l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5v-.1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.5 1 1.7 1.7 0 0 0-.1.9z"/>' }
    ];
    const sidebar = document.createElement("aside");
    sidebar.className = "arch-sidebar";
    sidebar.setAttribute("aria-label", "Main navigation");
    sidebar.innerHTML = '<div class="arch-sidebar-header"><a class="arch-sidebar-brand" href="index.html">Arch</a><button class="arch-sidebar-toggle" type="button" aria-label="Minimize navigation" aria-controls="arch-sidebar-links" aria-expanded="true" title="Minimize navigation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button></div><nav class="arch-sidebar-links" id="arch-sidebar-links"></nav><button class="arch-sidebar-tour" type="button" aria-label="Take a tour" title="Take a tour"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.6M12 17h.01"/></svg><span>Take a tour</span></button><div class="arch-guest-profile" hidden></div>';
    const toggle = sidebar.querySelector(".arch-sidebar-toggle");
    toggle.addEventListener("click", () => {
      const collapsed = document.body.classList.toggle("arch-sidebar-collapsed");
      const label = collapsed ? "Expand navigation" : "Minimize navigation";
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.querySelector("svg").style.transform = collapsed ? "rotate(180deg)" : "";
    });
    sidebar.querySelector(".arch-sidebar-tour").addEventListener("click", startSiteTour);
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
        <p class="arch-disclaimer-brand">Arch</p>
        <h1 class="arch-disclaimer-title" id="arch-disclaimer-title">Before you play</h1>
        <p class="arch-disclaimer-copy">Arch is intended for after-school browser gaming and educational use. Please follow your school's rules. If you choose to use Arch at school and get in trouble, Arch's maintainers are not responsible for disciplinary consequences.</p>
        <p class="arch-disclaimer-note">Accept the notice, then choose a guest username to continue. Your guest profile is saved on this device.</p>
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
          <p class="arch-disclaimer-note">This profile, favorites, played games, and profile picture are saved locally in this browser.</p>
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
        error.textContent = "Your browser could not save this guest profile. Enable local storage and try again.";
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

  const loader = document.createElement("div");
  loader.className = "arch-loader";
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-label", "Loading Arch");
  loader.innerHTML = '<div class="arch-loader-inner"><span class="arch-loader-brand">Arch</span><div class="arch-loader-track"></div></div>';
  document.body.appendChild(loader);
  const jokeElement = document.createElement("p");
  jokeElement.className = "arch-loader-joke";
  loader.querySelector(".arch-loader-inner").appendChild(jokeElement);
  const jokeSubjects = ["My Wi-Fi", "A tab", "My keyboard", "A bookmark", "The loading bar", "My charger", "A cookie", "The server", "My mouse", "A pixel", "The cache", "A gamepad", "My headset", "The router", "A search bar", "The home button", "A notification", "The settings page", "My password", "A URL", "The cursor", "A popup", "The service worker", "My laptop", "The fullscreen button"];
  const jokeActions = ["went outside", "joined a support group", "opened a separate timeline", "asked for a software update", "became a feature request", "started a second career", "found a lower ping", "got stuck in 4K", "called it a day", "refused to buffer", "broke the fourth wall", "logged out emotionally", "took the scenic route", "went to airplane mode", "disconnected on purpose", "updated its own resume", "forgot the password", "pressed F11", "spawned with lag", "became a lore character"];
  const jokePunchlines = ["It needed some space.", "Now it has fewer crashes.", "The reception was mixed.", "It was a fatal lack of context.", "That is peak hardware humor.", "Nobody asked for that DLC.", "It took a turn for the buffering.", "The bug report filed itself.", "It found more cache than closure.", "That should fix the plot hole."];
  const LOADING_JOKES = jokeSubjects.flatMap(subject => jokeActions.flatMap(action => jokePunchlines.map(punchline => `${subject} ${action}. ${punchline}`)));
  const showRandomJoke = () => {
    jokeElement.textContent = LOADING_JOKES[Math.floor(Math.random() * LOADING_JOKES.length)];
  };
  showRandomJoke();
  const dismissLoader = () => {
    loader.classList.add("done");
  };
  window.setTimeout(dismissLoader, 5000);

  mountSidebar();
  mountDisclaimer();
  resumeSiteTour();
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
    const favicon      = cloakFav || (new URL("img/favicon.ico", document.baseURI).href);
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
