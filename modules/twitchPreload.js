const {ipcRenderer} = require('electron');

document.addEventListener('DOMContentLoaded', (event) => {
    /**
     * Create an observer on a DOM mutation
     * @type {MutationObserver}
     */
    const observer = new MutationObserver((mutationsList, observer) => {
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                ipcRenderer.send('call-refresh')
            }
        }
    });
    /*
     * Observe title modification
     */
    observer.observe(document.querySelector('title'), { childList: true });

});

