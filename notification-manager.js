// Notification Manager
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50;
        this.unreadCount = 0;
        this.isOpen = false;
    }

    init() {
        this.setupEventListeners();
        this.loadNotifications();
        this.startListening();
    }

    setupEventListeners() {
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.togglePanel();
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notificationPanel');
            const btn = document.getElementById('notificationBtn');
            if (panel && !panel.contains(e.target) && !btn.contains(e.target)) {
                this.closePanel();
            }
        });

        // Mark all as read
        const markAllBtn = document.getElementById('markAllRead');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // Clear all
        const clearAllBtn = document.getElementById('clearAllNotifications');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAll();
            });
        }
    }


    startListening() {
        // Listen to logs for notifications
        logsRef.limitToLast(50).on('child_added', (snapshot) => {
            const log = {
                id: snapshot.key,
                ...snapshot.val()
            };
            
            // Only add if it's a new log (within last 5 seconds)
            if (Date.now() - log.timestamp < 5000) {
                this.addNotification(log);
            }
        });
    }

    loadNotifications() {
        // Load recent logs as notifications
        logsRef.limitToLast(20).once('value', (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const log = {
                    id: childSnapshot.key,
                    ...childSnapshot.val(),
                    read: true // Mark old ones as read
                };
                this.notifications.unshift(log);
            });
            this.updateUI();
        });
    }

    addNotification(log) {
        const notification = {
            ...log,
            read: false
        };

        this.notifications.unshift(notification);
        
        // Keep only max notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        this.unreadCount++;
        this.updateUI();
        this.showToast(notification);
        this.playSound();
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.style.display = this.isOpen ? 'block' : 'none';
            if (this.isOpen) {
                this.renderNotifications();
            }
        }
    }

    closePanel() {
        this.isOpen = false;
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    renderNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;

        container.innerHTML = '';

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        this.notifications.forEach(notification => {
            const item = this.createNotificationItem(notification);
            container.appendChild(item);
        });
    }


    createNotificationItem(notification) {
        const item = document.createElement('div');
        item.className = `notification-item ${!notification.read ? 'unread' : ''}`;
        
        const iconClass = this.getIconClass(notification.type);
        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        item.innerHTML = `
            <div class="notification-icon ${notification.type}">
                <i class="fas fa-${iconClass}"></i>
            </div>
            <div class="notification-content">
                <p class="notification-message">${notification.message}</p>
                <span class="notification-time">${timeAgo}</span>
            </div>
            ${!notification.read ? '<div class="notification-dot"></div>' : ''}
        `;

        item.addEventListener('click', () => {
            this.markAsRead(notification.id);
        });

        return item;
    }

    getIconClass(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'error': return 'times-circle';
            default: return 'info-circle';
        }
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (seconds < 10) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateUI();
            this.renderNotifications();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.updateUI();
        this.renderNotifications();
        showNotification('All notifications marked as read', 'info');
    }

    clearAll() {
        if (confirm('Clear all notifications?')) {
            this.notifications = [];
            this.unreadCount = 0;
            this.updateUI();
            this.renderNotifications();
            showNotification('All notifications cleared', 'info');
        }
    }

    updateUI() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    showToast(notification) {
        // Use existing toast notification system
        const settings = profileManager.loadSettings();
        if (settings.showNotifications !== false) {
            showNotification(notification.message, notification.type);
        }
    }

    playSound() {
        // Play notification sound (optional)
        const settings = profileManager.loadSettings();
        if (settings.notificationSound) {
            // Future: Add sound playback
        }
    }
}

const notificationManager = new NotificationManager();
