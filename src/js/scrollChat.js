export function simulateClick(element) {
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

export function scrollChat() {
    let chatContainerXPath = document.evaluate('id("main")/DIV[3]/DIV[1]/DIV[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (chatContainerXPath) {
        let scrollCount = 0;
        const maxScrolls = 10; // Jumlah pengguliran yang diinginkan

        let scrollInterval = setInterval(() => {
            chatContainerXPath.scrollBy(0, -window.innerHeight);

            scrollCount++;
            sendLog(`Scrolled up ${scrollCount} time(s).`);

            if (scrollCount >= maxScrolls) {
                clearInterval(scrollInterval);
                sendLog('Scrolling stopped.');
            }
        }, 1000); // Mengatur interval pengguliran setiap 1 detik
    } else {
        sendLog('Chat container not found.');
    }
}

function sendLog(message) {
    console.log(message);
    // Tambahkan mekanisme logging sesuai kebutuhan Anda, misalnya mengirim log ke background script
}
