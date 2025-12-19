import { auth } from './firebase.js';
import {
signInWithEmailAndPassword,
createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


window.login = function () {
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;


signInWithEmailAndPassword(auth, email, password)
.then(() => window.location = 'home.html')
.catch(err => alert(err.message));
};


window.register = function () {
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;


createUserWithEmailAndPassword(auth, email, password)
.then(() => window.location = 'home.html')
.catch(err => alert(err.message));
};