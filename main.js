const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
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
const { autoUpdater, AppUpdater } = require("electron-updater");

logger.transports.file.level = "info";
autoUpdater.logger = logger;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

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
    const response = await axios.get("https://nomo-kit.com/api/check-update");
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
          await shell.openExternal("https://nomo-kit.com/");
        },
      },
      {
        label: "Exit",
        click: async () => {
          fs.rmSync(path.join(__dirname, "/src/resource/.openblockData"), {
            recursive: true,
            force: true,
          });
          app.quit();
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
let win;
const createWindow = () => {
  win = new BrowserWindow({
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

  win.loadFile(path.join(__dirname, "/src/connection/index.html"));

  //win.webContents.openDevTools();

  ipcMain.on("login", async (event, arg) => {
    console.log(arg);
    const hwid = getHwid();
    arg.hwid = hwid;
    await axios
      .post("https://nomo-kit.com/api/login", arg)
      .then((res) => {
        fs.writeFileSync(
          path.join(__dirname, "/data/user.json"),
          JSON.stringify(res.data)
        );

        win.loadFile(path.join(__dirname, "/src/gui/index.html"));
      })
      .catch((err) => {
        event.reply("login-fail", err.response.data);
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
      let date = new Date(token.user.subscriptions.end_date);
      let now = new Date();
      if (date < now) {
        fs.writeFileSync(
          path.join(__dirname, "data/user.json"),
          JSON.stringify({})
        );
        win.loadFile(path.join(__dirname, "/src/auth/index.html"));
      } else {
        win.loadFile(path.join(__dirname, "/src/gui/index.html"));
      }
    } else {
      win.loadFile(path.join(__dirname, "/src/auth/index.html"));
    }
  });
  win.on("close", async () => {
    win.destroy();
  });
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
  return win;
};
app.whenReady().then(() => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("ready", async () => {
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on("update-available", () => {
    dialog
      .showMessageBox({
        type: "question",
        title: "Update available",
        message: "Update Version is available",
        buttons: ["Yes", "No"],
        yes: 0,
        no: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          win.loadFile(path.join(__dirname, "/src/update/index.html"));
          autoUpdater.downloadUpdate();
        }
      });
  });
  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "question",
        title: "Update available",
        message: "Update is downloaded, will be installed on restart",
        buttons: ["Yes", "No"],
        yes: 0,
        no: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          app.exit();
          autoUpdater.quitAndInstall(false, false);
        }
      });
  });
  autoUpdater.on("error", (err) => {
    dialog.showErrorBox("Error: ", err == null ? "unknown" : err);
  });
  autoUpdater.on("download-progress", (progressObj) => {
    win.webContents.send("download-progress", progressObj.percent);
  });
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    fs.rmSync(path.join(__dirname, "/src/resource/.openblockData"), {
      recursive: true,
      force: true,
    });
    win.destroy();
    app.exit();
  }
});
app.on("before-quit", async () => {
  fs.rmSync(path.join(__dirname, "/src/resource/.openblockData"), {
    recursive: true,
    force: true,
  });
  win.destroy();
  app.exit();
});
