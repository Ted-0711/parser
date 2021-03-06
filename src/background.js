'use strict'

import { app, protocol, BrowserWindow, Menu, ipcMain, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const fs = require('fs')
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

ipcMain.on('read-file', (e, filePath) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      e.sender.send('file-content', {errFlag: true, content: err});
    } else if (content.length > 0) {
      e.sender.send('file-content', {errFlag: false, content: content});
    }
  })
})

ipcMain.on('read-grammar', (e, filePath) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      e.sender.send('grammar-content', {errFlag: true, content: err});
    } else if (content.length > 0) {
      e.sender.send('grammar-content', {errFlag: false, content: content});
    }
  })
})

ipcMain.on('read-include-file', (e, filePath) => {
  console.log(filePath)
  fs.readFile(filePath, (err, content) => {
    if (err) {
      e.returnValue = {errFlag: true, content: err};
    } else if (content.length > 0) {
      e.returnValue = {errFlag: false, content: content};
    }
  })
})

// 设置菜单栏
function createMenu() {
  const template = [
    {
      label: 'About',
      submenu: [
        {
          label: 'Source Code (Github Repo)',
          click: () => {
            shell.openExternal('https://github.com/Ted-0711/parser/')
          }
        },
        {
          label: 'Author (Ted Xu)',
          click: () => {
            shell.openExternal('https://ted-0711.github.io/')
          }
        },
        {
          role: 'about'
        },
        {
          role: 'quit'
        }]
    }]
  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    minWidth: 1400,
    minHeight: 900,
    show: false,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      // nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      // contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  })

  win.maximize();
  win.show();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  createMenu()
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
