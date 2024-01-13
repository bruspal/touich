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
    instances.forEach((ins) => {
        let button = document.createElement('button')
        button.innerHTML = 'Bring window '+ins.name
        button.onclick = () => ipcRenderer.send('bring-twitch-window', ins)
        buttonContainer.appendChild(button);
        console.log(button)
    });
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
ipcRenderer.on('refresh', (ev, instances) =>{
    createButtonForEachInstance(instances)
})
