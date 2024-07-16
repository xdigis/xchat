import '../css/styles.css';
import { checkChat } from './checkChat';
import './background';
import { logMessage } from './log';
import { exportChat } from './exportChat';

document.addEventListener('DOMContentLoaded', () => {
    const checkButton = document.getElementById('checkButton');
    const scrollButton = document.getElementById('scrollButton');
    const exportButton = document.getElementById('exportButton');
    const uploadButton = document.getElementById('uploadButton');
    const saveButton = document.getElementById('saveButton');
    const createMisiButton = document.getElementById('createMisiButton');
    const misiCheckButton = document.getElementById('misiCheckButton');
    const chatNameInput = document.getElementById('chatName');
    const misiNameInput = document.getElementById('misiName');
    const misiChatNameInput = document.getElementById('misiChatName');
    const exportIntervalInput = document.getElementById('exportInterval');
    const serverUrlInput = document.getElementById('serverUrl');
    const maxScrollInput = document.getElementById('maxScroll');
    const notif = document.getElementById('notif');
    const notifMisi = document.getElementById('notifMisi');
    let misiList = JSON.parse(localStorage.getItem('misiList')) || [];

    document.querySelectorAll('.xchat-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.xchat-menu-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            const page = item.getAttribute('data-page');
            document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
            document.getElementById(page).classList.add('active');

            if (page === 'list-misi') {
                displayMisiList();
            }
        });
    });

    // Load saved settings
    if (serverUrlInput) {
        serverUrlInput.value = localStorage.getItem('serverUrl') || '';
    }
    if (maxScrollInput) {
        maxScrollInput.value = localStorage.getItem('maxScroll') || '1';
    }

    if (checkButton) {
        checkButton.addEventListener('click', () => {
            const chatName = chatNameInput.value.trim();
            if (chatName) {
                logMessage(`Mencari chat dengan nama: ${chatName}`);
                browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                    const activeTab = tabs[0];
                    browser.tabs.sendMessage(activeTab.id, { action: 'checkChat', chatName }).catch(error => logMessage(`Error: ${error}`));
                }).catch(error => logMessage(`Error: ${error}`));
            } else {
                logMessage('Silakan masukkan nama chat.');
            }
        });
    }

    if (scrollButton) {
        scrollButton.addEventListener('click', () => {
            logMessage('Memulai scrolling chat');
            browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                const activeTab = tabs[0];
                browser.tabs.sendMessage(activeTab.id, { action: 'scrollChat', maxScroll: maxScrollInput.value }).catch(error => logMessage(`Error: ${error}`));
            }).catch(error => logMessage(`Error: ${error}`));
        });
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => {
            logMessage('Memulai export chat');
            browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                const activeTab = tabs[0];
                browser.tabs.sendMessage(activeTab.id, { action: 'exportChat' }).catch(error => logMessage(`Error: ${error}`));
            }).catch(error => logMessage(`Error: ${error}`));
        });
    }

    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            logMessage('Memulai upload chat');
            browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                const activeTab = tabs[0];
                browser.tabs.sendMessage(activeTab.id, { action: 'exportChat' })
                    .then(response => {
                        if (response && response.data) {
                            const serverUrl = localStorage.getItem('serverUrl');
                            const apiKey = 'EU1M2c2dpWcX16TVObTvqFLKVlX9gYR3QRNzxw1Q-Do'; // Hardcode API Key
                            if (!serverUrl) {
                                logMessage('Server URL tidak disetel.');
                                return;
                            }
                            browser.runtime.sendMessage({ action: 'uploadChat', data: response.data, serverUrl, apiKey })
                                .then(response => {
                                    if (response && response.status === 'success') {
                                        logMessage(`Chat uploaded successfully: ${JSON.stringify(response.data)}`);
                                    } else {
                                        logMessage(`Error uploading chat: ${response ? response.error : 'Unknown error'}`);
                                    }
                                })
                                .catch(error => logMessage(`Error: ${error}`));
                        } else {
                            logMessage(`Error exporting chat: ${response ? response.error : 'No data returned'}`);
                        }
                    })
                    .catch(error => logMessage(`Error: ${error}`));
            }).catch(error => logMessage(`Error: ${error}`));
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const serverUrl = serverUrlInput.value.trim();
            const maxScroll = maxScrollInput.value.trim();
            if (serverUrl) {
                localStorage.setItem('serverUrl', serverUrl);
            }
            if (maxScroll) {
                localStorage.setItem('maxScroll', maxScroll);
            }
            logMessage('Settings saved.');
        });
    }

    if (misiCheckButton) {
        misiCheckButton.addEventListener('click', () => {
            const chatName = misiChatNameInput.value.trim();
            if (chatName) {
                logMessage(`Mencari chat dengan nama: ${chatName}`);
                browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                    const activeTab = tabs[0];
                    browser.tabs.sendMessage(activeTab.id, { action: 'checkChat', chatName })
                        .then(response => {
                            if (response && response.found) {
                                notifMisi.textContent = `Chat dengan nama "${chatName}" ditemukan.`;
                                exportIntervalInput.disabled = false;
                                updateCreateMisiButtonState();
                            } else {
                                notifMisi.textContent = `Chat dengan nama "${chatName}" tidak ditemukan.`;
                                createMisiButton.disabled = true;
                            }
                        })
                        .catch(error => logMessage(`Error: ${error}`));
                }).catch(error => logMessage(`Error: ${error}`));
            } else {
                logMessage('Silakan masukkan nama chat.');
            }
        });
    }

    if (exportIntervalInput) {
        exportIntervalInput.addEventListener('input', updateCreateMisiButtonState);
    }

    if (createMisiButton) {
        createMisiButton.addEventListener('click', () => {
            const misiName = misiNameInput.value.trim();
            const chatName = misiChatNameInput.value.trim();
            const exportInterval = exportIntervalInput.value.trim();
            if (misiName && chatName && exportInterval) {
                const nextExportTime = Date.now() + (parseInt(exportInterval) * 60000);
                misiList.push({ name: misiName, chat: chatName, interval: exportInterval, nextExportTime, isActive: true });
                localStorage.setItem('misiList', JSON.stringify(misiList));
                displayMisiList();
                clearMisiForm();
                logMessage('Misi berhasil dibuat, memulai proses scroll, export, dan upload chat...');
                const serverUrl = localStorage.getItem('serverUrl');
                const maxScroll = localStorage.getItem('maxScroll') || '1';
                const apiKey = 'EU1M2c2dpWcX16TVObTvqFLKVlX9gYR3QRNzxw1Q-Do'; // Hardcode API Key
                browser.runtime.sendMessage({ action: 'processMisi', chatName, serverUrl, maxScroll, apiKey }, response => {
                    if (response.status === 'success') {
                        logMessage('Proses misi selesai.');
                    } else {
                        logMessage(`Error dalam proses misi: ${response.error}`);
                    }
                });
                const listMisiTab = document.querySelector('.xchat-menu-item[data-page="list-misi"]');
                if (listMisiTab) {
                    listMisiTab.click();
                }
            }
        });
    }

    function updateCreateMisiButtonState() {
        const misiName = misiNameInput.value.trim();
        const chatName = misiChatNameInput.value.trim();
        const exportInterval = exportIntervalInput.value.trim();
        createMisiButton.disabled = !(misiName && chatName && exportInterval);
    }

    function displayMisiList() {
        const misiListContainer = document.getElementById('misiList');
        if (misiListContainer) {
            misiListContainer.innerHTML = misiList.map(misi => `
                <div>
                    ${misi.name} - ${misi.chat} - ${misi.interval} menit
                    <span id="timer-${misi.name.replace(/\s+/g, '-')}"></span>
                    <label class="switch">
                        <input type="checkbox" class="toggle-timer" data-misi="${misi.name}" ${misi.isActive ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <button class="deleteMisiButton" data-misi="${misi.name}">Hapus Misi</button>
                </div>
            `).join('');

            misiList.forEach(misi => {
                const countdownData = JSON.parse(localStorage.getItem(`countdown_${misi.name}`)) || { timeLeft: misi.interval * 60000, initialDuration: misi.interval * 60000 };
                if (misi.isActive) {
                    browser.runtime.sendMessage({ action: 'startCountdown', misiName: misi.name, duration: countdownData.timeLeft });
                }
            });

            document.querySelectorAll('.deleteMisiButton').forEach(button => {
                button.addEventListener('click', (event) => {
                    const misiName = event.target.getAttribute('data-misi');
                    if (confirm(`Apakah Anda yakin ingin menghapus misi "${misiName}"?`)) {
                        deleteMisi(misiName);
                    }
                });
            });

            document.querySelectorAll('.toggle-timer').forEach(toggle => {
                toggle.addEventListener('change', (event) => {
                    const misiName = event.target.getAttribute('data-misi');
                    toggleTimer(misiName, event.target.checked);
                });
            });
        }
    }

    function clearMisiForm() {
        misiNameInput.value = '';
        misiChatNameInput.value = '';
        exportIntervalInput.value = '';
        exportIntervalInput.disabled = true;
        createMisiButton.disabled = true;
    }

    function deleteMisi(misiName) {
        misiList = misiList.filter(misi => misi.name !== misiName);
        localStorage.setItem('misiList', JSON.stringify(misiList));
        localStorage.removeItem(`countdown_${misiName}`);
        displayMisiList();
        logMessage(`Misi "${misiName}" berhasil dihapus.`);
    }

    function toggleTimer(misiName, isActive) {
        misiList = misiList.map(misi => {
            if (misi.name === misiName) {
                misi.isActive = isActive;
                if (isActive) {
                    const countdownData = JSON.parse(localStorage.getItem(`countdown_${misiName}`)) || { timeLeft: misi.interval * 60000, initialDuration: misi.interval * 60000 };
                    misi.nextExportTime = Date.now() + countdownData.timeLeft;
                    browser.runtime.sendMessage({ action: 'startCountdown', misiName: misi.name, duration: countdownData.timeLeft });
                } else {
                    browser.runtime.sendMessage({ action: 'stopCountdown', misiName: misi.name });
                }
            }
            return misi;
        });
        localStorage.setItem('misiList', JSON.stringify(misiList));
        logMessage(`Timer untuk misi "${misiName}" ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
    }

    browser.runtime.onMessage.addListener((message) => {
        if (message.action === 'log') {
            logMessage(message.content);
        } else if (message.action === 'checkChatResult') {
            if (message.found) {
                notifMisi.textContent = `Chat dengan nama "${message.chatName}" ditemukan.`;
                exportIntervalInput.disabled = false;
                updateCreateMisiButtonState();
            } else {
                notifMisi.textContent = `Chat dengan nama "${message.chatName}" tidak ditemukan.`;
                createMisiButton.disabled = true;
            }
        } else if (message.action === 'updateTimer') {
            const timerElement = document.getElementById(`timer-${message.misiName.replace(/\s+/g, '-')}`);
            if (timerElement) {
                const minutes = Math.floor(message.timeLeft / 60000);
                const seconds = Math.floor((message.timeLeft % 60000) / 1000);
                timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
        }
    });
});
