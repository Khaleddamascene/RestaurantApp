import {
  getCurrentUser,
  getUsers,
  getFavorites,
  saveFavorites,
  login,
  logout
} from "./auth.js";
 
import {
  getRestaurants,
  getDailyMenu
} from "./api.js";
 
 
// =====================
// DOM
// =====================
const dom = {
  notLoggedIn:      document.getElementById("notLoggedIn"),
  favoritesContent: document.getElementById("favoritesContent"),
  favoritesGrid:    document.getElementById("favoritesGrid"),
  favCount:         document.getElementById("favCount"),
 
  userMenu:         document.getElementById("userMenu"),
  userNameDisplay:  document.getElementById("userNameDisplay"),
  profileAvatarBtn: document.getElementById("profileAvatarBtn"),
  userDropdown:     document.getElementById("userDropdown"),
  showLoginBtn:     document.getElementById("showLoginBtn"),
 
  modal:            document.getElementById("authModal"),
  loginForm:        document.getElementById("loginForm"),
  loginMessage:     document.getElementById("loginMessage"),
  closeModalBtn:    document.getElementById("closeAuthModalBtn"),
 
  logoutBtn:        document.getElementById("logoutBtn"),
  goProfileBtn:     document.getElementById("goProfileBtn"),
  goFavoritesBtn:   document.getElementById("goFavoritesBtn"),
};
 
 
// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("auth-changed", onAuthChanged);
 
async function init() {
  updateUserUI();
  await renderPage();
  setupEvents();
}
 
function onAuthChanged() {
  updateUserUI();
  renderPage();
}
 
 
// =====================
// RENDER PAGE
// =====================
async function renderPage() {
  const user = getCurrentUser();
 
  if (!user) {
    dom.notLoggedIn.classList.remove("hidden");
    dom.favoritesContent.classList.add("hidden");
    return;
  }
 
  dom.notLoggedIn.classList.add("hidden");
  dom.favoritesContent.classList.remove("hidden");
 
  // Näytä latausindikaattori
  dom.favoritesGrid.innerHTML = `<p style="color:var(--c-muted);font-size:0.85rem;">Ladataan...</p>`;
 
  try {
    const favIds      = getFavorites(user.id);
    const restaurants = await getRestaurants();
    const favRests    = restaurants.filter(r => favIds.includes(r._id));
 
    updateCount(favRests.length);
    renderCards(favRests, user);
  } catch (err) {
    dom.favoritesGrid.innerHTML = `<p style="color:var(--c-danger);">Virhe ladattaessa ravintoloita.</p>`;
    console.error(err);
  }
}
 
 
// =====================
// COUNT
// =====================
function updateCount(n) {
  if (n === 0)      dom.favCount.textContent = "";
  else if (n === 1) dom.favCount.textContent = "1 ravintola";
  else              dom.favCount.textContent = `${n} ravintolaa`;
}
 
 
// =====================
// RENDER CARDS
// =====================
function renderCards(restaurants, user) {
  dom.favoritesGrid.innerHTML = "";
 
  if (restaurants.length === 0) {
    dom.favoritesGrid.innerHTML = `
      <div class="favorites-empty">
        <span class="favorites-empty__icon">★</span>
        <h3>Ei vielä suosikkeja</h3>
        <p>Lisää suosikkeja pääsivulla painamalla ★-nappia ravintolakortissa.</p>
        <a href="index.html" class="btn btn--primary">← Selaa ravintoloita</a>
      </div>
    `;
    return;
  }
 
  restaurants.forEach((r, i) => {
    const card = buildCard(r, i, user);
    dom.favoritesGrid.appendChild(card);
    loadMenuPreview(r, card);
  });
}
 
 
// =====================
// BUILD CARD
// =====================
function buildCard(r, index, user) {
  const card = document.createElement("div");
  card.className = "fav-card";
  card.style.animationDelay = `${index * 0.07}s`;
 
  card.innerHTML = `
    <div class="fav-card__header">
      <div>
        <p class="fav-card__name">${r.name}</p>
        <p class="fav-card__meta">${r.city} · ${r.company}</p>
        <p class="fav-card__address">${r.address || ""}</p>
      </div>
      <button class="fav-remove-btn" title="Poista suosikeista">★</button>
    </div>
 
    <div class="fav-card__menu">
      <p class="fav-card__menu-title">Tänään</p>
      <p class="fav-card__menu-loading">Ladataan...</p>
    </div>
 
    <div class="fav-card__footer">
      <a href="index.html">🍽 Näytä ruokalista</a>
      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((r.address || "") + " " + r.city)}"
         target="_blank" rel="noopener">🗺 Kartta</a>
    </div>
  `;
 
  card.querySelector(".fav-remove-btn").addEventListener("click", () => {
    removeFromFavorites(r._id, user.id, card);
  });
 
  return card;
}
 
 
// =====================
// REMOVE FAVORITE
// =====================
function removeFromFavorites(restaurantId, userId, card) {
  const favs    = getFavorites(userId);
  const updated = favs.filter(id => id !== restaurantId);
  saveFavorites(userId, updated);
 
  card.style.transition = "opacity 0.25s ease, transform 0.25s ease";
  card.style.opacity    = "0";
  card.style.transform  = "scale(0.95)";
 
  setTimeout(() => renderPage(), 260);
}
 
 
// =====================
// MENU PREVIEW
// =====================
async function loadMenuPreview(r, card) {
  const menuEl = card.querySelector(".fav-card__menu");
 
  try {
    const data    = await getDailyMenu(r._id);
    const courses = data?.courses || [];
 
    if (!courses.length) {
      menuEl.innerHTML = `
        <p class="fav-card__menu-title">Tänään</p>
        <p class="fav-card__menu-loading">Ei ruokia tänään</p>
      `;
      return;
    }
 
    const items = courses.slice(0, 3).map(c => `
      <div class="fav-menu-item">
        <span>${c.name}</span>
        <em>${c.price || ""}</em>
      </div>
    `).join("");
 
    const more = courses.length > 3
      ? `<p class="fav-menu-more">+${courses.length - 3} muuta...</p>`
      : "";
 
    menuEl.innerHTML = `
      <p class="fav-card__menu-title">Tänään</p>
      ${items}
      ${more}
    `;
 
  } catch {
    menuEl.innerHTML = `
      <p class="fav-card__menu-title">Tänään</p>
      <p class="fav-card__menu-loading">Ruokalistaa ei saatavilla</p>
    `;
  }
}
 
 
// =====================
// USER UI
// =====================
function updateUserUI() {
  const user = getCurrentUser();
 
  if (!user) {
    dom.userMenu.classList.add("hidden");
    dom.showLoginBtn.classList.remove("hidden");
    dom.userNameDisplay.textContent = "";
    return;
  }
 
  dom.userMenu.classList.remove("hidden");
  dom.showLoginBtn.classList.add("hidden");
  dom.userNameDisplay.textContent = `Hei, ${user.name || "käyttäjä"}`;
 
  const users    = getUsers();
  const fullUser = users.find(u => u.email === user.email);
 
  dom.profileAvatarBtn.src =
    fullUser?.image ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";
}
 
 
// =====================
// EVENTS
// =====================
function setupEvents() {
 
  dom.profileAvatarBtn.addEventListener("click", e => {
    e.stopPropagation();
    dom.userDropdown.classList.toggle("hidden");
  });
 
  document.addEventListener("click", () => {
    dom.userDropdown.classList.add("hidden");
  });
 
  dom.logoutBtn.addEventListener("click", () => {
    logout();
  });
 
  dom.goProfileBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
 
  dom.goFavoritesBtn?.addEventListener("click", () => {
    window.location.href = "favorites.html";
  });
 
  dom.showLoginBtn.addEventListener("click", () => {
    dom.modal.classList.remove("hidden");
  });
 
  dom.closeModalBtn.addEventListener("click", () => {
    dom.modal.classList.add("hidden");
  });
 
  dom.loginForm.addEventListener("submit", e => {
    e.preventDefault();
    dom.loginMessage.textContent = "";
    dom.loginMessage.classList.remove("error");
 
    try {
      login(
        document.getElementById("loginEmail").value,
        document.getElementById("loginPassword").value
      );
      dom.modal.classList.add("hidden");
    } catch {
      dom.loginMessage.textContent = "Väärä sähköposti tai salasana";
      dom.loginMessage.classList.add("error");
    }
  });
}