export const state = {
  restaurants: [],
  selectedRestaurant: null,
  menuView: "today",
  favorites: [],
  user: JSON.parse(localStorage.getItem("user")) || null
};


