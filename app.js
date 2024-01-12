const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path'); // Import path module

let appWindow;
let twitchInstances = []; // Array to store all instances of twitch renderers

/**
 * Creates a new Twitch window.
 * @function createTwitchWindow
 * @returns {void}
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
    twitchInstances[newRender.id] = newRender;   // Store the id instance
    newRender.loadURL('https://www.twitch.tv/')
}

/**
 * Function to get all twitch instances
 * @function getTwitchInstances
 * @returns {string[]}
 */
function getTwitchInstances() {
    let t = []
    console.log('instance ID', Object.keys(twitchInstances))
    twitchInstances.forEach((ins, idx) => {
        t.push({
            id: idx,
            name: ins.getTitle()
        })
    })
    return t
}

/**
 * Creates a new App window.
 * @function createAppWindow
 * @returns {void}
 */
function createAppWindow() {
    if (appWindow) {
        appWindow.focus();
    } else {
        appWindow = new BrowserWindow({
            width: 600,
            height: 900,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'modules/preload.js')
            }
        })
        appWindow.loadFile('modules/index.html');
        appWindow.on('closed', () => {
            appWindow = null;
        });
    }
}

function muteUnmute(windowInstance) {
    // Toggle the muted state
    const mutedState = isMutted(windowInstance)
    windowInstance.webContents.setAudioMuted(!mutedState);

    // Change window name
    if (!mutedState) {
        windowInstance.setTitle(windowInstance.getTitle() + ' (muted)')
    } else {
        windowInstance.setTitle(windowInstance.getTitle().replace(' (muted)', ''))
    }
}

function isMutted(windowInstance) {
    return windowInstance.webContents.isAudioMuted();
}



// Enable sandboxing application wise
app.enableSandbox()

// Create the main window when electron is ready
app.whenReady().then(() => {
    ipcMain.on('create-twitch-window', (event, arg) => {
        createTwitchWindow();
    });

    ipcMain.handle('get-list-instances', (event) => {
        return getTwitchInstances();
    });

    // Création du menu
    const template = [
        {
            label: 'File',
            /**
             * Defines the submenu for the Menu item.
             * @typedef {Object[]} Submenu
             * @property {string} label - The label for the submenu item.
             * @property {function} click - The function to be executed when the submenu item is clicked.
             */
            submenu: [
                // new window
                {
                    label: 'New window',
                    click: () => {
                        createTwitchWindow()
                    },
                },
                // Mute / Unmute
                {
                    label: 'Mute / Unmute',
                    click: () => {
                        // Get the current window
                        const currentWindow = BrowserWindow.getFocusedWindow();
                        muteUnmute(currentWindow)
                    }
                },
                {
                    label: 'Open DevTools',
                    click: () => {
                        const currentWindow = BrowserWindow.getFocusedWindow();
                        currentWindow.webContents.openDevTools();
                    }
                }
            ]
        },
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)



    createAppWindow()
    // If application is running but no window is open create a new instance of the main window.
    app.on('activate', function () {
        if (mainWindow === null) createAppWindow()
    })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})