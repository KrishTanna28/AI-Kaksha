// WebSocket connection
const socket = new WebSocket('ws://' + window.location.host + '/ws/chat/');
let mediaRecorder;
let audioChunks = [];
let currentRoom = 'General Discussion';
let username = localStorage.getItem('username') || 'Anonymous';

// DOM Elements
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const audioButton = document.getElementById('audio-button');
const chatMessages = document.getElementById('chat-messages');
const roomItems = document.querySelectorAll('.room-item');
const createRoomBtn = document.getElementById('create-room-btn');
const roomNameInput = document.getElementById('room-name');

// WebSocket event handlers
socket.onopen = () => {
    console.log('Connected to chat server');
    joinRoom(currentRoom);
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleMessage(data);
};

socket.onclose = () => {
    console.log('Disconnected from chat server');
};

// Message handling
function handleMessage(data) {
    switch(data.type) {
        case 'chat':
            addMessage(data.username, data.message, data.username === username);
            break;
        case 'audio':
            playAudioMessage(data.audio);
            break;
        case 'user_list':
            updateUserList(data.users);
            break;
        case 'room_list':
            updateRoomList(data.rooms);
            break;
    }
}

function addMessage(username, message, isSent) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.innerHTML = `
        <strong>${username}</strong><br>
        ${message}
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.send(JSON.stringify({
            type: 'chat',
            room: currentRoom,
            message: message,
            username: username
        }));
        messageInput.value = '';
    }
}

// Audio handling
async function toggleAudioRecording() {
    if (!mediaRecorder) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                sendAudioMessage(audioBlob);
                audioChunks = [];
            };

            audioButton.classList.add('recording');
            mediaRecorder.start();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Error accessing microphone. Please check permissions.');
        }
    } else {
        audioButton.classList.remove('recording');
        mediaRecorder.stop();
        mediaRecorder = null;
    }
}

function sendAudioMessage(audioBlob) {
    const reader = new FileReader();
    reader.onloadend = () => {
        socket.send(JSON.stringify({
            type: 'audio',
            room: currentRoom,
            audio: reader.result,
            username: username
        }));
    };
    reader.readAsDataURL(audioBlob);
}

function playAudioMessage(audioData) {
    const audio = new Audio(audioData);
    audio.play();
}

// Room management
function joinRoom(roomName) {
    socket.send(JSON.stringify({
        type: 'join_room',
        room: roomName,
        username: username
    }));
    currentRoom = roomName;
    chatMessages.innerHTML = ''; // Clear messages when changing rooms
}

function createRoom() {
    const roomName = roomNameInput.value.trim();
    if (roomName) {
        socket.send(JSON.stringify({
            type: 'create_room',
            room: roomName,
            username: username
        }));
        roomNameInput.value = '';
    }
}

function updateRoomList(rooms) {
    const roomList = document.querySelector('.room-list');
    roomList.innerHTML = rooms.map(room => `
        <div class="room-item ${room === currentRoom ? 'active' : ''}">${room}</div>
    `).join('');
    attachRoomListeners();
}

function updateUserList(users) {
    const userList = document.querySelector('.user-list');
    userList.innerHTML = `
        <h3>Online Users</h3>
        ${users.map(user => `
            <div class="user-item">
                <span class="user-status ${user.online ? '' : 'offline'}"></span>
                <span>${user.username}</span>
            </div>
        `).join('')}
    `;
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
audioButton.addEventListener('click', toggleAudioRecording);
createRoomBtn.addEventListener('click', createRoom);

function attachRoomListeners() {
    document.querySelectorAll('.room-item').forEach(item => {
        item.addEventListener('click', () => {
            joinRoom(item.textContent);
            document.querySelectorAll('.room-item').forEach(ri => ri.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

attachRoomListeners(); 