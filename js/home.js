import { auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


onAuthStateChanged(auth, user => {
if (!user) {
window.location = 'index.html';
} else {
document.getElementById('username').innerText = 'Welcome User';
document.getElementById('email').innerText = user.email;
}
});