const Pusher = require("pusher-js");
const Echo = require("laravel-echo");
const { ipcRenderer } = require("electron");

window.Pusher = Pusher;
window.Echo = new Echo.default({
  broadcaster: "pusher",
  key: "nomokit2023sonasof",
  wsHost: "nomokit.robo-club.com",
  wsPort: 6001,
  wssPort: 443,
  forceTLS: "https",
  enabledTransports: ["ws", "wss"],
  cluster: "mt1",
});

window.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("login");
  const error = document.getElementById("error");
  error.style.display = "none";
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  window.Echo.channel("auth").listen("AuthEvent", (e) => {
    console.log(e);
  });
  window.Echo.connector.pusher.connection.bind("connecting", (payload) => {
    /**
     * All dependencies have been loaded and Channels is trying to connect.
     * The connection will also enter this state when it is trying to reconnect after a connection failure.
     */

    console.log("connecting...");
  });
  window.Echo.connector.pusher.connection.bind("connected", (payload) => {
    /**
     * The connection to Channels is open and authenticated with your app.
     */

    console.log("connected!", payload);
  });

  window.Echo.connector.pusher.connection.bind("unavailable", (payload) => {
    /**
     *  The connection is temporarily unavailable. In most cases this means that there is no internet connection.
     *  It could also mean that Channels is down, or some intermediary is blocking the connection. In this state,
     *  pusher-js will automatically retry the connection every 15 seconds.
     */

    console.log("unavailable", payload);
  });

  window.Echo.connector.pusher.connection.bind("failed", (payload) => {
    /**
     * Channels is not supported by the browser.
     * This implies that WebSockets are not natively available and an HTTP-based transport could not be found.
     */

    console.log("failed", payload);
  });

  window.Echo.connector.pusher.connection.bind("disconnected", (payload) => {
    /**
     * The Channels connection was previously connected and has now intentionally been closed
     */

    console.log("disconnected", payload);
  });

  window.Echo.connector.pusher.connection.bind("message", (payload) => {
    /**
     * Ping received from server
     */

    console.log("message", payload);
  });
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
