const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const OpenBlockLink = require("./src/link/src");
const clc = require("cli-color");
const OpenblockResourceServer = require("./src/resource/index");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const extract = require("extract-zip");
const Downloader = require("nodejs-file-downloader");
const getHwid = require("node-machine-id").machineIdSync;

const devToolKey = {
  // Windows: control+shift+i
  alt: false,
  control: true,
  meta: false, // Windows key
  shift: true,
  code: "KeyI",
};

const syncLibary = async () => {
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
app.commandLine.hasSwitch("enable-gpu");
app.commandLine.hasSwitch("ignore-gpu-blacklist");

app.on("ready", async () => {
  await syncLibary();
  const resourceServer = new OpenblockResourceServer();
  // START: Resource server
  resourceServer
    .initializeResources(console.log)
    .then(() => {
      resourceServer.listen();
    })
    .catch((err) => {
      console.error(clc.red(`ERR!: Initialize resources error: ${err}`));
    });

  resourceServer.on("error", (err) => {
    console.error(clc.red(`ERR!: Resource server error: ${err}`));
  });
  // END: Resource server
  const link = new OpenBlockLink();
  // START: Link server
  link.listen();
  // END: Link server

  //check Token
  const token = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data/user.json"), "utf8")
  );
  //
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
  win.webContents.openDevTools();
  if (token.token !== undefined) {
    win.loadFile(path.join(__dirname, "/src/gui/index.html"));
  } else {
    win.loadFile(path.join(__dirname, "/src/auth/index.html"));
  }
  win.on("closed", async () => {
    console.log("closed");
  });

  win.on("minimize", function (event) {
    event.preventDefault();
    win.hide();
  });
  ipcMain.on("login", async (event, arg) => {
    const hwid = getHwid();
    arg.hwid = hwid;
    await axios
      .post("http://nomokit.test/api/login", arg)
      .then((res) => {
        fs.writeFileSync(
          path.join(__dirname, "data/user.json"),
          JSON.stringify(res.data)
        );

        win.loadFile(path.join(__dirname, "/src/gui/index.html"));
      })
      .catch((err) => {
        console.log(err);
        event.reply("login-fail", err);
      });
  });
});
