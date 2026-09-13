const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'public', 'logo.png'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile('public/index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('load-shaders', async () => {
    try {
        const vertex_path = path.join(__dirname, 'shaders/vertex.glsl');
        const fragment_path = path.join(__dirname, 'shaders/fragment.glsl');

        const [vertex, fragment] = await Promise.all([
            fs.readFile(vertex_path, 'utf-8'),
            fs.readFile(fragment_path, 'utf-8')
        ])

        return { vertex, fragment };
    } catch (error) {
        console.error('Errore durante la lettura degli shader:', error);
        throw error;
    };
})