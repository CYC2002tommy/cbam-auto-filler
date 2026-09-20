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
    ai: {
        status: () => ipcRenderer.invoke('ai:status'),
        setKey: (key) => ipcRenderer.invoke('ai:setKey', key),
        extract: (payload) => ipcRenderer.invoke('ai:extract', payload),
        ask: (payload) => ipcRenderer.invoke('ai:ask', payload),
    },
    onMenu: (handler) => {
        const listener = (_event, action) => handler(action);
        ipcRenderer.on('menu:action', listener);
        return () => ipcRenderer.off('menu:action', listener);
    },
});
