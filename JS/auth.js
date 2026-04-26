let currentUser = null;

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function saveSession(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function loadSession() {
  const user = localStorage.getItem("currentUser");
  if (user) currentUser = JSON.parse(user);
  return currentUser;
}

export function getCurrentUser() {
  return currentUser;
}

// =====================
// REGISTER
// =====================
export function register(name, email, password) {
  const users = getUsers();

  if (users.find(u => u.email === email)) {
    throw new Error("Sähköposti on jo käytössä");
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

  return newUser;
}

// =====================
// LOGIN
// =====================
export function login(email, password) {
  const users = getUsers();

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error("Väärä sähköposti tai salasana");
  }

  currentUser = user;
  saveSession(user);

  return user;
}

// =====================
// LOGOUT
// =====================
export function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
}

// =====================
// UPDATE USER
// =====================
export function updateUser(data) {
  const users = getUsers();

  const index = users.findIndex(u => u.id === currentUser.id);
  if (index === -1) return;

  users[index] = {
    ...users[index],
    ...data
  };

  saveUsers(users);

  currentUser = users[index];
  saveSession(currentUser);

  return currentUser;
}