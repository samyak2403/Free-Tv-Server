// Database Manager
class DatabaseManager {
    constructor() {
        this.sources = [];
        this.logs = [];
        this.stats = {};
        this.initListeners();
    }

    initListeners() {
        // Listen for source changes
        sourcesRef.on('value', (snapshot) => {
            this.sources = [];
            snapshot.forEach((childSnapshot) => {
                this.sources.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            // Sort by priority
            this.sources.sort((a, b) => (a.priority || 999) - (b.priority || 999));
            this.onSourcesUpdate();
        });

        // Listen for stats changes
        statsRef.on('value', (snapshot) => {
            this.stats = snapshot.val() || {};
            this.onStatsUpdate();
        });

        // Listen for logs (last 50)
        logsRef.limitToLast(50).on('value', (snapshot) => {
            this.logs = [];
            snapshot.forEach((childSnapshot) => {
                this.logs.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            this.onLogsUpdate();
        });
    }

    // Source operations
    generateSourceId(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    async addSource(sourceData) {
        try {
            const sourceId = this.generateSourceId(sourceData.name);
            
            // Check if source exists
            const snapshot = await sourcesRef.child(sourceId).once('value');
            if (snapshot.exists()) {
                showNotification('A source with this name already exists', 'warning');
                return null;
            }

            await sourcesRef.child(sourceId).set({
                url: sourceData.url,
                name: sourceData.name,
                enabled: true,
                priority: sourceData.priority || 999,
                region: sourceData.region || '',
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            
            await this.addLog('success', `Source ${sourceData.name} added`);
            showNotification('Source added successfully', 'success');
            return sourceId;
        } catch (error) {
            showNotification(`Failed to add source: ${error.message}`, 'error');
            throw error;
        }
    }

    async updateSource(sourceId, updates) {
        try {
            await sourcesRef.child(sourceId).update({
                ...updates,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            await this.addLog('info', `Source ${updates.name || sourceId} updated`);
            showNotification('Source updated successfully', 'success');
        } catch (error) {
            showNotification(`Failed to update source: ${error.message}`, 'error');
            throw error;
        }
    }

    async deleteSource(sourceId) {
        try {
            const snapshot = await sourcesRef.child(sourceId).once('value');
            const source = snapshot.val();
            
            await sourcesRef.child(sourceId).remove();
            await this.addLog('warning', `Source ${source.name} deleted`);
            showNotification('Source deleted successfully', 'success');
        } catch (error) {
            showNotification(`Failed to delete source: ${error.message}`, 'error');
            throw error;
        }
    }

    async toggleSourceEnabled(sourceId, enabled) {
        try {
            const snapshot = await sourcesRef.child(sourceId).once('value');
            const source = snapshot.val();
            
            await sourcesRef.child(sourceId).update({
                enabled: enabled,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            
            const status = enabled ? 'enabled' : 'disabled';
            await this.addLog('info', `Source ${source.name} ${status}`);
            showNotification(`Source ${status}`, 'success');
        } catch (error) {
            showNotification(`Failed to toggle source: ${error.message}`, 'error');
            throw error;
        }
    }

    // Stats operations
    async updateStats(statsData) {
        try {
            await statsRef.update({
                ...statsData,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    // Log operations
    async addLog(type, message) {
        try {
            await logsRef.push({
                type: type,
                message: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                user: authManager.currentUser?.email || 'System'
            });
        } catch (error) {
            console.error('Failed to add log:', error);
        }
    }

    // Callbacks
    onSourcesUpdate() {
        if (typeof renderSources === 'function') {
            renderSources(this.sources);
        }
        if (typeof updateMonitoringStats === 'function') {
            updateMonitoringStats();
        }
    }

    onStatsUpdate() {
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats(this.stats);
        }
    }

    onLogsUpdate() {
        if (typeof renderLogs === 'function') {
            renderLogs(this.logs);
        }
        // Update notification badge
        const badge = document.getElementById('notificationBadge');
        if (badge && this.logs.length > 0) {
            const recentLogs = this.logs.filter(log => {
                const logTime = log.timestamp;
                const now = Date.now();
                return (now - logTime) < 3600000; // Last hour
            });
            badge.textContent = recentLogs.length;
            badge.classList.toggle('active', recentLogs.length > 0);
        }
        // Update activity chart
        if (typeof activityChart !== 'undefined' && activityChart.refresh) {
            activityChart.refresh();
        }
    }
}

const dbManager = new DatabaseManager();
