export function checkChat(chatName) {
    return new Promise((resolve, reject) => {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            const activeTab = tabs[0];
            browser.tabs.sendMessage(activeTab.id, { action: 'checkChat', chatName }).then((response) => {
                resolve(response.found);
            }).catch((error) => {
                reject(error);
            });
        }).catch((error) => {
            reject(error);
        });
    });
}
