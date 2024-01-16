import { app, BrowserWindow, Menu, ipcMain, Tray } from 'electron'

import * as path from 'path'
import { fileURLToPath } from 'url'

console.log(import.meta)
const __filename= fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


let twitchInstances = []; // Array to store all instances of twitch renderers


/**
 * Toggles the audio muted state of a window and updates the window title accordingly.
 *
 * @param {Electron.BrowserWindow} windowInstance - The window to mute/unmute.
 * @return {boolean} - The previous muted state of the window.
 */
 export function muteUnmute(windowInstance) {
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
export function isMutted(windowInstance) {
    return windowInstance.webContents.isAudioMuted();
}

/**
 * Creates a new Twitch window.
 *
 * @return {void}
 */
export function createTwitchWindow(appWindow) {
    let newRender;
    const iconPath = __dirname + '/../assets/logo/touich.png';
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
            // preload: 'twitchPreload.js'
            preload: path.join(__dirname, 'twitchPreload.js')
        },
    }
    console.log(BrowserWindowOptions)
    newRender = new BrowserWindow(BrowserWindowOptions)
    twitchInstances[newRender.id] = newRender;   // Store the id instance
    // newRender.webContents.openDevTools()
    newRender.loadURL('https://www.twitch.tv/')

    newRender.webContents.on('preload-error', (event, preloadPath, error) => {
        console.log(`Failed to load preload script at '${preloadPath}'. Error: ${error.message}`);
    });

    // appWindow.webContents.send('refresh', getTwitchInstances())
    // Give focus back to the main window
    // appWindow.focus()

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
//        appWindow.webContents.send('refresh', getTwitchInstances())
//         newRender = null;
    });

    // When the window is ready, send the instance to the main process using a promise
    return new Promise( (resolve) => {
        // When the DOM is loaded and parsed, be careful this is right when the DOM is ready, not when the page is fully loaded
        newRender.webContents.on('dom-ready', () => {
            resolve(newRender)
        })
    })
}

/**
 * Retrieves Twitch instances and returns an array of objects containing their IDs and names.
 *
 * @returns {Object[]} - An array of objects representing the Twitch instances. Each object contains the following properties:
 *  - id: The ID of the instance as a number.
 *  - name: The title of the instance as a string.
 *  - muted: Whether the instance is muted or not as a boolean.
 */
export function getTwitchInstances() {
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
 * Focuses the provided window instance.
 *
 * @param {Window} windowInstance - The window instance to be focused.
 */
export function focusWindow(windowInstance) {
    if(windowInstance.isMinimized()){
        windowInstance.restore();
    }
    windowInstance.focus();
}

export function getTwitchInstanceById(id) {
    return twitchInstances[id]
}

