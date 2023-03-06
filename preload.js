const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("login");
  const error = document.getElementById("error");
  error.style.display = "none";
  const email = document.getElementById("email");
  const password = document.getElementById("password");

  function login() {
    if (email.value !== "" && password.value !== "") {
      ipcRenderer.send("login", {
        email: email.value,
        password: password.value,
      });
    } else {
      email.classList.add("is-invalid");
      password.classList.add("is-invalid");
    }
  }
  ipcRenderer.on("login-fail", (event, arg) => {
    error.style.display = "block";
    email.classList.add("is-invalid");
    password.classList.add("is-invalid");
    error.innerHTML = "Email atau password salah";
  });
  btn.addEventListener("click", async () => {
    login();
  });
  email.addEventListener("keyup", (e) => {
    error.style.display = "none";
    email.classList.remove("is-invalid");
    password.classList.remove("is-invalid");
  });
  password.addEventListener("keyup", () => {
    error.style.display = "none";
    email.classList.remove("is-invalid");
    password.classList.remove("is-invalid");
  });
});
