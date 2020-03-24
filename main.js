// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { promisify } = require("util");
const { basename } = require("path");
const { exec, spawn } = require("child_process");

/**
 * Returns a list of conda envs
 */
async function condaEnvs() {
  const { stdout } = await promisify(exec)("conda env list --json");
  console.log(stdout);
  const { envs } = JSON.parse(stdout);
  return envs.map(p => basename(p));
}

async function createWindow() {
  const envs = await condaEnvs();
  const { response } = await dialog.showMessageBox({
    type: "question",
    message: "Which conda environment should we launch JupyterLab from?",
    title: "Choose Conda Env",
    buttons: envs
  });
  const env = envs[response];
  spawn(
    "conda",
    [
      "run",
      "-vvv",
      "-n",
      env,
      "jupyter",
      "lab",
      "--no-browser",
      "--LabApp.password=",
      "--LabApp.token=",
      "--port",
      "9999"
    ],
    { stdio: "inherit" }
  );
  console.log("starting up");
  // Wait a second to startup
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("done starting up");
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadURL("http://localhost:9999/");
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
