// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Navigation
let navItems, pages, pageTitle, menuToggle, sidebar;

function initializeApp() {
    navItems = document.querySelectorAll('.nav-item');
    pages = document.querySelectorAll('.page');
    pageTitle = document.getElementById('pageTitle');
    menuToggle = document.getElementById('menuToggle');
    sidebar = document.querySelector('.sidebar');
    
    setupEventListeners();
    setupAuthForms();
    
    // Initialize source filter
    if (typeof sourceFilter !== 'undefined') {
        sourceFilter.init();
    }
    
    // Initialize notification manager
    if (typeof notificationManager !== 'undefined') {
        notificationManager.init();
    }
    
    // Initialize activity chart after a delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Initializing activity chart...');
        if (typeof activityChart !== 'undefined') {
            activityChart.init();
        } else {
            console.error('activityChart not defined');
        }
    }, 2000);
    
    // Start performance monitoring if enabled
    const settings = profileManager.loadSettings();
    if (settings.performanceMonitoring !== false) {
        performanceMonitor.start();
    }
    
    // Update system info periodically
    setInterval(() => {
        performanceMonitor.updateSystemInfo();
        updateMonitoringStats();
    }, 5000);
}

function setupEventListeners() {
    // Navigation handler
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');
            
            pageTitle.textContent = item.querySelector('span').textContent;
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Menu toggle for mobile
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        authManager.logout();
    });

}

function setupAuthForms() {
    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await authManager.login(email, password);
    });

    // Register form
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        await authManager.register(email, password, name);
    });

    // Toggle between login and register
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.login-container').style.display = 'none';
        document.querySelector('.register-container').style.display = 'block';
    });

    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.register-container').style.display = 'none';
        document.querySelector('.login-container').style.display = 'block';
    });

    // Source form
    document.getElementById('sourceForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const sourceId = document.getElementById('sourceId').value;
        const sourceData = {
            name: document.getElementById('sourceName').value,
            url: document.getElementById('sourceUrl').value,
            region: document.getElementById('sourceRegion').value,
            priority: parseInt(document.getElementById('sourcePriority').value) || 999
        };
        
        if (sourceId) {
            // Update existing source
            await dbManager.updateSource(sourceId, sourceData);
        } else {
            // Add new source
            await dbManager.addSource(sourceData);
        }
        
        closeSourceModal();
        e.target.reset();
    });
}

// Render sources from Firebase
function renderSources(sourcesList) {
    // Update filter manager with new sources
    sourceFilter.updateSources(sourcesList);
    updateDashboardStats();
}

// Source control functions
function toggleSource(id, enabled) {
    dbManager.toggleSourceEnabled(id, enabled);
}

function editSource(id) {
    const source = dbManager.sources.find(s => s.id === id);
    if (!source) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Source';
    document.getElementById('sourceId').value = id;
    document.getElementById('sourceName').value = source.name;
    document.getElementById('sourceUrl').value = source.url;
    document.getElementById('sourceRegion').value = source.region || '';
    document.getElementById('sourcePriority').value = source.priority || 999;
    document.getElementById('submitBtn').textContent = 'Update Source';
    
    document.getElementById('sourceModal').style.display = 'flex';
}

function deleteSource(id) {
    const source = dbManager.sources.find(s => s.id === id);
    if (!source) return;
    
    if (confirm(`Are you sure you want to delete '${source.name}'?\n\nThis action cannot be undone.`)) {
        dbManager.deleteSource(id);
    }
}

function copySourceUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showNotification('URL copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy URL', 'error');
    });
}

// Modal functions
function openAddSourceModal() {
    document.getElementById('modalTitle').textContent = 'Add New Source';
    document.getElementById('sourceId').value = '';
    document.getElementById('sourceForm').reset();
    document.getElementById('submitBtn').textContent = 'Add Source';
    document.getElementById('sourceModal').style.display = 'flex';
}

function closeSourceModal() {
    document.getElementById('sourceModal').style.display = 'none';
    document.getElementById('sourceForm').reset();
}

// Update dashboard stats
function updateDashboardStats(stats) {
    const sources = dbManager.sources || [];
    const activeSources = sources.filter(s => s.enabled).length;
    const disabledSources = sources.filter(s => !s.enabled).length;
    const totalSources = sources.length;
    const uniqueRegions = [...new Set(sources.map(s => s.region).filter(r => r))].length;
    
    document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = activeSources;
    document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = totalSources;
    document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = uniqueRegions;
    document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = disabledSources;
    
    // Update status text
    document.querySelector('.stat-card:nth-child(1) .stat-change').textContent = 
        activeSources > 0 ? `${activeSources} enabled` : 'No active sources';
}

// Render logs
function renderLogs(logs) {
    const logsContent = document.getElementById('logsContent');
    if (!logsContent) return;
    
    logsContent.innerHTML = '';
    
    if (!logs || logs.length === 0) {
        logsContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No logs available</p>';
        return;
    }
    
    logs.reverse().forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        const date = new Date(log.timestamp);
        const iconClass = log.type === 'success' ? 'check-circle' : log.type === 'warning' ? 'exclamation-circle' : 'info-circle';
        
        logItem.innerHTML = `
            <i class="fas fa-${iconClass} ${log.type}"></i>
            <div>
                <p>${log.message}</p>
                <span>${date.toLocaleString()} - ${log.user}</span>
            </div>
        `;
        logsContent.appendChild(logItem);
    });
}

// Export logs
function exportLogs() {
    const logs = dbManager.logs;
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `server-logs-${Date.now()}.json`;
    link.click();
    showNotification('Logs exported successfully', 'success');
}

// Notification system
function showNotification(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : 
                    type === 'warning' ? '#f59e0b' : 
                    type === 'error' ? '#ef4444' : '#3b82f6';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${bgColor};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


// Update monitoring stats
function updateMonitoringStats() {
    const sources = dbManager.sources || [];
    const totalSources = sources.length;
    const activeSources = sources.filter(s => s.enabled).length;
    
    const totalEl = document.getElementById('totalSourcesMonitor');
    const activeEl = document.getElementById('activeSourcesMonitor');
    
    if (totalEl) totalEl.textContent = totalSources;
    if (activeEl) activeEl.textContent = activeSources;
}
