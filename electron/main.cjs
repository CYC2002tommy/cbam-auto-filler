const { app, BrowserWindow, dialog, ipcMain, shell, nativeTheme } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const isDev = !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

// The official template ships with the app and is read from disk, because fetch() is not
// available over file:// in the packaged renderer.
const templatePath = () =>
    path.join(isDev ? app.getAppPath() : process.resourcesPath, 'template', 'cbam-template-v2.1.1.xlsx');

let mainWindow = null;

const createWindow = () => {
    const dark = nativeTheme.shouldUseDarkColors;
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 1024,
        minHeight: 700,
        show: false,
        title: 'CBAM 申報助手',
        backgroundColor: dark ? '#00000000' : '#00ffffff',
        // Translucent chrome: Mica on Windows 11, vibrancy on macOS.
        backgroundMaterial: 'mica',
        vibrancy: 'sidebar',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https?:\/\//.test(url)) shell.openExternal(url);
        return { action: 'deny' };
    });

    if (isDev) mainWindow.loadURL(DEV_URL);
    else mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
};

ipcMain.handle('template:read', async () => {
    const buffer = await fs.readFile(templatePath());
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
});

ipcMain.handle('project:open', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: '開啟 CBAM 專案',
        filters: [{ name: 'CBAM 專案', extensions: ['cbam'] }],
        properties: ['openFile'],
    });
    if (canceled || !filePaths[0]) return null;
    return { name: path.basename(filePaths[0]), text: await fs.readFile(filePaths[0], 'utf8') };
});

ipcMain.handle('project:save', async (_event, { text, suggestedName }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: '儲存 CBAM 專案',
        defaultPath: suggestedName,
        filters: [{ name: 'CBAM 專案', extensions: ['cbam'] }],
    });
    if (canceled || !filePath) return null;
    await fs.writeFile(filePath, text, 'utf8');
    return path.basename(filePath);
});

ipcMain.handle('file:saveBinary', async (_event, { data, suggestedName, filterName, extension }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: suggestedName,
        filters: [{ name: filterName, extensions: [extension] }],
    });
    if (canceled || !filePath) return null;
    await fs.writeFile(filePath, Buffer.from(data));
    return filePath;
});

ipcMain.handle('file:reveal', async (_event, filePath) => { shell.showItemInFolder(filePath); });

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
