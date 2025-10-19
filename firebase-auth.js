// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initAuthListener();
    }

    initAuthListener() {
        auth.onAuthStateChanged((user) => {
            console.log('Auth state changed:', user ? user.email : 'No user');
            
            if (user) {
                this.currentUser = user;
                this.onAuthSuccess(user);
            } else {
                this.currentUser = null;
                this.showLoginPage();
            }
        });
    }

    async login(email, password) {
        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // Attempt login
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            console.log('Login successful:', userCredential.user.email);
            showNotification('Login successful!', 'success');
            
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            
            // User-friendly error messages
            let errorMessage = 'Login failed';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Check your internet connection';
                    break;
                default:
                    errorMessage = error.message || 'Login failed. Please try again';
            }
            
            showNotification(errorMessage, 'error');
            throw error;
        }
    }

    async register(email, password, displayName) {
        try {
            console.log('Registering user:', email, 'with name:', displayName);
            
            // Create user account
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with display name
            await userCredential.user.updateProfile({ 
                displayName: displayName 
            });
            
            console.log('Profile updated with display name:', displayName);
            
            // Create user profile in database
            await usersRef.child(userCredential.user.uid).set({
                email: email,
                displayName: displayName,
                role: 'user',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log('User profile created in database');
            
            // Reload user to get updated profile
            await userCredential.user.reload();
            
            showNotification('Registration successful!', 'success');
            return userCredential.user;
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(`Registration failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async logout() {
        try {
            await auth.signOut();
            showNotification('Logged out successfully', 'info');
        } catch (error) {
            showNotification(`Logout failed: ${error.message}`, 'error');
        }
    }

    async onAuthSuccess(user) {
        console.log('Auth success, showing main app');
        console.log('User display name:', user.displayName);
        console.log('User email:', user.email);
        
        // Reload user to ensure we have latest profile data
        await user.reload();
        
        const loginPage = document.getElementById('loginPage');
        const container = document.querySelector('.container');
        const userDisplayName = document.getElementById('userDisplayName');
        
        if (loginPage) loginPage.style.display = 'none';
        if (container) container.style.display = 'flex';
        
        // Set display name with fallback
        if (userDisplayName) {
            const displayName = user.displayName || user.email.split('@')[0];
            userDisplayName.textContent = displayName;
            console.log('Display name set to:', displayName);
        }
        
        // Load user data from database
        await this.loadUserData(user.uid);
        
        // Load profile
        if (typeof profileManager !== 'undefined') {
            profileManager.loadProfile();
            profileManager.setupProfileEventListeners();
        }
    }

    showLoginPage() {
        console.log('Showing login page');
        
        const loginPage = document.getElementById('loginPage');
        const container = document.querySelector('.container');
        
        if (loginPage) loginPage.style.display = 'flex';
        if (container) container.style.display = 'none';
    }

    async loadUserData(uid) {
        try {
            const snapshot = await usersRef.child(uid).once('value');
            const userData = snapshot.val();
            
            if (userData) {
                console.log('User data loaded from database:', userData);
                
                // Update display name if available in database
                const userDisplayName = document.getElementById('userDisplayName');
                if (userDisplayName && userData.displayName) {
                    userDisplayName.textContent = userData.displayName;
                    console.log('Display name updated from database:', userData.displayName);
                }
                
                // Update current user display name if different
                if (this.currentUser && userData.displayName && this.currentUser.displayName !== userData.displayName) {
                    await this.currentUser.updateProfile({
                        displayName: userData.displayName
                    });
                    await this.currentUser.reload();
                    console.log('Firebase Auth profile updated with database name');
                }
            } else {
                console.log('No user data found in database for uid:', uid);
                
                // Create user data in database if it doesn't exist
                if (this.currentUser) {
                    await usersRef.child(uid).set({
                        email: this.currentUser.email,
                        displayName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
                        role: 'user',
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        updatedAt: firebase.database.ServerValue.TIMESTAMP
                    });
                    console.log('Created user data in database');
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
}

const authManager = new AuthManager();
