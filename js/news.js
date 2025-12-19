import { auth, db, storage } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const publishBtn = document.getElementById('publishBtn');
const titleEl = document.getElementById('postTitle');
const bodyEl = document.getElementById('postBody');
const tagsEl = document.getElementById('postTags');
const imageEl = document.getElementById('postImage');
const postsList = document.getElementById('postsList');
let currentUser = null;

function renderPost(p){
  const el = document.createElement('div'); el.className='featured-card';
  const head = document.createElement('div'); head.innerHTML = `<div class="featured-title">${p.title}</div><div class="featured-sub">by ${p.name||'User'} • ${p.tags?p.tags.join(', '):''}</div>`;
  el.appendChild(head);
  if(p.imageUrl){ const img = document.createElement('img'); img.src=p.imageUrl; img.style.width='100%'; img.style.borderRadius='8px'; img.style.marginTop='8px'; el.appendChild(img); }
  const b = document.createElement('div'); b.style.marginTop='8px'; b.innerText = p.body;
  el.appendChild(b);
  postsList.prepend(el);
}

async function publish(){
  const title = titleEl.value.trim();
  const body = bodyEl.value.trim();
  const tags = tagsEl.value.split(',').map(s=>s.trim()).filter(Boolean);
  const f = imageEl.files && imageEl.files[0];
  if(!title || !body){ alert('Please add title and body'); return; }
  publishBtn.disabled=true;
  try{
    let imageUrl=null;
    if(f && storage){
      const path = `posts/${Date.now()}_${f.name}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, f);
      imageUrl = await getDownloadURL(sRef);
    }
    const post = { title, body, tags, imageUrl: imageUrl || null, createdAt: serverTimestamp(), name: currentUser?.displayName || currentUser?.email || (localStorage.getItem('user')?JSON.parse(localStorage.getItem('user')).username:'Guest') };
    if(db){
      await addDoc(collection(db,'posts'), post);
    } else {
      const local = JSON.parse(localStorage.getItem('localPosts')||'[]');
      local.push(Object.assign({}, post, {createdAt: Date.now()}));
      localStorage.setItem('localPosts', JSON.stringify(local));
      renderPost(post);
    }
  }catch(e){console.error(e)}
  titleEl.value=''; bodyEl.value=''; tagsEl.value=''; imageEl.value=null; publishBtn.disabled=false;
}

publishBtn.addEventListener('click', publish);

if(db){
  const q = query(collection(db,'posts'), orderBy('createdAt','desc'));
  onSnapshot(q, snap=>{
    postsList.innerHTML='';
    snap.forEach(doc=>{ renderPost(Object.assign({id:doc.id}, doc.data())); });
  });
} else {
  const local = JSON.parse(localStorage.getItem('localPosts')||'[]');
  local.forEach(p=>renderPost(p));
}

onAuthStateChanged(auth, u=>{ currentUser = u; });

export {};
