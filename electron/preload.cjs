const { contextBridge, ipcRenderer } = require('electron');

/** The only surface the renderer gets: reading the bundled template and the file dialogs. */
contextBridge.exposeInMainWorld('cbam', {
    isDesktop: true,
    platform: process.platform,
    readTemplate: () => ipcRenderer.invoke('template:read'),
    openProject: () => ipcRenderer.invoke('project:open'),
    saveProject: (text, suggestedName) => ipcRenderer.invoke('project:save', { text, suggestedName }),
    saveBinary: (data, suggestedName, filterName, extension) =>
        ipcRenderer.invoke('file:saveBinary', { data, suggestedName, filterName, extension }),
    reveal: (filePath) => ipcRenderer.invoke('file:reveal', filePath),
});
