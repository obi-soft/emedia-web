import { auth, db, storage } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const messagesEl = document.getElementById('messages');
const input = document.getElementById('msgText');
const fileInput = document.getElementById('msgFile');
const attachBtn = document.getElementById('attachBtn');
const sendBtn = document.getElementById('sendBtn');

let currentUser = null;

function appendMessage(m){
  const el = document.createElement('div');
  el.className = 'card';
  el.style.marginBottom = '8px';
  
  const who = document.createElement('div');
  who.style.fontWeight = '700';
  who.style.marginBottom = '4px';
  who.innerText = m.name || 'User';
  
  const time = document.createElement('div');
  time.style.fontSize = '12px';
  time.style.color = '#667789';
  time.style.marginBottom = '4px';
  time.innerText = m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleString() : '';
  
  const body = document.createElement('div');
  body.style.marginBottom = '4px';
  body.innerText = m.text || '';
  
  el.appendChild(who);
  el.appendChild(time);
  el.appendChild(body);
  
  if(m.fileUrl){
    const fileDiv = document.createElement('div');
    fileDiv.style.marginTop = '8px';
    const a = document.createElement('a');
    a.href = m.fileUrl;
    a.target = '_blank';
    a.innerText = m.fileName || 'Attachment';
    a.style.display = 'inline-block';
    a.style.padding = '8px';
    a.style.backgroundColor = '#f0f0f0';
    a.style.borderRadius = '4px';
    a.style.textDecoration = 'none';
    a.style.color = '#0066cc';
    fileDiv.appendChild(a);
    el.appendChild(fileDiv);
  }
  
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage(){
  const text = input.value.trim();
  const f = fileInput.files && fileInput.files[0];
  
  if(!text && !f){
    alert('Please enter a message or select a file');
    return;
  }
  
  sendBtn.disabled = true;
  
  try{
    let fileUrl = null;
    let fileName = null;
    
    if(f && storage){
      try {
        const path = `chat/${Date.now()}_${f.name}`;
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, f);
        fileUrl = await getDownloadURL(sRef);
        fileName = f.name;
      } catch (fileError) {
        console.error('File upload error:', fileError);
        alert('Failed to upload file: ' + fileError.message);
        sendBtn.disabled = false;
        return;
      }
    }
    
    if(db && currentUser){
      try {
        const messagesCol = collection(db, 'messages');
        const userName = currentUser.displayName || currentUser.email || 'Guest';
        await addDoc(messagesCol, {
          text: text || '',
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          uid: currentUser.uid,
          name: userName,
          email: currentUser.email,
          createdAt: serverTimestamp()
        });
        console.log('Message sent successfully');
        input.value = '';
        fileInput.value = '';
      } catch (dbError) {
        console.error('Database error:', dbError);
        alert('Failed to send message: ' + dbError.message);
      }
    } else {
      console.warn('Firebase not configured, saving locally');
      const local = JSON.parse(localStorage.getItem('localMessages') || '[]');
      const userName = currentUser ? (currentUser.displayName || currentUser.email || 'Guest') : 'Guest';
      local.push({
        text: text,
        fileUrl: fileUrl,
        fileName: fileName,
        name: userName,
        createdAt: Date.now()
      });
      localStorage.setItem('localMessages', JSON.stringify(local));
      appendMessage({
        text: text,
        fileUrl: fileUrl,
        fileName: fileName,
        name: userName,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      });
      input.value = '';
      fileInput.value = '';
    }
  } catch(e) {
    console.error('Error sending message:', e);
    alert('Error: ' + e.message);
  } finally {
    sendBtn.disabled = false;
  }
}

attachBtn.addEventListener('click', () => fileInput.click());
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});

if(db){
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
  onSnapshot(q, (snap) => {
    messagesEl.innerHTML = '';
    snap.forEach(doc => {
      const data = doc.data();
      appendMessage(Object.assign({id: doc.id}, data));
    });
  }, (error) => {
    console.error('Error listening to messages:', error);
  });
} else {
  console.warn('Firestore not initialized, loading local messages');
  const local = JSON.parse(localStorage.getItem('localMessages') || '[]');
  local.forEach(m => {
    appendMessage({
      text: m.text,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      name: m.name,
      createdAt: { seconds: Math.floor((m.createdAt || Date.now()) / 1000) }
    });
  });
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if(!user){
    console.warn('User not authenticated. Please log in to use chat.');
  }
});

export {};