import {
  getCurrentUser,
  updateUser,
  loadSession
} from "./auth.js";


function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;

  document.getElementById("currentUserName").textContent = user.name;
  document.getElementById("currentUserEmail").textContent = user.email;

  const img = document.getElementById("profilePreview");

  img.src = user.image || "https://via.placeholder.com/60";

  document.getElementById("profileName").value = user.name;
  document.getElementById("profileEmail").value = user.email;
}

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("profileName").value;
  const email = document.getElementById("profileEmail").value;
  const file = document.getElementById("profileImage").files[0];

  const message = document.getElementById("profileMessage");

  try {
    let imageBase64 = undefined;

    if (file) {
      imageBase64 = await fileToBase64(file);
    }

    const updated = updateUser({
      name,
      email,
      ...(imageBase64 && { image: imageBase64 })
    });

    message.textContent = "Profiili päivitetty!";
    message.className = "message success";

    renderProfile();
    updateUI();

  } catch (err) {
    message.textContent = "Virhe päivityksessä";
    message.className = "message error";
  }
});


function updateUI() {
  const user = getCurrentUser();

  const loginBtn = document.getElementById("showLoginBtn");
  const registerBtn = document.getElementById("showRegisterBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userPanel = document.getElementById("userPanel");

  if (user) {
    loginBtn.classList.add("hidden");
    registerBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    userPanel.classList.remove("hidden");

    renderProfile();
  } else {
    loginBtn.classList.remove("hidden");
    registerBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userPanel.classList.add("hidden");
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  logout();
  updateUI();
});

loadSession();
updateUI();