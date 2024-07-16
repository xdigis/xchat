export function logMessage(message) {
    console.log(message);
    saveLog(message);
}

export function saveLog(message) {
    let logs = JSON.parse(localStorage.getItem('logs')) || [];
    logs.push({ timestamp: new Date().toISOString(), message });
    localStorage.setItem('logs', JSON.stringify(logs));
}

export function sendLog(message) {
    browser.runtime.sendMessage({ action: 'log', content: message });
}
