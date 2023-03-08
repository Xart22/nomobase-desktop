const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const OpenBlockLink = require("./src/link/src");
const clc = require("cli-color");
const OpenblockResourceServer = require("./src/resource/index");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const extract = require("extract-zip");
const Downloader = require("nodejs-file-downloader");
const console = require("console");
const getHwid = require("node-machine-id").machineIdSync;
const logger = require("electron-log");
const { io } = require("socket.io-client");

const socket = io("http://15.235.140.95:2023", {
  reconnection: true,
  timeout: 10000,
});

const syncLibary = async () => {
  logger.info("Syncing libary");
  try {
    const versionFile = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "src/link/tools/version.json"),
        "utf8"
      )
    );
    const response = await axios.get(
      "https://nomokit-libary.robo-club.com/api/check-update"
    );
    const data = response.data;
    if (data.version !== versionFile.version) {
      fs.rmSync(path.join(__dirname, "src/link/tools/Arduino/libraries"), {
        recursive: true,
        force: true,
      });
      const downloader = new Downloader({
        url: data.url,
        directory: path.join(__dirname, "src/link/tools/Arduino/libraries"),
      });

      const { filePath, downloadStatus } = await downloader.download();
      if (downloadStatus === "COMPLETE") {
        await extract(
          filePath,
          { dir: path.join(__dirname, "src/link/tools/Arduino/libraries") },
          function (err) {
            if (err) {
              console.log(err);
            }
          }
        );

        fs.readdir(
          path.join(__dirname, "src/link/tools/Arduino/libraries"),
          (err, files) => {
            files.forEach(async (file) => {
              if (file !== data.version + ".zip") {
                await extract(
                  path.join(
                    __dirname,
                    "src/link/tools/Arduino/libraries/" + file
                  ),
                  {
                    dir: path.join(
                      __dirname,
                      "src/link/tools/Arduino/libraries"
                    ),
                  },
                  function (err) {
                    if (err) {
                      console.log(err);
                    }
                  }
                );
                fs.unlinkSync(
                  path.join(
                    __dirname,
                    "src/link/tools/Arduino/libraries/" + file
                  )
                );
              } else {
                fs.unlinkSync(
                  path.join(__dirname, "src/link/tools/Arduino/libraries", file)
                );
              }
            });
          }
        );

        fs.writeFileSync(
          path.join(__dirname, "src/link/tools/version.json"),
          JSON.stringify(data)
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};

app.commandLine.appendSwitch("ignore-certificate-errors");

const template = [
  {
    label: "View",
    submenu: [
      {
        role: "reload",
      },
      {
        type: "separator",
      },
      {
        role: "resetzoom",
      },
      {
        role: "zoomin",
      },
      {
        role: "zoomout",
      },
      {
        type: "separator",
      },
      {
        role: "togglefullscreen",
      },
    ],
  },

  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click: async () => {
          const { shell } = require("electron");
          await shell.openExternal("https://nomokit.robo-club.com");
        },
      },
      {
        label: "Check for updates",
        click: async () => {},
      },
      {
        label: "Exit",
        click: async () => {
          app.quit();
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1620,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "/src/assets/img/nomokit.png"),
    title: "Nomobase-Desktop" + " - " + "v" + app.getVersion(),
  });
  const token = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data/user.json"), "utf8")
  );
  logger.info(socket.connected);
  if (socket.connected) {
    if (token.token !== undefined) {
      win.loadFile(path.join(__dirname, "/src/auth/index.html"));
    } else {
      win.loadFile(path.join(__dirname, "/src/gui/index.html"));
    }
  } else {
    win.loadFile(path.join(__dirname, "/src/connection/index.html"));
  }

  //win.webContents.openDevTools();

  ipcMain.on("login", async (event, arg) => {
    const hwid = getHwid();
    arg.hwid = hwid;
    await axios
      .post("https://nomokit.robo-club.com/api/login", arg)
      .then((res) => {
        fs.writeFileSync(
          path.join(__dirname, "/data/user.json"),
          JSON.stringify(res.data)
        );

        win.loadFile(path.join(__dirname, "/src/gui/index.html"));
      })
      .catch((err) => {
        console.log(err);
        event.reply("login-fail", err);
      });
  });

  ipcMain.on("logout", async (event, arg) => {
    fs.writeFileSync(
      path.join(__dirname, "data/user.json"),
      JSON.stringify({})
    );
    win.loadFile(path.join(__dirname, "/src/auth/index.html"));
  });
  socket.on("disconnect", () => {
    win.loadFile(path.join(__dirname, "/src/connection/index.html"));
  });

  socket.on("connect", () => {
    if (token.token !== undefined) {
      win.loadFile(path.join(__dirname, "/src/gui/index.html"));
    } else {
      win.loadFile(path.join(__dirname, "/src/auth/index.html"));
    }
  });
  win.on("close", async () => {
    win.destroy();
  });
};

app.on("ready", () => {
  createWindow();
  syncLibary();
  const resourceServer = new OpenblockResourceServer();
  resourceServer
    .initializeResources(console.log)
    .then(() => {
      resourceServer.listen();
      logger.info("Resource server started");
    })
    .catch((err) => {
      console.error(clc.red(`ERR!: Initialize resources error: ${err}`));
    });

  resourceServer.on("error", (err) => {
    console.error(clc.red(`ERR!: Resource server error: ${err}`));
  });
  //  END: Resource server
  const link = new OpenBlockLink();
  //  START: Link server
  link.listen();
  logger.info("Link server started");
  //  END: Link server
  // check Token
});
app.on("window-all-closed", async () => {
  console.log("window-all-closed");
  app.quit();
});
