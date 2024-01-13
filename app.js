const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path'); // Import path module

let appWindow;
let twitchInstances = []; // Array to store all instances of twitch renderers

/**
 * Creates a new Twitch window.
 *
 * @return {void}
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
            preload: path.join(__dirname, 'modules/twitchPreload.js')
        },
    }
    newRender = new BrowserWindow(BrowserWindowOptions)
    twitchInstances[newRender.id] = newRender;   // Store the id instance
    newRender.loadURL('https://www.twitch.tv/')
    appWindow.webContents.send('refresh', getTwitchInstances())
    // Give focus back to the main window
    appWindow.focus()

    // When page is loaded update the main window
/*
    newRender.webContents.on('did-finish-load', () => {
        newRender.webContents.openDevTools()
        newRender.webContents.executeJavaScript(`
            let __streamTitle = document.querySelector('[data-a-target="stream-title"]')
            if (__streamTitle) {
                return __streamTitle.innerText
            } else {
                return 'No title'
            }
        `)
        .then(streamTitle => {
            console.log(streamTitle);
            // appWindow.webContents.send('send-title', [newRender.id, streamTitle])
        })
        .catch( err => console.log(err))
    })
*/

    // On close remove the instance from the array
    newRender.on('closed', () => {
        delete twitchInstances[newRender.id]
        appWindow.webContents.send('refresh', getTwitchInstances())
        newRender = null;
    });

}

/**
 * Retrieves Twitch instances and returns an array of objects containing their IDs and names.
 *
 * @returns {Object[]} - An array of objects representing the Twitch instances. Each object contains the following properties:
 *  - id: The ID of the instance as a number.
 *  - name: The title of the instance as a string.
 *  - muted: Whether the instance is muted or not as a boolean.
 */
function getTwitchInstances() {
    let t = []
    console.log('instance ID', Object.keys(twitchInstances))
    twitchInstances.forEach((ins, idx) => {
        t.push({
            id: idx,
            name: ins.getTitle(),
            muted: isMutted(ins)
        })
    })
    return t
}

/**
 * Creates the main application window if it does not exist, and focuses it if it does.
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

    appWindow.on('closed', () => {
        // finish application if not on macOS
        app.quit()
    });

}

/**
 * Toggles the audio muted state of a window and updates the window title accordingly.
 *
 * @param {Electron.BrowserWindow} windowInstance - The window to mute/unmute.
 * @return {boolean} - The previous muted state of the window.
 */
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
    return mutedState
}

/**
 * Determines if the audio is muted in the given window instance.
 *
 * @param {Electron.BrowserWindow} windowInstance - The window instance to check.
 * @returns {boolean} - True if the audio is muted, false otherwise.
 */
function isMutted(windowInstance) {
    return windowInstance.webContents.isAudioMuted();
}



// Enable sandboxing application wise
app.enableSandbox()
// Create the main window when electron is ready
app.whenReady().then(() => {
    /*
     * IPCs
     */
    // Ask for a new Twitch window (from preload.js)
    ipcMain.on('create-twitch-window', (event, arg) => {
        createTwitchWindow();
    });

    // Call for a refresh of the stream list (from twitchPreload.js)
    ipcMain.on('call-refresh', () => {
        appWindow.webContents.send('refresh', getTwitchInstances())
    })

    // Get the list of Twitch instances (from preload.js)
    ipcMain.handle('get-list-instances', (event) => {
        return getTwitchInstances();
    });

    // Give focus to a Twitch window (from preload.js)
    ipcMain.on('focus-twitch-window', (event, arg) => {
        twitchInstances[arg].focus();
    });

    // Close a Twitch window (from preload.js)
    ipcMain.on('close-twitch-window', (event, arg) => {
        twitchInstances[arg].close();
    });

    // Mute / Unmute a Twitch window (from preload.js)
    ipcMain.on('mute-unmute-twitch-window', (event, arg) => {
        muteUnmute(twitchInstances[arg])
        appWindow.webContents.send('refresh', getTwitchInstances())
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

// Wain main window is closed, close all renderer then quit the app
app.on('before-quit', (event) => {
    event.preventDefault(); // Prevents the app from quitting
    let promises = [];
    for (let ins of twitchInstances) {
        promises.push(new Promise((resolve) => {
            ins.once('closed', resolve); // Resolve when the 'closed' event is emitted
            ins.close();
        }));
    }

    Promise.all(promises).then(() => {
        if (process.platform !== 'darwin') app.quit()
    });
});
