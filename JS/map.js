// map.js

let map;
let markersLayer;

// 🚀 INIT KARTTA
export function initMap() {
  map = L.map("mapPanel").setView([60.1699, 24.9384], 12); // Helsinki default

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  // 📍 käyttäjän sijainti (bonus)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup("📍 Sinä olet täällä")
        .openPopup();

      map.setView([lat, lng], 13);
    });
  }
}

// 📌 LISÄÄ RAVINTOLAT KARTALLE
export function renderMapRestaurants(restaurants) {
  if (!map) return;

  markersLayer.clearLayers();

  restaurants.forEach(r => {
    if (!r.location || !r.location.coordinates) return;

    const [lng, lat] = r.location.coordinates;

    const marker = L.marker([lat, lng]);

    marker.bindPopup(`
      <b>${r.name}</b><br>
      ${r.address}<br>
      ${r.city}
    `);

    marker.addTo(markersLayer);

    // 🔥 Klikki markerista → triggeröi UI (optional)
    marker.on("click", () => {
      document.dispatchEvent(
        new CustomEvent("restaurantSelectedFromMap", {
          detail: r
        })
      );
    });
  });
}

// 🎯 FOKUSOI VALITTU RAVINTOLA
export function focusRestaurantOnMap(restaurant) {
  if (!map || !restaurant?.location?.coordinates) return;

  const [lng, lat] = restaurant.location.coordinates;

  map.setView([lat, lng], 15);
}