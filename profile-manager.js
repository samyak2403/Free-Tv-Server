// Profile Manager
class ProfileManager {
    constructor() {
        this.userProfile = null;
    }

    async loadProfile() {
        if (!authManager.currentUser) return;

        try {
            const snapshot = await usersRef.child(authManager.currentUser.uid).once('value');
            this.userProfile = snapshot.val() || {};
            this.updateProfileUI();
            this.updateAccountInfo();
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    updateProfileUI() {
        const user = authManager.currentUser;
        if (!user) return;

        // Update profile form
        const nameField = document.getElementById('profileName');
        const emailField = document.getElementById('profileEmail');
        const phoneField = document.getElementById('profilePhone');
        const bioField = document.getElementById('profileBio');

        if (nameField) nameField.value = user.displayName || '';
        if (emailField) emailField.value = user.email || '';
        if (phoneField) phoneField.value = this.userProfile.phone || '';
        if (bioField) bioField.value = this.userProfile.bio || '';
    }

    updateAccountInfo() {
        const user = authManager.currentUser;
        if (!user) return;

        const userIdEl = document.getElementById('userId');
        const accountCreatedEl = document.getElementById('accountCreated');
        const lastSignInEl = document.getElementById('lastSignIn');
        const emailVerifiedEl = document.getElementById('emailVerified');
        const lastLoginEl = document.getElementById('lastLogin');

        if (userIdEl) userIdEl.textContent = user.uid.substring(0, 20) + '...';
        if (accountCreatedEl) {
            const created = user.metadata.creationTime;
            accountCreatedEl.textContent = created ? new Date(created).toLocaleDateString() : 'Unknown';
        }
        if (lastSignInEl) {
            const lastSignIn = user.metadata.lastSignInTime;
            lastSignInEl.textContent = lastSignIn ? new Date(lastSignIn).toLocaleString() : 'Unknown';
        }
        if (lastLoginEl) {
            const lastSignIn = user.metadata.lastSignInTime;
            lastLoginEl.textContent = lastSignIn ? new Date(lastSignIn).toLocaleString() : 'Unknown';
        }
        if (emailVerifiedEl) {
            emailVerifiedEl.textContent = user.emailVerified ? '✅ Yes' : '❌ No';
            emailVerifiedEl.style.color = user.emailVerified ? 'var(--success-color)' : 'var(--danger-color)';
        }

        // Show/hide verify button
        const verifyBtn = document.getElementById('verifyEmailBtn');
        if (verifyBtn) {
            verifyBtn.style.display = user.emailVerified ? 'none' : 'block';
        }
    }

    async updateProfile(profileData) {
        if (!authManager.currentUser) return;

        try {
            // Update display name in Firebase Auth
            await authManager.currentUser.updateProfile({
                displayName: profileData.name
            });

            // Update profile in database
            await usersRef.child(authManager.currentUser.uid).update({
                displayName: profileData.name,
                phone: profileData.phone || '',
                bio: profileData.bio || '',
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });

            // Update local profile
            this.userProfile = {
                ...this.userProfile,
                displayName: profileData.name,
                phone: profileData.phone,
                bio: profileData.bio
            };

            // Update sidebar
            document.querySelector('.user-info span').textContent = profileData.name;

            showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            showNotification(`Failed to update profile: ${error.message}`, 'error');
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        if (!authManager.currentUser) return;

        try {
            // Re-authenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                authManager.currentUser.email,
                currentPassword
            );
            await authManager.currentUser.reauthenticateWithCredential(credential);

            // Update password
            await authManager.currentUser.updatePassword(newPassword);

            showNotification('Password changed successfully!', 'success');
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                showNotification('Current password is incorrect', 'error');
            } else {
                showNotification(`Failed to change password: ${error.message}`, 'error');
            }
            throw error;
        }
    }

    async sendVerificationEmail() {
        if (!authManager.currentUser) return;

        try {
            await authManager.currentUser.sendEmailVerification();
            showNotification('Verification email sent! Please check your inbox.', 'success');
        } catch (error) {
            showNotification(`Failed to send verification email: ${error.message}`, 'error');
            throw error;
        }
    }

    setupProfileEventListeners() {
        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const profileData = {
                    name: document.getElementById('profileName').value,
                    phone: document.getElementById('profilePhone').value,
                    bio: document.getElementById('profileBio').value
                };
                await this.updateProfile(profileData);
            });
        }

        // Password form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (newPassword !== confirmPassword) {
                    showNotification('Passwords do not match!', 'error');
                    return;
                }

                if (newPassword.length < 6) {
                    showNotification('Password must be at least 6 characters', 'error');
                    return;
                }

                await this.changePassword(currentPassword, newPassword);
                passwordForm.reset();
            });
        }

        // Verify email button
        const verifyBtn = document.getElementById('verifyEmailBtn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', async () => {
                await this.sendVerificationEmail();
            });
        }

        // Profile button in header
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                // Navigate to settings page
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-page') === 'settings') {
                        item.classList.add('active');
                    }
                });
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                document.getElementById('settings').classList.add('active');
                document.getElementById('pageTitle').textContent = 'Settings';
            });
        }

        // App settings toggles
        this.setupAppSettings();
    }

    setupAppSettings() {
        const autoRefresh = document.getElementById('autoRefresh');
        const showNotifications = document.getElementById('showNotifications');
        const compactView = document.getElementById('compactView');
        const performanceMonitoring = document.getElementById('performanceMonitoring');

        // Load saved settings
        const settings = this.loadSettings();
        if (autoRefresh) autoRefresh.checked = settings.autoRefresh !== false;
        if (showNotifications) showNotifications.checked = settings.showNotifications !== false;
        if (compactView) compactView.checked = settings.compactView === true;
        if (performanceMonitoring) performanceMonitoring.checked = settings.performanceMonitoring !== false;

        // Save settings on change
        if (autoRefresh) {
            autoRefresh.addEventListener('change', (e) => {
                this.saveSetting('autoRefresh', e.target.checked);
            });
        }

        if (showNotifications) {
            showNotifications.addEventListener('change', (e) => {
                this.saveSetting('showNotifications', e.target.checked);
            });
        }

        if (compactView) {
            compactView.addEventListener('change', (e) => {
                this.saveSetting('compactView', e.target.checked);
                this.applyCompactView(e.target.checked);
            });
        }

        if (performanceMonitoring) {
            performanceMonitoring.addEventListener('change', (e) => {
                this.saveSetting('performanceMonitoring', e.target.checked);
                if (e.target.checked) {
                    performanceMonitor.start();
                } else {
                    performanceMonitor.stop();
                }
            });
        }
    }

    loadSettings() {
        const settings = localStorage.getItem('appSettings');
        return settings ? JSON.parse(settings) : {};
    }

    saveSetting(key, value) {
        const settings = this.loadSettings();
        settings[key] = value;
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }

    applyCompactView(enabled) {
        const sourcesGrid = document.querySelector('.sources-grid');
        if (sourcesGrid) {
            if (enabled) {
                sourcesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
            } else {
                sourcesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
            }
        }
    }
}

const profileManager = new ProfileManager();
