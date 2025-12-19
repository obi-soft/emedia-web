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
  const who = document.createElement('div'); who.style.fontWeight='700'; who.innerText = m.name || 'User';
  const time = document.createElement('div'); time.style.fontSize='12px'; time.style.color='#667789'; time.innerText = m.createdAt?new Date(m.createdAt.seconds*1000).toLocaleString():'';
  const body = document.createElement('div'); body.innerText = m.text || '';
  el.appendChild(who);
  if(m.fileUrl){
    const a = document.createElement('a'); a.href = m.fileUrl; a.target='_blank'; a.innerText = m.fileName || 'Attachment'; a.style.display='block'; a.style.margin='8px 0'; el.appendChild(a);
  }
  el.appendChild(body);
  el.appendChild(time);
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage(){
  const text = input.value.trim();
  const f = fileInput.files && fileInput.files[0];
  if(!text && !f) return;
  sendBtn.disabled = true;
  try{
    let fileUrl = null, fileName = null;
    if(f && storage){
      const path = `chat/${Date.now()}_${f.name}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, f);
      fileUrl = await getDownloadURL(sRef);
      fileName = f.name;
    }
    if(db){
      const messagesCol = collection(db, 'messages');
      await addDoc(messagesCol, {
        text: text || '',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        uid: currentUser?.uid || null,
        name: currentUser?.displayName || currentUser?.email || localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')||'{}').username : 'Guest',
        createdAt: serverTimestamp()
      });
    } else {
      // fallback: save locally
      const local = JSON.parse(localStorage.getItem('localMessages')||'[]');
      local.push({text,fileUrl,fileName,name:localStorage.getItem('user')?JSON.parse(localStorage.getItem('user')).username:'Guest',createdAt:Date.now()});
      localStorage.setItem('localMessages', JSON.stringify(local));
      appendMessage({text,fileUrl,fileName,name:localStorage.getItem('user')?JSON.parse(localStorage.getItem('user')).username:'Guest',createdAt:{seconds:Math.floor(Date.now()/1000)}});
    }
  }catch(e){console.error(e)}
  input.value=''; fileInput.value=''; sendBtn.disabled=false;
}

attachBtn.addEventListener('click', ()=> fileInput.click());
sendBtn.addEventListener('click', sendMessage);

// listen for messages
if(db){
  const q = query(collection(db,'messages'), orderBy('createdAt','asc'));
  onSnapshot(q, snap=>{
    messagesEl.innerHTML='';
    snap.forEach(doc=>{
      appendMessage(Object.assign({id:doc.id}, doc.data()));
    });
  });
} else {
  // local fallback
  const local = JSON.parse(localStorage.getItem('localMessages')||'[]');
  local.forEach(m=>appendMessage({text:m.text,fileUrl:m.fileUrl,fileName:m.fileName,name:m.name,createdAt:{seconds:Math.floor((m.createdAt||Date.now())/1000)}}));
}

onAuthStateChanged(auth, user=>{
  currentUser = user;
});

// allow Enter to send
input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); sendMessage(); } });

export {};
