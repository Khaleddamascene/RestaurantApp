// auth.js 

const USERS_KEY = "users";
const CURRENT_KEY = "currentUser";

// =====================
// STORAGE
// =====================
export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_KEY));
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));

  
  window.dispatchEvent(new Event("auth-changed"));
}

export function logout() {
  localStorage.removeItem(CURRENT_KEY);

 
  window.dispatchEvent(new Event("auth-changed"));
}

// =====================
// LOGIN
// =====================
export function login(email, password) {
  const users = getUsers();

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) throw new Error("Invalid login");

  const sessionUser = {
    id: user.id || crypto.randomUUID(),
    name: user.name,
    email: user.email,
    image: user.image || ""
  };

  setCurrentUser(sessionUser);

  return sessionUser;
}

// =====================
// REGISTER
// =====================
export function register(name, email, password) {
  const users = getUsers();

  if (users.some(u => u.email === email)) {
    throw new Error("Email already exists");
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    image: ""
  };

  users.push(newUser);
  saveUsers(users);

  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    image: ""
  };

  setCurrentUser(sessionUser);

  return newUser;
}

// =====================
// UPDATE PROFILE
// =====================
export function updateUser(updated) {
  const users = getUsers();

  const idx = users.findIndex(u => u.email === updated.email);
  if (idx === -1) return;

  users[idx] = {
    ...users[idx],
    ...updated
  };

  saveUsers(users);

  setCurrentUser({
    id: users[idx].id,
    name: users[idx].name,
    email: users[idx].email,
    image: users[idx].image || ""
  });
}



export function changePassword(email, currentPassword, newPassword) {
  const users = getUsers();

  const user = users.find(u => u.email === email);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.password !== currentPassword) {
    throw new Error("Wrong current password");
  }

  user.password = newPassword;

  saveUsers(users);

  return true;
}


// =====================
// FAVORITES
// =====================
export function getFavorites(userId) {
  return JSON.parse(localStorage.getItem(`favorites_${userId}`) || "[]");
}

export function saveFavorites(userId, favorites) {
  localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
}