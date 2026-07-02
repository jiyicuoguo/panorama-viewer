/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const express = require('express');

let mainWindow;
let serverInstance;

// Automatically boots an offline local server within Electron
// This guarantees absolute support for routing, assets, and local uploads
function startExpressServer() {
  const expressApp = express();
  const PORT = 3988; // Isolated local port

  const distPath = path.join(__dirname, 'dist');
  expressApp.use(express.static(distPath));
  
  // SPA Fallback routing
  expressApp.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  serverInstance = expressApp.listen(PORT, '127.0.0.1', () => {
    console.log(`Local static server for Desktop EXE running on http://127.0.0.1:${PORT}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 720,
    title: "360°全景图浏览器 - 桌面端",
    autoHideMenuBar: true, // Auto hide menu bar for native modern feel
    webPreferences: {
      nodeIntegration: false, // Security best practices
      contextIsolation: true,
    }
  });

  // Load the offline express instance
  mainWindow.loadURL('http://127.0.0.1:3988');

  // Customize menu
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '关于', click: () => {
          const { dialog } = require('electron');
          dialog.showMessageBox({
            type: 'info',
            title: '关于全景图浏览器',
            message: '360°全景图桌面端浏览器 v1.0.0',
            detail: '基于 Electron 与 Three.js 构建的专业全景漫游系统。支持离线全景预览、热点标注，完美运行于 Windows 桌面操作系统。'
          });
        }},
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '全屏模式', role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startExpressServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  if (serverInstance) {
    serverInstance.close();
  }
});
