import { sendLog } from './log';

export function exportChat() {
    sendLog("Starting chat export process");

    const chat = document.querySelectorAll(".message-in, .message-out");
    const chatData = [];
    const chatTitle = getActiveChatName();

    chat.forEach(function (message) {
        const userElement = message.querySelector(".copyable-text");
        const textElement = message.querySelector("span.selectable-text span");
        if (userElement && textElement) {
            const user = userElement.dataset.prePlainText;
            const text = textElement.innerText.trim();
            const userMatch = user.match(/\[(.*?)\] (.*?):/);
            if (userMatch) {
                const timestamp = userMatch[1];
                const contactInfo = userMatch[2];
                const contactMatch = contactInfo.match(/(\+[\d\s\-]+)/);
                const contact = contactMatch ? contactMatch[0] : null;
                const contactName = contact ? null : contactInfo;
                chatData.push({ date: timestamp, contactName: contactName, contactNumber: contact, pesan: text });
            }
        }
    });

    if (chatData.length === 0) {
        sendLog("No chat messages found to export");
        return;
    }

    const output = {
        title: chatTitle,
        messages: chatData
    };

    const now = new Date();
    const dateTimeString = now.toISOString().replace(/T/, ' ').replace(/:/g, '-').replace(/\..+/, '');
    const fileName = `${chatTitle} - ${dateTimeString}.json`;

    const jsonContent = JSON.stringify(output, null, 2);
    download(jsonContent, fileName, "application/json");

    // Simpan log export
    saveExportLog(chatTitle, fileName, dateTimeString);

    sendLog("Uploading chat to server...");
    return output; // Tambahkan return untuk mengembalikan data yang diekspor
}

function getActiveChatName() {
    const activeChatHeader = document.querySelector("header span[dir='auto'][aria-label='']");
    return activeChatHeader ? activeChatHeader.innerText : "Unknown Chat";
}

function download(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    sendLog(`File downloaded: ${fileName}`);
}

function saveExportLog(chatTitle, fileName, dateTimeString) {
    let exportLogs = JSON.parse(localStorage.getItem('exportLogs')) || [];
    console.log("Existing exportLogs:", exportLogs);
    exportLogs.push({ chatTitle, fileName, dateTime: dateTimeString });
    localStorage.setItem('exportLogs', JSON.stringify(exportLogs));
    console.log("New exportLogs:", exportLogs);
    sendLog(`Export log saved: ${chatTitle} - ${fileName} - ${dateTimeString}`);
    displayExportLogs();
}

function displayExportLogs() {
    const exportLogContainer = document.getElementById('exportLog');
    let exportLogs = JSON.parse(localStorage.getItem('exportLogs')) || [];
    console.log("Displaying exportLogs:", exportLogs);
    if (exportLogContainer) {
        exportLogContainer.innerHTML = exportLogs.map(log => `<div>${log.dateTime} - ${log.chatTitle} - ${log.fileName}</div>`).join('');
    }
}
