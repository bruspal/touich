const {ipcRenderer, contextBridge} = require('electron');

// function createButtonForEachInstance() {
//     const instances = getTwitchInstances();
//     instances.forEach((instance) => {
//         let button = document.createElement('button');
//         button.innerHTML = 'Bring window';
//         button.onclick = () => ipcRenderer.send('bring-twitch-window', instance);
//         document.body.appendChild(button);
//     });
// }

contextBridge.exposeInMainWorld(
    "eapi",
    {
        createTwitchWindow: () => ipcRenderer.send('create-twitch-window'),
        refreshInstances: () => {
            ipcRenderer.invoke('get-list-instances')
                .then((instances) => {
                    console.log(instances)
                    //instances.forEach((ins) => {
                        /*
                        let button = document.createElement('button');
                        button.innerHTML = 'Bring window';
                        button.onclick = () => ipcRenderer.send('bring-twitch-window', ins);
                        document.body.appendChild(button);
                         */
                    //});
                })
                .catch((reason) => console.log(reason))
        }
    }
);



