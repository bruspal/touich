const {ipcRenderer, contextBridge} = require('electron');

function createButtonForEachInstance(instances) {
    // get the button container
    const buttonContainer= document.getElementById('buttonContainer')
    // clean the container
    Array.from(buttonContainer.childNodes).forEach(child => child.remove())
    instances.forEach((ins) => {
        let button = document.createElement('button')
        button.innerHTML = 'Bring window '+ins
        button.onclick = () => ipcRenderer.send('bring-twitch-window', ins)
        buttonContainer.appendChild(button);
        console.log(button)
    });
}

contextBridge.exposeInMainWorld(
    "eapi",
    {
        createTwitchWindow: () => ipcRenderer.send('create-twitch-window'),
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



