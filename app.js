const { app, BrowserWindow, Menu, ipcMain } = require('electron')

/*
 * Create the main window
 */
function createTwitchWindow() {
    let newRender;
    const iconPath = __dirname + '/assets/logo/twitch.png';
    const BrowserWindowOptions = {
        width: 1600,
        height: 900,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,             // Disable node in the browser context (false by default)
            contextIsolation: true,             // set contextIsolation to protect against prototype pollution
            sandbox: true,                      // set sandboxing to true, useless in this context since app.enableSandbox() is called later. This is just for educational purpose.
            worldSafeExecuteJavaScript: true,   // prevent unsafe JS evaluation on unsecure context
            enableRemoteModule: false,          // Disable remote module
        },
    }
    newRender = new BrowserWindow(BrowserWindowOptions)

    // Charger le site OpenAI Chat
    newRender.loadURL('https://www.twitch.tv/')
}

// Enable sandboxing application wise
app.enableSandbox()

// Create the main window when electron is ready
app.whenReady().then(() => {
    // Création du menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New window',
                    click: () => {
                        createTwitchWindow()
                    },
                },
                {
                    label: 'Mute / Unmute',
                    click: () => {
                        // Get the current window
                        const currentWindow = BrowserWindow.getFocusedWindow();

                        // Toggle the muted state
                        const mutedState = currentWindow.webContents.isAudioMuted();
                        currentWindow.webContents.setAudioMuted(!mutedState);

                        // Changement du titre de la fenêtre.
                        if (!mutedState) {
                            currentWindow.setTitle(currentWindow.getTitle() + ' (muted)')
                        } else {
                            currentWindow.setTitle(currentWindow.getTitle().replace(' (muted)', ''))
                        }
                    }
                }
                // Autres entrées de menu...
            ]
        },
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)



    createTwitchWindow()
    // If application is running but no window is open create a new instance of the main window.
    app.on('activate', function () {
        if (mainWindow === null) createTwitchWindow()
    })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

