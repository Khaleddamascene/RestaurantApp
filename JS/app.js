import {
  getRestaurants,
  getDailyMenu,
  getWeeklyMenu,
} from "./api.js";

// DOM
const restaurantList = document.getElementById("restaurantList");
const restaurantTemplate = document.getElementById("restaurantTemplate");

const menuPanel = document.getElementById("menuPanel");
const menuTitle = document.getElementById("menuTitle");
const menuSubtitle = document.getElementById("menuSubtitle");

const cityFilter = document.getElementById("cityFilter");
const providerFilter = document.getElementById("providerFilter");
const menuView = document.getElementById("menuView");

// State
let restaurants = [];
let selectedRestaurant = null;

// 🚀 INIT
init();

async function init() {
  try {
    restaurants = await getRestaurants();

    populateFilters(restaurants);
    renderRestaurants(restaurants);
  } catch (err) {
    restaurantList.innerHTML = "Virhe ladattaessa ravintoloita";
  }
}

// 🔽 FILTERIT

function populateFilters(data) {
  const cities = [...new Set(data.map(r => r.city))];
  const providers = [...new Set(data.map(r => r.company))];

  cities.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    cityFilter.appendChild(opt);
  });

  providers.forEach(provider => {
    const opt = document.createElement("option");
    opt.value = provider;
    opt.textContent = provider;
    providerFilter.appendChild(opt);
  });
}

function applyFilters() {
  let filtered = [...restaurants];

  if (cityFilter.value !== "all") {
    filtered = filtered.filter(r => r.city === cityFilter.value);
  }

  if (providerFilter.value !== "all") {
    filtered = filtered.filter(r => r.company === providerFilter.value);
  }

  renderRestaurants(filtered);
}

// 🔽 RENDER

function renderRestaurants(data) {
  restaurantList.innerHTML = "";

  if (!data.length) {
    restaurantList.innerHTML = "<p>Ei ravintoloita</p>";
    return;
  }

  data.forEach(restaurant => {
    const clone = restaurantTemplate.content.cloneNode(true);

    const card = clone.querySelector(".restaurant-card");
    const name = clone.querySelector(".restaurant-name");
    const meta = clone.querySelector(".restaurant-meta");
    const extra = clone.querySelector(".restaurant-extra");
    const favBtn = clone.querySelector(".favorite-btn");

    name.textContent = restaurant.name;
    meta.textContent = `${restaurant.city} • ${restaurant.company}`;
    extra.textContent = restaurant.address;

    // Klikkaus → menu
    card.addEventListener("click", () => {
      selectedRestaurant = restaurant;
      loadMenu();
      highlightSelected(card);
    });

    // ⭐ suosikki (demo localStorage)
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      localStorage.setItem("favoriteRestaurant", restaurant._id);
      alert("Lisätty suosikiksi!");
    });

    restaurantList.appendChild(clone);
  });
}

// 🔽 MENU

async function loadMenu() {
  if (!selectedRestaurant) return;

  menuTitle.textContent = selectedRestaurant.name;
  menuSubtitle.textContent = selectedRestaurant.city;

  menuPanel.innerHTML = "Ladataan...";

  try {
    let data;

    if (menuView.value === "today") {
      data = await getDailyMenu(selectedRestaurant._id);
      renderDailyMenu(data);
    } else {
      data = await getWeeklyMenu(selectedRestaurant._id);
      renderWeeklyMenu(data);
    }
  } catch (err) {
    menuPanel.innerHTML = "Virhe ladattaessa ruokalistaa";
  }
}

// 🍽️ Päivä
function renderDailyMenu(data) {
  if (!data.courses || data.courses.length === 0) {
    menuPanel.innerHTML = "<p>Ei ruokia saatavilla</p>";
    return;
  }

  menuPanel.innerHTML = data.courses
    .map(
      c => `
      <div class="menu-item">
        <h3>${c.name}</h3>
        <p>${c.price || ""}</p>
        <p class="muted">${c.diets || ""}</p>
      </div>
    `
    )
    .join("");
}

// 📅 Viikko
function renderWeeklyMenu(data) {
  if (!data.days) {
    menuPanel.innerHTML = "<p>Ei ruokalistaa</p>";
    return;
  }

  menuPanel.innerHTML = data.days
    .map(
      day => `
      <div class="menu-day">
        <h3>${day.date}</h3>
        ${
          day.courses
            ?.map(
              c => `
            <div class="menu-item">
              <strong>${c.name}</strong>
              <span>${c.price || ""}</span>
            </div>
          `
            )
            .join("") || "<p>Ei ruokia</p>"
        }
      </div>
    `
    )
    .join("");
}

// 🔽 UI

function highlightSelected(selectedCard) {
  document
    .querySelectorAll(".restaurant-card")
    .forEach(el => el.classList.remove("active"));

  selectedCard.classList.add("active");
}

// 🔽 EVENTIT

cityFilter.addEventListener("change", applyFilters);
providerFilter.addEventListener("change", applyFilters);
menuView.addEventListener("change", loadMenu);