const BASE_URL = "https://media2.edu.metropolia.fi/restaurant/api/v1";

// 🔹 Yleinen fetch wrapper
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API virhe:", error);
    throw error;
  }
}

// 🔹 Hae kaikki ravintolat
export async function getRestaurants() {
  return await fetchData(`${BASE_URL}/restaurants`);
}

// 🔹 Hae ravintola ID:llä
export async function getRestaurantById(id) {
  return await fetchData(`${BASE_URL}/restaurants/${id}`);
}

// 🔹 Päivän ruokalista
export async function getDailyMenu(id, lang = "fi") {
  return await fetchData(
    `${BASE_URL}/restaurants/daily/${id}/${lang}`
  );
}

// 🔹 Viikon ruokalista
export async function getWeeklyMenu(id, lang = "fi") {
  return await fetchData(
    `${BASE_URL}/restaurants/weekly/${id}/${lang}`
  );
}

// 🔐 AUTH (jos käytät backendia)

// 🔹 Kirjautuminen
export async function login(email, password) {
  return await fetchData("YOUR_BACKEND_URL/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

// 🔹 Rekisteröityminen
export async function register(name, email, password) {
  return await fetchData("YOUR_BACKEND_URL/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });
}

// 🔹 Hae käyttäjä (tokenilla)
export async function getUser(token) {
  return await fetchData("YOUR_BACKEND_URL/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// 🔹 Päivitä käyttäjä
export async function updateUser(token, data) {
  return await fetchData("YOUR_BACKEND_URL/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}