import { app, BrowserWindow, Menu, ipcMain, Tray } from 'electron'
import * as path from 'path' // Import path module
import { fileURLToPath } from 'url'
import * as touichLib from './modules/touichLib.mjs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appWindow = null
let tray = null

/*
 * Twitch Part
 */

/**
 * Focuses the provided window instance.
 *
 * @param {Window} windowInstance - The window instance to be focused.
 */
function focusWindow(windowInstance) {
    if(windowInstance.isMinimized()){
        windowInstance.restore();
    }
    windowInstance.focus();
}

/*
 * Tray Part
 */

/**
 * Creates a system tray icon with a click event listener that either restores the main window if it is minimized and brings it into focus, or creates the main window if it does not
 * exist yet.
 *
 * @return {void} This method does not return anything.
 */
function createTray() {
    tray = new Tray(__dirname + '/assets/logo/touich.png')
    tray.setToolTip('Click to show main window')
    tray.on('click', () => {
        if (appWindow) {
            if(appWindow.isMinimized()){
                appWindow.restore()
                appWindow.focus()
            } else {
                appWindow.minimize()
            }
        } else {
            createAppWindow()
        }
    })
}

/*
 * App Part
 */
function newTwitchWindow() {
    touichLib.createTwitchWindow()
        .then( (newRender) => {
            appWindow.webContents.send('refresh', touichLib.getTwitchInstances())
            newRender.on('closed', () => {
                appWindow.webContents.send('refresh', touichLib.getTwitchInstances())
            });

        });
    appWindow.focus()

}

/**
 * Creates the main application window if it does not exist, and focuses it if it does.
 * @returns {void}
 */
function createAppWindow() {
    if (appWindow) {
        if(appWindow.isMinimized()){
            appWindow.restore();
        }
        appWindow.focus();
    } else {
        const iconPath = __dirname + '/assets/logo/touich.png';
        appWindow = new BrowserWindow({
            width: 600,
            height: 900,
            icon: iconPath,
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

    appWindow.webContents.on('did-finish-load', () => {
        // After launching the app, create the first Twitch window
        newTwitchWindow()
    });
    // When the main window is closed, finish the application if not on macOS
    appWindow.on('closed', () => {
        quiteMainApp()
    });
}

/**
 * Closes the main application.
 *
 * @return {undefined}
 */
function quiteMainApp() {
    // finish application if not on macOS
    if (process.platform !== 'darwin') app.quit()
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
        newTwitchWindow()
    });

    // Call for a refresh of the stream list (from twitchPreload.js)
    ipcMain.on('call-refresh', () => {
        appWindow.webContents.send('refresh', touichLib.getTwitchInstances())
    })

    // Get the list of Twitch instances (from preload.js)
    ipcMain.handle('get-list-instances', (event) => {
        return touichLib.getTwitchInstances();
    });

    // Give focus to a Twitch window (from preload.js)
    ipcMain.on('focus-twitch-window', (event, arg) => {
        focusWindow(touichLib.getTwitchInstanceById(arg))
    });

    // Close a Twitch window (from preload.js)
    ipcMain.on('close-twitch-window', (event, arg) => {
        touichLib.getTwitchInstanceById(arg).close();
    });

    // Mute / Unmute a Twitch window (from preload.js)
    ipcMain.on('mute-unmute-twitch-window', (event, arg) => {
        touichLib.muteUnmute(touichLib.getTwitchInstanceById(arg))
        appWindow.webContents.send('refresh', touichLib.getTwitchInstances())
    });

    /*
     * Create Menu
     */
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
                        newTwitchWindow()
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
    // const menu = Menu.buildFromTemplate(template)
    // Menu.setApplicationMenu(menu)

    /*
     * Create Tray
     */
    createTray()

// Single instance
    const gotTheLock = app.requestSingleInstanceLock()
    if ( ! gotTheLock) {
        // If application is already running, quit this instance
        quiteMainApp()
    } else {
        // Create the main window if it does not exist
        createAppWindow()
        // If application is running but no window is open create a new instance of the main window.
        app.on('activate', function () {
            if (appWindow === null) createAppWindow()
        })
        // If application is running and a second instance is launched, bring the main window to the front
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // bring the main window to the front
            if (appWindow.isMinimized()) {
                appWindow.restore();
            }
            appWindow.focus();
        })
    }
})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
    quiteMainApp()
})

// When main window is closed, close all renderer then quit the app
/*
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
        quiteMainApp()
    })
})
*/