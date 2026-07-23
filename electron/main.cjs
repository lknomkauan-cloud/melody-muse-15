// Electron main process for Solando (PC build)
// Auto-grants microphone permission so getUserMedia works without any popup.
const { app, BrowserWindow, session, systemPreferences } = require('electron');
const path = require('path');

const isDev = !!process.env.ELECTRON_DEV_URL;

async function createWindow() {
  // macOS: request mic access up front (no-op on Windows/Linux)
  if (process.platform === 'darwin') {
    try {
      await systemPreferences.askForMediaAccess('microphone');
    } catch (_) {}
  }

  // Auto-grant media/mic permissions to the app's own origin (no browser prompt).
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    if (
      permission === 'media' ||
      permission === 'audioCapture' ||
      permission === 'mediaKeySystem'
    ) {
      return callback(true);
    }
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => true);

  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    title: 'Solando',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Ensure audio/video capture works without a user gesture prompt
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  if (isDev) {
    await win.loadURL(process.env.ELECTRON_DEV_URL);
  } else {
    await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
