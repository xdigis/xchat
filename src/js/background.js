import { sendLog } from './log';
import { exportChat } from './exportChat';

const API_KEY = 'EU1M2c2dpWcX16TVObTvqFLKVlX9gYR3QRNzxw1Q-Do';

let countdowns = {};

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkChat') {
        const chatName = message.chatName.toLowerCase();
        const chatElements = document.querySelectorAll(`span[title]`);

        let found = false;
        chatElements.forEach((element) => {
            if (element.title.toLowerCase() === chatName) {
                simulateClick(element);
                found = true;
            }
        });

        sendResponse({ found });
    } else if (message.action === 'scrollChat') {
        const maxScroll = message.maxScroll || 10;
        scrollChat(maxScroll).then(() => {
            sendLog('Scrolling stopped.');
            sendResponse({ status: 'success' });
        }).catch(error => {
            sendLog(`Error scrolling chat: ${error}`);
            sendResponse({ status: 'error', error: error.message });
        });
        return true;
    } else if (message.action === 'exportChat') {
        const chatData = exportChat();
        if (chatData) {
            sendResponse({ status: 'success', data: chatData });
        } else {
            sendResponse({ status: 'error', error: 'No chat data found' });
        }
        return true;
    } else if (message.action === 'uploadChat') {
        const { data, serverUrl, apiKey } = message;
        uploadChat(data, serverUrl, apiKey)
            .then(response => sendResponse({ status: 'success', data: response }))
            .catch(error => sendResponse({ status: 'error', error: error.message }));
        return true;
    } else if (message.action === 'processMisi') {
        const { chatName, serverUrl, maxScroll, apiKey } = message;
        processMisi(chatName, serverUrl, maxScroll, apiKey).then(() => {
            sendResponse({ status: 'success' });
        }).catch(error => {
            sendResponse({ status: 'error', error: error.message });
        });
        return true;
    } else if (message.action === 'startCountdown') {
        const { misiName, duration } = message;
        startCountdown(misiName, duration);
        sendResponse({ status: 'started' });
    } else if (message.action === 'stopCountdown') {
        const { misiName } = message;
        stopCountdown(misiName);
        sendResponse({ status: 'stopped' });
    }

    return true; // Keep the message channel open for async response
});

function simulateClick(element) {
    const mouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
    };
    const mouseDownEvent = new MouseEvent('mousedown', mouseEventInit);
    const mouseUpEvent = new MouseEvent('mouseup', mouseEventInit);
    const clickEvent = new MouseEvent('click', mouseEventInit);

    element.dispatchEvent(mouseDownEvent);
    element.dispatchEvent(mouseUpEvent);
    element.dispatchEvent(clickEvent);
}

function scrollChat(maxScroll) {
    return new Promise((resolve, reject) => {
        let chatContainerXPath = document.evaluate('id("main")/DIV[3]/DIV[1]/DIV[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (chatContainerXPath) {
            let scrollCount = 0;

            let scrollInterval = setInterval(() => {
                chatContainerXPath.scrollBy(0, -window.innerHeight);

                scrollCount++;
                sendLog(`Scrolled up ${scrollCount} time(s).`);

                if (scrollCount >= maxScroll) {
                    clearInterval(scrollInterval);
                    sendLog('Scrolling stopped.');
                    resolve();
                }
            }, 1000);
        } else {
            sendLog('Chat container not found.');
            reject(new Error('Chat container not found.'));
        }
    });
}

function uploadChat(data, serverUrl, apiKey) {
    sendLog("Background: Starting upload process");
    console.log("Background: Uploading chat with content:", JSON.stringify(data, null, 2));

    return fetch(serverUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        sendLog(`Background: Upload chat response status: ${response.status}`);
        if (!response.ok) {
            sendLog(`Background: Network response was not ok: ${response.statusText}`);
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log("Background: Server response:", data);
        sendLog(`Background: Server response: ${JSON.stringify(data)}`);
        return data;
    })
    .catch(error => {
        console.error("Background: Error uploading chat:", error);
        sendLog(`Background: Error uploading chat: ${error.message}`);
        throw error;
    });
}

function processMisi(chatName, serverUrl, maxScroll, apiKey) {
    return new Promise((resolve, reject) => {
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            const activeTab = tabs[0];
            sendLog(`Memulai proses scroll untuk chat: ${chatName}`);
            browser.tabs.sendMessage(activeTab.id, { action: 'scrollChat', maxScroll })
                .then(() => {
                    sendLog(`Scroll chat selesai untuk chat: ${chatName}`);
                    sendLog(`Memulai export chat: ${chatName}`);
                    return browser.tabs.sendMessage(activeTab.id, { action: 'exportChat' });
                })
                .then(response => {
                    if (response && response.data) {
                        sendLog(`Export chat selesai untuk chat: ${chatName}`);
                        if (!serverUrl) {
                            sendLog('Server URL tidak disetel.');
                            return;
                        }
                        sendLog(`Memulai upload chat: ${chatName}`);
                        return uploadChat(response.data, serverUrl, apiKey);
                    } else {
                        sendLog(`Error exporting chat: ${response ? response.error : 'No data returned'}`);
                        reject(new Error(response ? response.error : 'No data returned'));
                    }
                })
                .then(response => {
                    if (response) {
                        sendLog(`Chat uploaded successfully: ${JSON.stringify(response)}`);
                        resolve();
                    }
                })
                .catch(error => {
                    sendLog(`Error: ${error}`);
                    reject(error);
                });
        }).catch(error => sendLog(`Error: ${error}`));
    });
}

function startCountdown(misiName, duration) {
    if (countdowns[misiName]) {
        clearInterval(countdowns[misiName].interval);
    }

    let initialDuration;
    const savedCountdown = JSON.parse(localStorage.getItem(`countdown_${misiName}`));
    if (savedCountdown && savedCountdown.initialDuration) {
        initialDuration = savedCountdown.initialDuration; // Use saved initial duration
    } else {
        initialDuration = duration; // Set initial duration from provided duration
    }
    
    let timeLeft = duration;
    const updateInterval = 1000;
    const startTime = Date.now();
    localStorage.setItem(`countdown_${misiName}`, JSON.stringify({ startTime, timeLeft, initialDuration }));

    function update() {
        const countdownData = JSON.parse(localStorage.getItem(`countdown_${misiName}`));
        if (countdownData) {
            const elapsedTime = Date.now() - countdownData.startTime;
            timeLeft = countdownData.timeLeft - elapsedTime;

            if (timeLeft <= 0) {
                sendLog(`Timer untuk misi "${misiName}" selesai. Memulai ulang.`);
                timeLeft = countdownData.initialDuration; // Reset timer to initial duration
                localStorage.setItem(`countdown_${misiName}`, JSON.stringify({ startTime: Date.now(), timeLeft, initialDuration: countdownData.initialDuration }));
            } else {
                localStorage.setItem(`countdown_${misiName}`, JSON.stringify({ startTime: Date.now(), timeLeft, initialDuration: countdownData.initialDuration }));
            }
        }
        browser.runtime.sendMessage({ action: 'updateTimer', misiName: misiName, timeLeft: timeLeft });
    }

    update(); // Run the first update immediately
    countdowns[misiName] = {
        interval: setInterval(update, updateInterval),
        duration: initialDuration
    };
}

function stopCountdown(misiName) {
    if (countdowns[misiName]) {
        clearInterval(countdowns[misiName].interval);
        delete countdowns[misiName];
        localStorage.removeItem(`countdown_${misiName}`);
    }
}
