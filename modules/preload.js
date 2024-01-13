const {ipcRenderer, contextBridge} = require('electron');

/**
 * Creates a button for each instance and appends it to the button container.
 *
 * @param {Array} instances - The array of instances.
 */
function createButtonForEachInstance(instances) {
    // get the button container
    const buttonContainer= document.getElementById('buttonContainer')
    // clean the container
    Array.from(buttonContainer.childNodes).forEach(child => child.remove())
    // Populate the area
    instances.forEach((ins) => {
        const instanceUI = createInstanceUI(ins)
        console.log(instanceUI)
        buttonContainer.appendChild(instanceUI);
    });
}

/**
 * Creates the UI elements for a Twitch instance.
 *
 * @param {Object} ins - The Twitch instance object.
 * @param {number} ins.id - The index of the Twitch instance.
 * @param {string} ins.name - The name of the Twitch stream.
 *
 * @returns {HTMLDivElement} - The created HTML div element.
 */
function createInstanceUI(ins) {
    let outer  = document.createElement('div')
    outer.id = 'instance-'+ins.id
    outer.classList.add('instance')

    let streamer = document.createElement('h2')
    streamer.textContent = ins.name.replace(/\(.*?\)|- Twitch/g, "").trim()
    streamer.classList.add('streamer')

    let streamTitle = document.createElement('div')
    streamTitle.textContent = 'title'
    streamTitle.classList.add('stream-title')

    let focusButton = document.createElement('button')
    focusButton.setAttribute('data-id', ins.id)
    focusButton.classList.add('btn', 'btn-primary', 'instance-button')
    focusButton.onclick = () => ipcRenderer.send('focus-twitch-window', ins.id)
    focusButton.textContent = 'Show'
    focusButton.id = 'show-'+ins.id

    let muteUnmuteButton = document.createElement('button')
    muteUnmuteButton.setAttribute('data-id', ins.id)
    muteUnmuteButton.onclick = () => ipcRenderer.send('mute-unmute-twitch-window', ins.id)
    if (ins.muted) {
        muteUnmuteButton.classList.add('muted')
        muteUnmuteButton.textContent = 'Unmute'
        muteUnmuteButton.classList.add('btn', 'btn-warning', 'instance-button')
    } else {
        muteUnmuteButton.classList.remove('muted')
        muteUnmuteButton.textContent = 'Mute'
        muteUnmuteButton.classList.add('btn', 'btn-primary', 'instance-button')
    }
    muteUnmuteButton.id = 'mute-unmute-'+ins.id

    let closeButton = document.createElement('button')
    closeButton.setAttribute('data-id', ins.id)
    closeButton.classList.add('btn', 'btn-danger', 'instance-button')
    closeButton.onclick = () => ipcRenderer.send('close-twitch-window', ins.id)
    closeButton.textContent = 'Close'
    closeButton.id = 'close-'+ins.id

    outer.appendChild(streamer);
    // outer.appendChild(streamTitle);
    outer.appendChild(focusButton);
    outer.appendChild(muteUnmuteButton);
    outer.appendChild(closeButton);

    return outer
}

/*
 * ContextBridge
 */
contextBridge.exposeInMainWorld(
    "eapi",
    {
        /**
         * Creates a Twitch window.
         *
         * @returns {void}
         */
        createTwitchWindow: () => ipcRenderer.send('create-twitch-window'),
        /**
         * Refreshes the list of instances by invoking a function from the ipcRenderer module.
         *
         * @returns {void}
         */
        refreshInstances: () => {
            ipcRenderer.invoke('get-list-instances')
                .then((instances) => {
                    console.log('preload', instances)
                    createButtonForEachInstance(instances)
                })
                .catch((reason) => {
                    console.log(reason)
                })
        }
    }
);

/*
 * IPCs
 */
ipcRenderer.on('refresh', (evt, instances) =>{
    createButtonForEachInstance(instances)
})

/*
ipcRenderer.on('send-title', (evt, data) => {
    console.log(data)
    const [id, title] = data
    const streamTitle = document.getElementById('instance-'+id).querySelector('.stream-title')
    streamTitle.textContent = title
}
*/
