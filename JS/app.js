import { state } from "./state.js";

import {
  getRestaurants,
  getDailyMenu,
  getWeeklyMenu
} from "./api.js";

import {
  initMap,
  renderMapRestaurants,
  focusRestaurantOnMap
} from "./map.js";

import {
  login,
  register,
  logout,
  getCurrentUser,
  getUsers,

  getFavorites,      
  saveFavorites  

} from "./auth.js";


// =====================
// HELPERS (FIX IS HERE)
// =====================

function formatDiets(raw) {
  if (!raw) return "";

  let arr = [];

  // string
  if (typeof raw === "string") {
    arr = raw.split(",");
  }

  // array
  else if (Array.isArray(raw)) {
    arr = raw;
  }

  // object fallback
  else if (typeof raw === "object") {
    arr = Object.values(raw);
  }

  return arr
    .map(x => String(x).trim())
    .filter(x => x && x !== "*")
    .map(x => `<span class="tag">${x}</span>`)
    .join(" ");
}

// =====================
// DOM
// =====================
const dom = {
  restaurantList: document.getElementById("restaurantList"),
  restaurantTemplate: document.getElementById("restaurantTemplate"),

  menuPanel: document.getElementById("menuPanel"),
  menuTitle: document.getElementById("menuTitle"),
  menuSubtitle: document.getElementById("menuSubtitle"),

  cityFilter: document.getElementById("cityFilter"),
  providerFilter: document.getElementById("providerFilter"),
  menuView: document.getElementById("menuView"),

  modal: document.getElementById("authModal"),
  userNameDisplay: document.getElementById("userNameDisplay"),

  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  registerPasswordConfirm: document.getElementById("registerPasswordConfirm"),

  showLoginBtn: document.getElementById("showLoginBtn"),
  showRegisterBtn: document.getElementById("showRegisterBtn"),

  userMenu: document.getElementById("userMenu"),
  userDropdown: document.getElementById("userDropdown"),
  profileAvatarBtn: document.getElementById("profileAvatarBtn"),
  goProfileBtn: document.getElementById("goProfileBtn"),
  logoutBtn: document.getElementById("logoutBtn")
};


// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("auth-changed", updateUserUI);

async function init() {
  state.restaurants = await getRestaurants();

  initMap();
  renderMapRestaurants(state.restaurants);

  populateFilters(state.restaurants);
  renderRestaurants(state.restaurants);

  setupAuthUI();
  setupEvents();
  updateUserUI();
}


// =====================
// FILTERS
// =====================
function populateFilters(data) {
  const cities = [...new Set(data.map(r => r.city))];
  const providers = [...new Set(data.map(r => r.company))];

  cities.forEach(c => dom.cityFilter.appendChild(new Option(c, c)));
  providers.forEach(p => dom.providerFilter.appendChild(new Option(p, p)));
}

function applyFilters() {
  let filtered = [...state.restaurants];

  if (dom.cityFilter.value !== "all") {
    filtered = filtered.filter(r => r.city === dom.cityFilter.value);
  }

  if (dom.providerFilter.value !== "all") {
    filtered = filtered.filter(r => r.company === dom.providerFilter.value);
  }

  renderRestaurants(filtered);
}


// =====================
// RESTAURANTS
// =====================
function renderRestaurants(data) {
  dom.restaurantList.innerHTML = "";

  const user = getCurrentUser();
  const favIds = user ? getFavorites(user.id) : [];

  data.forEach(r => {
    const clone = dom.restaurantTemplate.content.cloneNode(true);

    const card = clone.querySelector(".restaurant-card");
    const name = clone.querySelector(".restaurant-name");
    const meta = clone.querySelector(".restaurant-meta");
    const extra = clone.querySelector(".restaurant-extra");

    const favBtn = clone.querySelector(".favorite-btn");

    name.textContent = r.name;
    meta.textContent = `${r.city} • ${r.company}`;
    extra.textContent = r.address || "";

        // Aseta tähti aktiiviseksi jos suosikki
    const isFav = favIds.includes(r._id);
    favBtn.classList.toggle("active", isFav);
    favBtn.title = isFav ? "Poista suosikeista" : "Lisää suosikkeihin";

    favBtn.addEventListener("click", e => {
      e.stopPropagation(); // älä valitse ravintolaa

      const currentUser = getCurrentUser();
      if (!currentUser) {
        dom.modal.classList.remove("hidden"); // pyydä kirjautumaan
        return;
      }

      const favs = getFavorites(currentUser.id);
      const idx  = favs.indexOf(r._id);

      if (idx === -1) {
        favs.push(r._id);
        favBtn.classList.add("active");
        favBtn.title = "Poista suosikeista";
      } else {
        favs.splice(idx, 1);
        favBtn.classList.remove("active");
        favBtn.title = "Lisää suosikkeihin";
      }

      saveFavorites(currentUser.id, favs);
    });

    card.addEventListener("click", () => {
      state.selectedRestaurant = r;
      loadMenu();
      highlight(card);
      focusRestaurantOnMap(r);
    });

    dom.restaurantList.appendChild(clone);
  });
}


// =====================
// MENU
// =====================
async function loadMenu() {
  const r = state.selectedRestaurant;
  if (!r) return;

  dom.menuTitle.textContent = r.name;
  dom.menuSubtitle.textContent = r.city;

  dom.menuPanel.innerHTML = "<p>Ladataan...</p>";

  const data =
    state.menuView === "today"
      ? await getDailyMenu(r._id)
      : await getWeeklyMenu(r._id);

  state.menuView === "today"
    ? renderDaily(data)
    : renderWeekly(data);
}


// =====================
// MENU RENDER (FIXED)
// =====================
function renderDaily(data) {
  dom.menuPanel.innerHTML =
    data?.courses?.length
      ? data.courses.map(c => `
        <div class="menu-item">
          <div class="menu-item__left">
            <h3>${c.name}</h3>
            <div class="menu-item-diets">
              ${formatDiets(c.diets || c.allergens || c.properties)}
            </div>
          </div>
          <div class="menu-item__right">
            <span class="menu-price">${c.price || ""}</span>
          </div>
        </div>
      `).join("")
      : "<p class='menu-empty'>Ei ruokia tänään</p>";
}

function renderWeekly(data) {
  dom.menuPanel.innerHTML =
    data?.days?.length
      ? data.days.map(d => `
        <div class="menu-day">
          <div class="menu-day-header"><h3>${d.date}</h3></div>

          ${d.courses?.map(c => `
            <div class="menu-item">
              <div class="menu-item__left">
                <strong>${c.name}</strong>
                <div class="menu-item-diets">
                  ${formatDiets(c.diets || c.allergens || c.properties)}
                </div>
              </div>
              <div class="menu-item__right">
                <span class="menu-price">${c.price || ""}</span>
              </div>
            </div>
          `).join("") || "<p class='menu-empty'>Ei ruokia</p>"}
        </div>
      `).join("")
      : "<p class='menu-empty'>Ei viikkoruokaa</p>";
}


// =====================
// UI HELPERS
// =====================
function highlight(card) {
  document.querySelectorAll(".restaurant-card")
    .forEach(c => c.classList.remove("active"));

  card.classList.add("active");
}


// =====================
// AUTH UI
// =====================
function setupAuthUI() {

  dom.showLoginBtn.onclick = () =>
    dom.modal.classList.remove("hidden");

  dom.showRegisterBtn.onclick = () =>
    dom.modal.classList.remove("hidden");

  dom.loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const msg = document.getElementById("loginMessage");

    msg.textContent = "";
    msg.classList.remove("error", "success");

    try {
      login(emailInput.value, passwordInput.value);
      dom.modal.classList.add("hidden");
    } catch (err) {
      msg.textContent = "Väärä sähköposti tai salasana";
      msg.classList.add("error");
    }
  });

  dom.registerForm.addEventListener("submit", e => {
    e.preventDefault();

    const pass = document.getElementById("registerPassword").value;
    const confirm = dom.registerPasswordConfirm.value;

    if (pass !== confirm) {
      alert("Salasanat eivät täsmää");
      return;
    }

    register(
      document.getElementById("registerName").value,
      document.getElementById("registerEmail").value,
      pass
    );

    dom.modal.classList.add("hidden");
  });
}


// =====================
// USER SYSTEM
// =====================
function updateUserUI() {
  const user = getCurrentUser();

  if (!user) {
    dom.userMenu.classList.add("hidden");
    dom.showLoginBtn.classList.remove("hidden");
    dom.showRegisterBtn.classList.remove("hidden");
    dom.userNameDisplay.textContent = "";

    renderRestaurants(state.restaurants);

    return;
  }

  dom.userMenu.classList.remove("hidden");
  dom.showLoginBtn.classList.add("hidden");
  dom.showRegisterBtn.classList.add("hidden");

  dom.userNameDisplay.textContent = `Hei, ${user.name || "käyttäjä"}`;

  const users = getUsers();
  const fullUser = users.find(u => u.email === user.email);

  dom.profileAvatarBtn.src =
    fullUser?.image ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";

   renderRestaurants(state.restaurants); // ← lisää tämä — päivittää tähdet kirjautumisen jälkeen
}


// =====================
// EVENTS
// =====================
function setupEvents() {

  dom.cityFilter.addEventListener("change", applyFilters);
  dom.providerFilter.addEventListener("change", applyFilters);

  dom.menuView.addEventListener("change", e => {
    state.menuView = e.target.value;
    loadMenu();
  });

  dom.profileAvatarBtn.addEventListener("click", e => {
    e.stopPropagation();
    dom.userDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    dom.userDropdown.classList.add("hidden");
  });

  dom.goProfileBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  dom.logoutBtn.addEventListener("click", () => {
    logout();
  });

  document.getElementById("closeAuthModalBtn")
    .addEventListener("click", () => {
      dom.modal.classList.add("hidden");
    });
}


dom.goProfileBtn.addEventListener("click", () => {
  window.location.href = "profile.html";
});

// ← lisää tämä
document.getElementById("goFavoritesBtn")?.addEventListener("click", () => {
  window.location.href = "favorites.html";
});