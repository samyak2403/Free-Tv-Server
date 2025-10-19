// Activity Chart Manager - Real-time Edition
class ActivityChartManager {
    constructor() {
        this.chart = null;
        this.activityData = {
            added: [],
            enabled: [],
            disabled: [],
            deleted: [],
            timestamps: []
        };
        this.maxDataPoints = 10;
        this.colors = {
            added: '#10b981',      // Green
            enabled: '#3b82f6',    // Blue
            disabled: '#f59e0b',   // Orange
            deleted: '#ef4444'     // Red
        };
        this.isLive = false;
        this.lastLogCount = 0;
    }

    init() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;

        this.isLive = true;
        this.loadActivityData();
        this.setupActivityListener();
        this.drawChart();
        this.startRealTimeUpdates();
    }

    loadActivityData() {
        // Initialize with zeros
        const now = new Date();
        for (let i = this.maxDataPoints - 1; i >= 0; i--) {
            const time = new Date(now - i * 3600000); // Hours ago
            this.activityData.timestamps.push(time.getHours() + ':00');
            this.activityData.added.push(0);
            this.activityData.enabled.push(0);
            this.activityData.disabled.push(0);
            this.activityData.deleted.push(0);
        }
    }

    setupActivityListener() {
        // Listen to logs in real-time
        logsRef.limitToLast(100).on('value', (snapshot) => {
            const currentCount = snapshot.numChildren();
            const isNewActivity = currentCount > this.lastLogCount && this.lastLogCount > 0;
            
            this.processLogs(snapshot);
            
            if (isNewActivity) {
                this.animateChart();
                this.showActivityPulse();
            } else {
                this.drawChart();
            }
            
            this.updateActivityFeed();
            this.lastLogCount = currentCount;
        });
    }

    processLogs(snapshot) {
        const logs = [];
        snapshot.forEach((childSnapshot) => {
            logs.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        // Reset counters
        this.activityData.added = new Array(this.maxDataPoints).fill(0);
        this.activityData.enabled = new Array(this.maxDataPoints).fill(0);
        this.activityData.disabled = new Array(this.maxDataPoints).fill(0);
        this.activityData.deleted = new Array(this.maxDataPoints).fill(0);

        // Process logs by hour
        const now = Date.now();
        logs.forEach(log => {
            if (!log.timestamp) return;
            
            const logTime = log.timestamp;
            const hoursAgo = Math.floor((now - logTime) / 3600000);
            
            if (hoursAgo < this.maxDataPoints) {
                const index = this.maxDataPoints - 1 - hoursAgo;
                
                if (log.message.includes('added')) {
                    this.activityData.added[index]++;
                } else if (log.message.includes('enabled')) {
                    this.activityData.enabled[index]++;
                } else if (log.message.includes('disabled')) {
                    this.activityData.disabled[index]++;
                } else if (log.message.includes('deleted')) {
                    this.activityData.deleted[index]++;
                }
            }
        });

        // Update timestamps
        const currentTime = new Date();
        this.activityData.timestamps = [];
        for (let i = this.maxDataPoints - 1; i >= 0; i--) {
            const time = new Date(currentTime - i * 3600000);
            this.activityData.timestamps.push(time.getHours() + ':00');
        }
    }

    drawChart() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;

        // Set canvas size for high DPI displays
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;

        // Enable anti-aliasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Define margins for proper alignment
        this.margins = {
            top: 50,
            right: 20,
            bottom: 50,
            left: 60
        };

        // Calculate chart area
        this.chartWidth = width - this.margins.left - this.margins.right;
        this.chartHeight = height - this.margins.top - this.margins.bottom;

        // Find max value for scaling
        const maxValue = Math.max(
            ...this.activityData.added,
            ...this.activityData.enabled,
            ...this.activityData.disabled,
            ...this.activityData.deleted,
            5 // Minimum scale
        );

        // Draw background gradient
        this.drawBackground(ctx, width, height);

        // Draw grid with proper alignment
        this.drawGrid(ctx, maxValue);

        // Draw bars with proper alignment
        this.drawBars(ctx, maxValue);

        // Draw legend with better styling
        this.drawLegend(ctx, width);

        // Draw labels with proper alignment
        this.drawLabels(ctx);

        // Draw live indicator
        this.drawLiveIndicator(ctx, width, height);

        // Draw total count
        this.drawTotalCount(ctx);
    }

    drawBackground(ctx, width, height) {
        // Subtle gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.02)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.08)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    animateChart() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;

        canvas.style.animation = 'chartUpdate 0.5s ease';
        setTimeout(() => {
            canvas.style.animation = '';
        }, 500);

        this.drawChart();
    }

    showActivityPulse() {
        const activityCard = document.querySelector('.activity-card');
        if (!activityCard) return;

        activityCard.style.animation = 'pulse 0.5s ease';
        setTimeout(() => {
            activityCard.style.animation = '';
        }, 500);
    }

    drawLiveIndicator(ctx, width, height) {
        const x = width - 65;
        const y = height - 20;

        // Pulsing circle with glow
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;

        // Outer glow
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12 * pulse;
        ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner circle
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // "LIVE" text with background
        const text = 'LIVE';
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const textWidth = ctx.measureText(text).width;
        
        // Text background
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        this.roundRect(ctx, x + 8, y - 7, textWidth + 10, 14, 7);
        
        // Text
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + 13, y);
    }

    drawGrid(ctx, maxValue) {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
        ctx.lineWidth = 1;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

        const gridLines = 5;
        
        // Horizontal grid lines
        for (let i = 0; i <= gridLines; i++) {
            const y = this.margins.top + (this.chartHeight / gridLines) * i;
            
            // Dashed line
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.beginPath();
            ctx.moveTo(this.margins.left, y);
            ctx.lineTo(this.margins.left + this.chartWidth, y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Y-axis labels
            const value = Math.round(maxValue * (1 - i / gridLines));
            const text = value.toString();
            
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, this.margins.left - 10, y);
        }

        // Y-axis line
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.margins.left, this.margins.top);
        ctx.lineTo(this.margins.left, this.margins.top + this.chartHeight);
        ctx.stroke();

        // X-axis line
        ctx.beginPath();
        ctx.moveTo(this.margins.left, this.margins.top + this.chartHeight);
        ctx.lineTo(this.margins.left + this.chartWidth, this.margins.top + this.chartHeight);
        ctx.stroke();
    }

    drawBars(ctx, maxValue) {
        const dataLength = this.activityData.timestamps.length;
        const groupWidth = this.chartWidth / dataLength;
        const barWidth = groupWidth / 5; // 4 bars + spacing
        const groupPadding = barWidth * 0.5;

        for (let i = 0; i < dataLength; i++) {
            const groupX = this.margins.left + i * groupWidth + groupPadding;

            this.drawBar(ctx, groupX, barWidth, this.activityData.added[i], maxValue, this.colors.added);
            this.drawBar(ctx, groupX + barWidth, barWidth, this.activityData.enabled[i], maxValue, this.colors.enabled);
            this.drawBar(ctx, groupX + barWidth * 2, barWidth, this.activityData.disabled[i], maxValue, this.colors.disabled);
            this.drawBar(ctx, groupX + barWidth * 3, barWidth, this.activityData.deleted[i], maxValue, this.colors.deleted);
        }
    }

    drawBar(ctx, x, barWidth, value, maxValue, color) {
        if (value === 0) return;

        const barHeight = (value / maxValue) * this.chartHeight;
        const y = this.margins.top + this.chartHeight - barHeight;

        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.adjustColor(color, -20));
        
        ctx.fillStyle = gradient;
        
        // Rounded rectangle
        this.roundRect(ctx, x, y, barWidth, barHeight, 4);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw value on top
        if (value > 0 && barHeight > 20) {
            const text = value.toString();
            
            // Value background circle
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.beginPath();
            ctx.arc(x + barWidth / 2, y - 10, 9, 0, Math.PI * 2);
            ctx.fill();
            
            // Value text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x + barWidth / 2, y - 10);
        }

        // Add glow effect for high values
        if (value >= maxValue * 0.7) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            this.roundRect(ctx, x, y, barWidth, barHeight, 4);
            ctx.shadowBlur = 0;
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    drawLegend(ctx, width) {
        const legendX = width - 155;
        const legendY = 15;
        const boxSize = 12;
        const spacing = 22;

        // Legend background
        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        this.roundRect(ctx, legendX - 8, legendY - 8, 147, 96, 8);
        ctx.shadowBlur = 0;

        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const items = [
            { label: 'Added', color: this.colors.added, count: this.activityData.added.reduce((a, b) => a + b, 0) },
            { label: 'Enabled', color: this.colors.enabled, count: this.activityData.enabled.reduce((a, b) => a + b, 0) },
            { label: 'Disabled', color: this.colors.disabled, count: this.activityData.disabled.reduce((a, b) => a + b, 0) },
            { label: 'Deleted', color: this.colors.deleted, count: this.activityData.deleted.reduce((a, b) => a + b, 0) }
        ];

        items.forEach((item, index) => {
            const y = legendY + index * spacing + 6;
            
            // Color box with gradient
            const gradient = ctx.createLinearGradient(legendX, y - 6, legendX + boxSize, y + 6);
            gradient.addColorStop(0, item.color);
            gradient.addColorStop(1, this.adjustColor(item.color, -20));
            ctx.fillStyle = gradient;
            this.roundRect(ctx, legendX, y - 6, boxSize, boxSize, 3);
            
            // Label
            ctx.fillStyle = '#f1f5f9';
            ctx.fillText(item.label, legendX + boxSize + 6, y);
            
            // Count
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`(${item.count})`, legendX + 135, y);
            ctx.textAlign = 'left';
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        });
    }

    drawLabels(ctx) {
        const dataLength = this.activityData.timestamps.length;
        const groupWidth = this.chartWidth / dataLength;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw time labels
        for (let i = 0; i < dataLength; i++) {
            const x = this.margins.left + i * groupWidth + groupWidth / 2;
            const y = this.margins.top + this.chartHeight + 10;
            
            const text = this.activityData.timestamps[i];
            ctx.fillText(text, x, y);
        }

        // Draw axis labels
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = '#cbd5e1';
        
        // Y-axis label
        ctx.save();
        ctx.translate(15, this.margins.top + this.chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Activity Count', 0, 0);
        ctx.restore();

        // X-axis label
        ctx.textAlign = 'center';
        ctx.fillText('Time (Hours)', this.margins.left + this.chartWidth / 2, this.margins.top + this.chartHeight + 35);
    }

    drawTotalCount(ctx) {
        const summary = this.getActivitySummary();
        
        if (summary.total === 0) return;

        // Total count badge
        const text = `Total: ${summary.total}`;
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const textWidth = ctx.measureText(text).width;
        
        const badgeX = this.margins.left;
        const badgeY = 15;
        
        // Badge background with gradient
        const gradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + textWidth + 20, badgeY + 22);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
        ctx.shadowBlur = 8;
        this.roundRect(ctx, badgeX, badgeY, textWidth + 20, 22, 11);
        ctx.shadowBlur = 0;
        
        // Badge text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, badgeX + (textWidth + 20) / 2, badgeY + 11);
    }

    getActivitySummary() {
        const summary = {
            totalAdded: this.activityData.added.reduce((a, b) => a + b, 0),
            totalEnabled: this.activityData.enabled.reduce((a, b) => a + b, 0),
            totalDisabled: this.activityData.disabled.reduce((a, b) => a + b, 0),
            totalDeleted: this.activityData.deleted.reduce((a, b) => a + b, 0)
        };

        summary.total = summary.totalAdded + summary.totalEnabled + 
                       summary.totalDisabled + summary.totalDeleted;

        return summary;
    }

    updateActivityFeed() {
        const summary = this.getActivitySummary();
        const activityList = document.querySelector('.activity-list');
        
        if (!activityList) return;

        const recentLogs = dbManager.logs.slice(-5).reverse();
        
        activityList.innerHTML = '';
        
        if (recentLogs.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <i class="fas fa-info-circle info"></i>
                    <div>
                        <p>No recent activity</p>
                        <span>Start by adding a source</span>
                    </div>
                </div>
            `;
            return;
        }

        recentLogs.forEach((log, index) => {
            const iconClass = log.type === 'success' ? 'check-circle success' : 
                            log.type === 'warning' ? 'exclamation-circle warning' : 
                            'info-circle info';
            
            const timeAgo = this.getTimeAgo(log.timestamp);
            const isNew = (Date.now() - log.timestamp) < 10000;
            
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <i class="fas fa-${iconClass}"></i>
                <div>
                    <p>${log.message} ${isNew ? '<span class="new-badge">NEW</span>' : ''}</p>
                    <span>${timeAgo}</span>
                </div>
            `;
            
            if (index === 0 && isNew) {
                item.style.animation = 'slideInRight 0.5s ease';
            }
            
            activityList.appendChild(item);
        });

        if (summary.total > 0) {
            const summaryItem = document.createElement('div');
            summaryItem.className = 'activity-summary';
            summaryItem.innerHTML = `
                <div class="summary-stats">
                    <span class="summary-stat">
                        <i class="fas fa-plus-circle" style="color: ${this.colors.added}"></i>
                        ${summary.totalAdded} Added
                    </span>
                    <span class="summary-stat">
                        <i class="fas fa-check-circle" style="color: ${this.colors.enabled}"></i>
                        ${summary.totalEnabled} Enabled
                    </span>
                    <span class="summary-stat">
                        <i class="fas fa-times-circle" style="color: ${this.colors.disabled}"></i>
                        ${summary.totalDisabled} Disabled
                    </span>
                    <span class="summary-stat">
                        <i class="fas fa-trash" style="color: ${this.colors.deleted}"></i>
                        ${summary.totalDeleted} Deleted
                    </span>
                </div>
                <p class="summary-text">
                    <i class="fas fa-clock"></i> Last ${this.maxDataPoints} hours activity
                    <span class="live-dot"></span>
                </p>
            `;
            activityList.appendChild(summaryItem);
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
        if (seconds < 60) return `${seconds} seconds ago`;
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    startRealTimeUpdates() {
        // Animate live indicator continuously
        setInterval(() => {
            if (this.isLive) {
                this.drawChart();
            }
        }, 2000);
    }

    refresh() {
        this.drawChart();
        this.updateActivityFeed();
    }
}

const activityChart = new ActivityChartManager();
