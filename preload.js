const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    load_shader: () => ipcRenderer.invoke('load-shaders')
});

