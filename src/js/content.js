import { sendLog } from './log';
import { exportChat } from './exportChat';

browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'checkChat') {
        const chatName = message.chatName.toLowerCase();
        const chatElements = document.querySelectorAll(`span[title]`);

        let found = false;
        chatElements.forEach(element => {
            if (element.title.toLowerCase() === chatName) {
                simulateClick(element);
                sendLog(`Chat dengan nama "${message.chatName}" ditemukan dan diklik.`);
                found = true;
                setTimeout(() => {
                    scrollChat();
                }, 2000);
            }
        });

        if (!found) {
            sendLog(`Chat dengan nama "${message.chatName}" tidak ditemukan.`);
        }
    } else if (message.action === 'scrollChat') {
        scrollChat();
    } else if (message.action === 'exportChat') {
        exportChat();
    } else if (message.action === 'uploadChat') {
        exportChat().then(chatData => {
            browser.runtime.sendMessage({ action: 'uploadChat', data: chatData });
        }).catch(error => sendLog(`Error exporting chat for upload: ${error}`));
    }
});

function simulateClick(element) {
    const mouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window
    };
    const mouseDownEvent = new MouseEvent('mousedown', mouseEventInit);
    const mouseUpEvent = new MouseEvent('mouseup', mouseEventInit);
    const clickEvent = new MouseEvent('click', mouseEventInit);

    element.dispatchEvent(mouseDownEvent);
    element.dispatchEvent(mouseUpEvent);
    element.dispatchEvent(clickEvent);
}

function scrollChat() {
    let chatContainerXPath = document.evaluate('id("main")/DIV[3]/DIV[1]/DIV[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (chatContainerXPath) {
        let scrollCount = 0;
        const maxScrolls = 10;

        let scrollInterval = setInterval(() => {
            chatContainerXPath.scrollBy(0, -window.innerHeight);

            scrollCount++;
            sendLog(`Scrolled up ${scrollCount} time(s).`);

            if (scrollCount >= maxScrolls) {
                clearInterval(scrollInterval);
                sendLog('Scrolling stopped.');
            }
        }, 1000);
    } else {
        sendLog('Chat container not found.');
    }
}
