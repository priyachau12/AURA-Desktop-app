const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  shell,
} = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    icon: path.join(__dirname, "assets", "icon.png"), // Add your app icon
    titleBarStyle: "hidden", // For custom title bar
    frame: false, // Remove default frame for custom design
    show: false, // Don't show until ready
  });

  // Load the HTML file
  mainWindow.loadFile("index.html");

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle window controls from renderer
ipcMain.handle("window-minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("window-close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Handle file operations
ipcMain.handle("show-open-dialog", async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("write-file", async (event, filePath, data) => {
  try {
    await fs.promises.writeFile(filePath, data, "utf8");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle notifications
ipcMain.handle("show-notification", (event, title, body) => {
  const { Notification } = require("electron");

  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title,
      body: body,
      icon: path.join(__dirname, "assets", "icon.png"),
    });

    notification.show();
  }
});

// Auto-updater (optional)
if (require("electron-squirrel-startup")) app.quit();

// Set up menu (optional - you can remove this for a cleaner look)
const template = [
  {
    label: "File",
    submenu: [
      {
        label: "New File",
        accelerator: "CmdOrCtrl+N",
        click: () => {
          mainWindow.webContents.send("menu-new-file");
        },
      },
      {
        label: "Open File",
        accelerator: "CmdOrCtrl+O",
        click: () => {
          mainWindow.webContents.send("menu-open-file");
        },
      },
      { type: "separator" },
      {
        label: "Exit",
        accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forcereload" },
      { role: "toggledevtools" },
      { type: "separator" },
      { role: "resetzoom" },
      { role: "zoomin" },
      { role: "zoomout" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  {
    label: "Window",
    submenu: [{ role: "minimize" }, { role: "close" }],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
