// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.performanceData = {
            cpu: [],
            memory: [],
            disk: [],
            network: [],
            timestamps: []
        };
        this.maxDataPoints = 20;
        this.chart = null;
        this.startTime = Date.now();
    }

    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.updatePerformance();
        this.monitoringInterval = setInterval(() => {
            this.updatePerformance();
        }, 3000); // Update every 3 seconds
    }

    stop() {
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    updatePerformance() {
        // Simulate performance data (in production, get from actual system)
        const cpu = this.getSimulatedCPU();
        const memory = this.getSimulatedMemory();
        const disk = this.getSimulatedDisk();
        const network = this.getSimulatedNetwork();

        // Update UI
        this.updateUI(cpu, memory, disk, network);

        // Store data for chart
        this.storeData(cpu, memory, disk, network);

        // Update chart
        this.updateChart();

        // Save to Firebase
        this.saveToFirebase(cpu, memory, disk, network);
    }

    getSimulatedCPU() {
        // Simulate CPU usage between 20-80%
        const base = 40;
        const variance = Math.random() * 40 - 20;
        return Math.max(10, Math.min(90, base + variance));
    }

    getSimulatedMemory() {
        // Simulate memory usage between 30-75%
        const base = 50;
        const variance = Math.random() * 30 - 15;
        return Math.max(20, Math.min(85, base + variance));
    }

    getSimulatedDisk() {
        // Simulate disk usage between 40-70%
        const base = 55;
        const variance = Math.random() * 20 - 10;
        return Math.max(30, Math.min(80, base + variance));
    }

    getSimulatedNetwork() {
        // Simulate network speed between 0-100 MB/s
        const base = 25;
        const variance = Math.random() * 50 - 25;
        return Math.max(0, Math.min(100, base + variance));
    }

    updateUI(cpu, memory, disk, network) {
        const cpuEl = document.getElementById('cpuUsage');
        const memoryEl = document.getElementById('memoryUsage');
        const diskEl = document.getElementById('diskUsage');
        const networkEl = document.getElementById('networkSpeed');

        if (cpuEl) cpuEl.textContent = cpu.toFixed(1) + '%';
        if (memoryEl) memoryEl.textContent = memory.toFixed(1) + '%';
        if (diskEl) diskEl.textContent = disk.toFixed(1) + '%';
        if (networkEl) networkEl.textContent = network.toFixed(1) + ' MB/s';

        // Update status colors
        this.updateStatusColor(cpuEl, cpu);
        this.updateStatusColor(memoryEl, memory);
        this.updateStatusColor(diskEl, disk);
    }

    updateStatusColor(element, value) {
        if (!element) return;
        
        const parent = element.closest('.stat-card');
        if (!parent) return;

        const statusEl = parent.querySelector('.stat-change');
        if (!statusEl) return;

        statusEl.classList.remove('neutral', 'warning', 'negative');
        
        if (value < 50) {
            statusEl.classList.add('neutral');
            statusEl.textContent = 'Normal';
        } else if (value < 75) {
            statusEl.classList.add('warning');
            statusEl.textContent = 'Moderate';
        } else {
            statusEl.classList.add('negative');
            statusEl.textContent = 'High';
        }
    }

    storeData(cpu, memory, disk, network) {
        const now = new Date().toLocaleTimeString();

        this.performanceData.cpu.push(cpu);
        this.performanceData.memory.push(memory);
        this.performanceData.disk.push(disk);
        this.performanceData.network.push(network);
        this.performanceData.timestamps.push(now);

        // Keep only last N data points
        if (this.performanceData.cpu.length > this.maxDataPoints) {
            this.performanceData.cpu.shift();
            this.performanceData.memory.shift();
            this.performanceData.disk.shift();
            this.performanceData.network.shift();
            this.performanceData.timestamps.shift();
        }
    }

    updateChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        if (!this.chart) {
            this.initChart(ctx);
        } else {
            this.chart.data.labels = this.performanceData.timestamps;
            this.chart.data.datasets[0].data = this.performanceData.cpu;
            this.chart.data.datasets[1].data = this.performanceData.memory;
            this.chart.data.datasets[2].data = this.performanceData.disk;
            this.chart.update('none'); // Update without animation for smooth real-time
        }
    }

    initChart(ctx) {
        // Simple chart implementation without Chart.js
        // For production, use Chart.js library
        this.chart = {
            data: {
                labels: this.performanceData.timestamps,
                datasets: [
                    { data: this.performanceData.cpu, label: 'CPU', color: '#3b82f6' },
                    { data: this.performanceData.memory, label: 'Memory', color: '#f59e0b' },
                    { data: this.performanceData.disk, label: 'Disk', color: '#10b981' }
                ]
            },
            update: () => this.drawChart(ctx)
        };
        this.drawChart(ctx);
    }

    drawChart(ctx) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw lines
        const datasets = this.chart.data.datasets;
        const dataLength = this.performanceData.cpu.length;
        
        if (dataLength < 2) return;

        const xStep = width / (dataLength - 1);

        datasets.forEach(dataset => {
            ctx.strokeStyle = dataset.color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            dataset.data.forEach((value, index) => {
                const x = index * xStep;
                const y = height - (value / 100) * height;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });
    }

    async saveToFirebase(cpu, memory, disk, network) {
        try {
            await statsRef.update({
                cpu: parseFloat(cpu.toFixed(1)),
                memory: parseFloat(memory.toFixed(1)),
                disk: parseFloat(disk.toFixed(1)),
                network: parseFloat(network.toFixed(1)),
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Failed to save performance data:', error);
        }
    }

    getUptime() {
        const uptime = Date.now() - this.startTime;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    updateSystemInfo() {
        const platformEl = document.getElementById('platform');
        const uptimeEl = document.getElementById('uptime');
        const currentUserEl = document.getElementById('currentUser');

        if (platformEl) platformEl.textContent = navigator.platform || 'Web Browser';
        if (uptimeEl) uptimeEl.textContent = this.getUptime();
        if (currentUserEl && authManager.currentUser) {
            currentUserEl.textContent = authManager.currentUser.displayName || authManager.currentUser.email;
        }
    }
}

const performanceMonitor = new PerformanceMonitor();
