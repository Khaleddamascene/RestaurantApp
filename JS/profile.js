import {
  getCurrentUser,
  getUsers,
  saveUsers,
  updateUser,
  logout,
  changePassword
} from "./auth.js";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/%3E%3C/svg%3E";

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  loadProfile(user);
  setupEvents(user);
});

// =====================
// LOAD PROFILE
// =====================
function loadProfile(user) {
  const fullUser = getUsers().find(u => u.email === user.email);

  const name = fullUser?.name || user.name || "";
  const email = fullUser?.email || user.email || "";

  document.getElementById("currentUserName").textContent = name;
  document.getElementById("currentUserEmail").textContent = email;

  document.getElementById("profileName").value = name;
  document.getElementById("profileEmail").value = email;

  document.getElementById("profilePreview").src =
    fullUser?.image || PLACEHOLDER;
}

// =====================
// EVENTS
// =====================
function setupEvents(user) {

  // 🔵 AVATAR UPLOAD
  document.getElementById("profileImage").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = ev => {
      const users = getUsers();
      const idx = users.findIndex(u => u.email === user.email);

      if (idx === -1) return;

      users[idx].image = ev.target.result;
      saveUsers(users);

      // reload updated user
      loadProfile(getCurrentUser());
    };

    reader.readAsDataURL(file);
  });

  // 🟢 SAVE PROFILE
  document.getElementById("profileForm").addEventListener("submit", e => {
    e.preventDefault();

    const updated = {
      email: user.email,
      name: document.getElementById("profileName").value
    };

    updateUser(updated);

    document.getElementById("profileMessage").textContent = "Saved!";
  });

  // 🔴 LOGOUT
  document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
    window.location.href = "index.html";
  });

  // 🔐 CHANGE PASSWORD (FIXED SCOPE)
  document.getElementById("passwordForm").addEventListener("submit", e => {
    e.preventDefault();

    const current = document.getElementById("currentPassword").value;
    const next = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmNewPassword").value;

    const msg = document.getElementById("passwordMessage");

    msg.classList.remove("success", "error");

    if (next.length < 6) {
      msg.textContent = "Salasanan tulee olla vähintään 6 merkkiä";
      msg.classList.add("error");
      return;
    }

    if (next !== confirm) {
      msg.textContent = "Salasanat eivät täsmää";
      msg.classList.add("error");
      return;
    }

    try {
      changePassword(user.email, current, next);

      msg.textContent = "Salasana vaihdettu!";
      msg.classList.add("success");

      document.getElementById("passwordForm").reset();

    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add("error");
    }
  });
}