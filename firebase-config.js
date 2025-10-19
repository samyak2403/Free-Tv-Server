// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDUhUqKHlb20kVz_1CEsFoFHuiXaew4Y9Q",
    authDomain: "free-tv-d2d7b.firebaseapp.com",
    databaseURL: "https://free-tv-d2d7b-default-rtdb.firebaseio.com",
    projectId: "free-tv-d2d7b",
    storageBucket: "free-tv-d2d7b.firebasestorage.app",
    messagingSenderId: "121536952419",
    appId: "1:121536952419:web:829eac63fe40a019016056",
    measurementId: "G-S0LB49TLSS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Database references
const sourcesRef = database.ref('sources');
const logsRef = database.ref('logs');
const statsRef = database.ref('stats');
const usersRef = database.ref('users');
