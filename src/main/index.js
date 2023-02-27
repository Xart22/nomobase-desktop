const { app, BrowserWindow, Tray, Menu } = require("electron");
const OpenBlockLink = require("../link/src");

const openBlockLink = new OpenBlockLink();

openBlockLink.listen();

app.on("ready", () => {
  const tray = new Tray("icon.png");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: () => {
        const win = new BrowserWindow({
          width: 800,
          height: 600,
          webPreferences: {
            nodeIntegration: true,
          },
        });
        win.loadFile("index.html");
      },
    },
    { label: "Quit", role: "quit" },
  ]);
  tray.setToolTip("OpenBlock Link");
  tray.setContextMenu(contextMenu);
});
