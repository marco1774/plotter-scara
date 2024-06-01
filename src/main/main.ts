/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
// eslint-disable-next-line import/no-cycle
import { ReadlineParser } from 'serialport';
// eslint-disable-next-line import/no-cycle
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const fs = require('fs');
const { SerialPort } = require('serialport');

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

SerialPort.list()
  .then((ports: any) => {
    console.log('ports', ports);
    const port = new SerialPort({
      path: ports.find((com) => com.productId === '0043').path,
      baudRate: 115200,
    });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    parser.on('data', (data) => {
      console.log('data', data);
      if (!mainWindow) return;
      mainWindow.webContents.send('arduino-serial-data', data);
    });
  })
  .catch(console.log);

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('ipc-prova', async (event, arg) => {
  console.log(arg);
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = []; //  ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1920,
    height: 1080,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'), // Assicurati che sia disabilitato
      sandbox: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

// open gcode file
export function openGcodeFile() {
  if (!mainWindow) return;
  const fileSelected = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'gcode', extensions: ['gcode', 'txt'] }],
  });
  if (!fileSelected) return;
  // console.log('fileSelected', fileSelected[0]);
  const gcode: string = fs.readFileSync(fileSelected[0]).toString();
  // console.log('fileSelected:gcode', gcode);
  // gcode.split(/\r?\n/).forEach((line) => {
  //   console.log(`Line from file: ${line}`);
  // });
  // const used = process.memoryUsage().heapUsed / 1024 / 1024;
  // console.log(
  //   `The script uses approximately ${Math.round(used * 100) / 100} MB`,
  // );
  mainWindow.webContents.send('gcode:load', gcode);
}
