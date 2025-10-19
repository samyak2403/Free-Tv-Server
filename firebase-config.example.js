// Firebase Configuration Example
// Copy this file to firebase-config.js and add your actual Firebase credentials

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Database references
const serversRef = database.ref('servers');
const logsRef = database.ref('logs');
const statsRef = database.ref('stats');
const usersRef = database.ref('users');
