const { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, shell, nativeTheme } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const isDev = !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

// The official template ships with the app and is read from disk, because fetch() is not
// available over file:// in the packaged renderer.
const templatePath = () =>
    path.join(isDev ? app.getAppPath() : process.resourcesPath, 'template', 'cbam-template-v2.1.1.xlsx');

let mainWindow = null;
let lastSaveDir = null;   // start the next dialog where the last file went

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

    // Safety net: anything that still downloads the browser way must also ask where to go,
    // otherwise Electron quietly drops it in the default Downloads folder.
    mainWindow.webContents.session.on('will-download', (event, item) => {
        const suggested = item.getFilename();
        const chosen = dialog.showSaveDialogSync(mainWindow, {
            defaultPath: path.join(lastSaveDir || app.getPath('documents'), suggested),
        });
        if (!chosen) { item.cancel(); return; }
        lastSaveDir = path.dirname(chosen);
        item.setSavePath(chosen);
    });
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
        defaultPath: path.join(lastSaveDir || app.getPath('documents'), suggestedName),
        filters: [{ name: 'CBAM 專案', extensions: ['cbam'] }],
    });
    if (canceled || !filePath) return null;
    await fs.writeFile(filePath, text, 'utf8');
    lastSaveDir = path.dirname(filePath);
    return filePath;
});

ipcMain.handle('file:saveBinary', async (_event, { data, suggestedName, filterName, extension }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: path.join(lastSaveDir || app.getPath('documents'), suggestedName),
        filters: [{ name: filterName, extensions: [extension] }],
    });
    if (canceled || !filePath) return null;
    await fs.writeFile(filePath, Buffer.from(data));
    lastSaveDir = path.dirname(filePath);
    return filePath;
});

ipcMain.handle('file:reveal', async (_event, filePath) => { shell.showItemInFolder(filePath); });

// --- AI document reading -------------------------------------------------------------
const gemini = require('./gemini.cjs');
const fsSync = require('node:fs');

// A key the user pastes in settings is kept encrypted in the user's own profile,
// so it survives a restart but never sits in plain text next to the app.
const keyFile = () => path.join(app.getPath('userData'), 'gemini.key');
let userKey = null;
const loadUserKey = () => {
    try {
        if (!safeStorage.isEncryptionAvailable() || !fsSync.existsSync(keyFile())) return null;
        return safeStorage.decryptString(fsSync.readFileSync(keyFile()));
    } catch { return null; }
};
const storeUserKey = (key) => {
    try {
        if (!key) { fsSync.rmSync(keyFile(), { force: true }); return; }
        if (safeStorage.isEncryptionAvailable()) fsSync.writeFileSync(keyFile(), safeStorage.encryptString(key));
    } catch { /* a key that cannot be stored still works for this session */ }
};

ipcMain.handle('ai:status', async () => ({
    available: Boolean(userKey) || gemini.hasKey(),
    usingOwnKey: Boolean(userKey),
}));
ipcMain.handle('ai:setKey', async (_event, key) => {
    userKey = key || null;
    storeUserKey(userKey);
    return true;
});
ipcMain.handle('ai:extract', async (_event, { dataBase64, mimeType, fields, lang }) =>
    gemini.extract({ dataBase64, mimeType, fields, lang, key: userKey }));
ipcMain.handle('ai:ask', async (_event, { question, history, context, lang }) =>
    gemini.ask({ question, history, context, lang, key: userKey }));


/** Application menu. The items the renderer owns are sent to it as menu actions. */
const send = (action) => mainWindow?.webContents.send('menu:action', action);

const buildMenu = () => {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac ? [{ role: 'appMenu' }] : []),
        {
            label: '檔案',
            submenu: [
                { label: '開新專案', accelerator: 'CmdOrCtrl+N', click: () => send('new') },
                { label: '開啟專案…', accelerator: 'CmdOrCtrl+O', click: () => send('open') },
                { type: 'separator' },
                { label: '儲存專案…', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
                { label: '匯出申報表…', accelerator: 'CmdOrCtrl+E', click: () => send('export') },
                { type: 'separator' },
                { label: '讀取文件（AI）…', accelerator: 'CmdOrCtrl+I', click: () => send('ai-upload') },
                { type: 'separator' },
                isMac ? { role: 'close', label: '關閉視窗' } : { role: 'quit', label: '結束' },
            ],
        },
        { label: '編輯', submenu: [
            { role: 'undo', label: '復原' }, { role: 'redo', label: '重做' }, { type: 'separator' },
            { role: 'cut', label: '剪下' }, { role: 'copy', label: '複製' }, { role: 'paste', label: '貼上' },
            { role: 'selectAll', label: '全選' },
        ] },
        { label: '檢視', submenu: [
            { role: 'reload', label: '重新載入' }, { role: 'resetZoom', label: '原始大小' },
            { role: 'zoomIn', label: '放大' }, { role: 'zoomOut', label: '縮小' }, { type: 'separator' },
            { role: 'togglefullscreen', label: '全螢幕' }, { role: 'toggleDevTools', label: '開發者工具' },
        ] },
        { label: '說明', submenu: [
            { label: '說明與資源', click: () => send('help') },
            { label: '歐盟 CBAM 官方網站', click: () => shell.openExternal('https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en') },
            { label: '安裝與使用說明', click: () => shell.openExternal('https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-communication-and-news_en') },
        ] },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

app.whenReady().then(() => {
    userKey = loadUserKey();
    createWindow();
    buildMenu();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
