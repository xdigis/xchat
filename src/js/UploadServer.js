import { sendLog } from './log';

export function uploadChat(data) {
    sendLog("Preparing to upload chat to server...");
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage({ action: 'uploadChat', data }, response => {
            if (response.status === "success") {
                sendLog("Chat uploaded successfully");
                resolve(response.data);
            } else {
                sendLog("Error uploading chat: " + response.error);
                reject(response.error);
            }
        });
    });
}
