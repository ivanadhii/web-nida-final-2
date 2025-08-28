// pages/dht22.js - DHT22 Environment Data Page
class DHT22Page {
    constructor() {
        this.pageTitle = 'DHT22 Environment';
        this.sensorType = 'dht22';
        this.columns = [
            { key: 'timestamp', label: 'Timestamp', type: 'timestamp' },
            { key: 'temperature', label: 'Temperature (°C)', type: 'temperature' },
            { key: 'humidity', label: 'Humidity (%)', type: 'humidity' },
            { key: 'gpio_pin', label: 'GPIO Pin', type: 'number', decimals: 0 },
            { key: 'library', label: 'Library', type: 'text' },
            { key: 'status', label: 'Status', type: 'status' }
        ];
    }
    
    render() {
        return `
            <div class="page-container">
                <!-- Page Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-thermometer-half"></i>
                        <h1>DHT22 Environment</h1>
                        <span class="page-subtitle">Temperature & Humidity Monitoring</span>
                    </div>
                    <div class="page-actions">
                        <button class="page-action-btn" onclick="location.reload()">
                            <i class="fas fa-refresh"></i>
                            Refresh
                        </button>
                    </div>
                </div>
                
                <!-- Page Description -->
                <div class="page-description">
                    <div class="description-card environment-theme">
                        <div class="description-content">
                            <h3><i class="fas fa-info-circle"></i> About DHT22 Sensor</h3>
                            <p>
                                The DHT22 monitors environmental conditions around your solar installation. 
                                Temperature affects solar panel efficiency, while humidity can impact equipment longevity and performance.
                            </p>
                            <div class="measurement-points">
                                <div class="measurement-point">
                                    <strong>Sensor Location:</strong> Near solar equipment
                                </div>
                                <div class="measurement-point">
                                    <strong>Update Interval:</strong> Every 10 seconds
                                </div>
                                <div class="measurement-point">
                                    <strong>Optimal Range:</strong> 20-35°C, 40-70% RH
                                </div>
                            </div>
                        </div>
                        <div class="description-icon environment-icon">
                            <i class="fas fa-thermometer-half"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Current Conditions -->
                <div id="currentConditions" class="current-conditions">
                    <div class="conditions-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading current conditions...
                    </div>
                </div>
                
                <!-- Key Metrics Summary -->
                <div id="keyMetrics" class="key-metrics">
                    <div class="metrics-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading environmental metrics...
                    </div>
                </div>
                
                <!-- Data Table -->
                <div id="dataTableContainer">
                    <!-- Table will be rendered here by DataTableComponent -->
                </div>
            </div>
        `;
    }
    
    async initialize() {
        console.log('Initializing DHT22 page...');
        
        try {
            // Load current conditions
            await this.loadCurrentConditions();
            
            // Load key metrics
            await this.loadKeyMetrics();
            
            // Initialize data table
            await this.initializeDataTable();
            
            console.log('DHT22 page initialized successfully');
            
        } catch (error) {
            console.error('Error initializing DHT22 page:', error);
            
            if (window.sensorApp) {
                window.sensorApp.showToast('Failed to initialize page: ' + error.message, 'error');
            }
        }
    }
    
    async loadCurrentConditions() {
        try {
            const conditionsContainer = document.getElementById('currentConditions');
            if (!conditionsContainer) return;
            
            if (window.sensorApp && window.sensorApp.components.api) {
                const latestResult = await window.sensorApp.components.api.getLatestData(1);
                
                if (latestResult.success && latestResult.data.dht22 && latestResult.data.dht22.length > 0) {
                    const latestData = latestResult.data.dht22[0];
                    this.renderCurrentConditions(conditionsContainer, latestData);
                } else {
                    this.renderNoConditions(conditionsContainer);
                }
            }
        } catch (error) {
            console.error('Error loading current conditions:', error);
            this.renderConditionsError(document.getElementById('currentConditions'), error.message);
        }
    }
    
    renderCurrentConditions(container, data) {
        if (data.status !== 'success') {
            this.renderNoConditions(container);
            return;
        }
        
        const temperature = data.temperature || 0;
        const humidity = data.humidity || 0;
        const isOnline = data.status === 'success';
        
        // Determine comfort level
        const tempComfort = this.getTemperatureComfort(temperature);
        const humidityComfort = this.getHumidityComfort(humidity);
        const overallComfort = this.getOverallComfort(tempComfort.level, humidityComfort.level);
        
        container.innerHTML = `
            <div class="conditions-card ${overallComfort.class}">
                <div class="conditions-header">
                    <h3>Current Environmental Conditions</h3>
                    <span class="status-indicator ${isOnline ? 'online' : 'offline'}">
                        ${isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
                
                <div class="conditions-main">
                    <div class="condition-item temperature">
                        <div class="condition-icon">
                            <i class="fas ${this.getTemperatureIcon(temperature)}"></i>
                        </div>
                        <div class="condition-content">
                            <div class="condition-value">${this.formatNumber(temperature, 1)}°C</div>
                            <div class="condition-label">Temperature</div>
                            <div class="condition-status ${tempComfort.class}">${tempComfort.text}</div>
                        </div>
                    </div>
                    
                    <div class="condition-divider"></div>
                    
                    <div class="condition-item humidity">
                        <div class="condition-icon">
                            <i class="fas ${this.getHumidityIcon(humidity)}"></i>
                        </div>
                        <div class="condition-content">
                            <div class="condition-value">${this.formatNumber(humidity, 1)}%</div>
                            <div class="condition-label">Humidity</div>
                            <div class="condition-status ${humidityComfort.class}">${humidityComfort.text}</div>
                        </div>
                    </div>
                </div>
                
                <div class="conditions-footer">
                    <div class="overall-status">
                        <i class="fas ${overallComfort.icon}"></i>
                        <span>${overallComfort.text}</span>
                    </div>
                    <div class="last-reading">
                        Last reading: ${this.getTimeAgo(data.timestamp)}
                    </div>
                </div>
            </div>
            
            ${this.renderEnvironmentAlerts(temperature, humidity)}
        `;
    }
    
    renderEnvironmentAlerts(temperature, humidity) {
        const alerts = [];
        
        if (temperature > 45) {
            alerts.push({
                type: 'error',
                icon: 'fa-temperature-high',
                message: 'Extreme high temperature detected! This may affect solar panel efficiency.'
            });
        } else if (temperature > 35) {
            alerts.push({
                type: 'warning',
                icon: 'fa-thermometer-full',
                message: 'High temperature detected. Monitor system performance.'
            });
        } else if (temperature < 5) {
            alerts.push({
                type: 'warning',
                icon: 'fa-thermometer-empty',
                message: 'Low temperature detected. Check for condensation issues.'
            });
        }
        
        if (humidity > 85) {
            alerts.push({
                type: 'warning',
                icon: 'fa-tint',
                message: 'High humidity detected. Monitor for moisture-related issues.'
            });
        } else if (humidity < 20) {
            alerts.push({
                type: 'info',
                icon: 'fa-info-circle',
                message: 'Low humidity detected. Dry conditions may increase dust accumulation.'
            });
        }
        
        if (alerts.length === 0) return '';
        
        return `
            <div class="environment-alerts">
                ${alerts.map(alert => `
                    <div class="alert-item ${alert.type}">
                        <i class="fas ${alert.icon}"></i>
                        ${alert.message}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderNoConditions(container) {
        container.innerHTML = `
            <div class="no-conditions">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No Environment Data</h3>
                <p>No recent DHT22 sensor data available. The sensor may be offline or disconnected.</p>
            </div>
        `;
    }
    
    renderConditionsError(container, error) {
        container.innerHTML = `
            <div class="conditions-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Conditions</h3>
                <p>${error}</p>
                <button onclick="sensorApp.components.dht22.loadCurrentConditions()" class="retry-btn">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
    
    async loadKeyMetrics() {
        try {
            const metricsContainer = document.getElementById('keyMetrics');
            if (!metricsContainer) return;
            
            if (window.sensorApp && window.sensorApp.components.api) {
                // Get recent data for statistics
                const recentResult = await window.sensorApp.components.api.getSensorData(this.sensorType, {
                    limit: 100 // Last 100 readings for statistics
                });
                
                if (recentResult.success && recentResult.data.records && recentResult.data.records.length > 0) {
                    this.renderKeyMetrics(metricsContainer, recentResult.data.records);
                } else {
                    this.renderNoMetrics(metricsContainer);
                }
            }
        } catch (error) {
            console.error('Error loading key metrics:', error);
            this.renderMetricsError(document.getElementById('keyMetrics'), error.message);
        }
    }
    
    renderKeyMetrics(container, records) {
        const validRecords = records.filter(r => r.status === 'success');
        
        if (validRecords.length === 0) {
            this.renderNoMetrics(container);
            return;
        }
        
        const temperatures = validRecords.map(r => r.temperature).filter(t => t != null);
        const humidities = validRecords.map(r => r.humidity).filter(h => h != null);
        
        const tempStats = this.calculateStats(temperatures);
        const humidityStats = this.calculateStats(humidities);
        
        const latest = validRecords[0];
        
        container.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card environment online">
                    <div class="metric-header">
                        <i class="fas fa-thermometer-half"></i>
                        <span>Current Temp</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(latest.temperature || 0, 1)}°C</div>
                    <div class="metric-subtitle">Live Reading</div>
                </div>
                
                <div class="metric-card environment online">
                    <div class="metric-header">
                        <i class="fas fa-tint"></i>
                        <span>Current Humidity</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(latest.humidity || 0, 1)}%</div>
                    <div class="metric-subtitle">Live Reading</div>
                </div>
                
                <div class="metric-card environment online">
                    <div class="metric-header">
                        <i class="fas fa-chart-line"></i>
                        <span>Avg Temperature</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(tempStats.avg, 1)}°C</div>
                    <div class="metric-subtitle">Recent Average</div>
                </div>
                
                <div class="metric-card environment online">
                    <div class="metric-header">
                        <i class="fas fa-chart-bar"></i>
                        <span>Avg Humidity</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(humidityStats.avg, 1)}%</div>
                    <div class="metric-subtitle">Recent Average</div>
                </div>
                
                <div class="metric-card environment online">
                    <div class="metric-header">
                        <i class="fas fa-arrow-up"></i>
                        <span>Max Temperature</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(tempStats.max, 1)}°C</div>
                    <div class="metric-subtitle">Recent Peak</div>
                </div>
                
                <div class="metric-card environment online">
                    <div class="metric-header">
                        <i class="fas fa-arrow-down"></i>
                        <span>Min Temperature</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(tempStats.min, 1)}°C</div>
                    <div class="metric-subtitle">Recent Low</div>
                </div>
            </div>
            
            <div class="last-updated">
                <i class="fas fa-clock"></i>
                Statistics based on last ${validRecords.length} readings
                <span class="data-range">(${this.getTimeAgo(validRecords[validRecords.length - 1].timestamp)} - now)</span>
            </div>
        `;
    }
    
    calculateStats(values) {
        if (values.length === 0) return { min: 0, max: 0, avg: 0 };
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        
        return { min, max, avg };
    }
    
    renderNoMetrics(container) {
        container.innerHTML = `
            <div class="no-metrics">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No Recent Data</h3>
                <p>No recent DHT22 sensor data available for statistical analysis.</p>
            </div>
        `;
    }
    
    renderMetricsError(container, error) {
        container.innerHTML = `
            <div class="metrics-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Metrics</h3>
                <p>${error}</p>
                <button onclick="sensorApp.components.dht22.loadKeyMetrics()" class="retry-btn">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
    
    async initializeDataTable() {
        const container = document.getElementById('dataTableContainer');
        if (!container) return;
        
        if (window.sensorApp && window.sensorApp.components.dataTable) {
            const tableConfig = {
                sensorType: this.sensorType,
                title: this.pageTitle,
                columns: this.columns,
                showDateFilter: true,
                showExport: true
            };
            
            container.innerHTML = window.sensorApp.components.dataTable.render(tableConfig);
            await window.sensorApp.components.dataTable.initialize(tableConfig);
        }
    }
    
    // Utility methods for environmental analysis
    getTemperatureComfort(temp) {
        if (temp >= 20 && temp <= 35) return { level: 'good', class: 'good', text: 'Optimal' };
        if (temp >= 15 && temp <= 40) return { level: 'ok', class: 'warning', text: 'Acceptable' };
        return { level: 'poor', class: 'error', text: temp > 40 ? 'Too Hot' : 'Too Cold' };
    }
    
    getHumidityComfort(humidity) {
        if (humidity >= 40 && humidity <= 70) return { level: 'good', class: 'good', text: 'Optimal' };
        if (humidity >= 30 && humidity <= 80) return { level: 'ok', class: 'warning', text: 'Acceptable' };
        return { level: 'poor', class: 'error', text: humidity > 80 ? 'Too Humid' : 'Too Dry' };
    }
    
    getOverallComfort(tempLevel, humidityLevel) {
        if (tempLevel === 'good' && humidityLevel === 'good') {
            return { class: 'excellent', text: 'Excellent conditions for solar equipment', icon: 'fa-check-circle' };
        }
        if (tempLevel === 'ok' && humidityLevel === 'ok') {
            return { class: 'good', text: 'Good conditions for solar equipment', icon: 'fa-thumbs-up' };
        }
        if (tempLevel === 'poor' || humidityLevel === 'poor') {
            return { class: 'poor', text: 'Conditions may affect equipment performance', icon: 'fa-exclamation-triangle' };
        }
        return { class: 'fair', text: 'Fair conditions for solar equipment', icon: 'fa-info-circle' };
    }
    
    getTemperatureIcon(temp) {
        if (temp > 35) return 'fa-thermometer-full';
        if (temp > 25) return 'fa-thermometer-three-quarters';
        if (temp > 15) return 'fa-thermometer-half';
        if (temp > 5) return 'fa-thermometer-quarter';
        return 'fa-thermometer-empty';
    }
    
    getHumidityIcon(humidity) {
        if (humidity > 70) return 'fa-tint';
        if (humidity > 40) return 'fa-tint';
        return 'fa-tint';
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }
    
    formatNumber(value, decimals = 2) {
        return Number(value).toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    getStyles() {
        return `
            <style>
                .environment-theme {
                    background: linear-gradient(135deg, #e0f2fe, #b3e5fc, #4fc3f7);
                }
                
                .environment-icon {
                    color: #0277bd;
                }
                
                .current-conditions {
                    margin-bottom: 24px;
                }
                
                .conditions-card {
                    background: white;
                    border: 2px solid var(--border-color);
                    border-radius: 16px;
                    padding: 24px;
                    transition: all 0.3s ease;
                }
                
                .conditions-card.excellent {
                    border-color: #10b981;
                    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                }
                
                .conditions-card.good {
                    border-color: #3b82f6;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                }
                
                .conditions-card.fair {
                    border-color: #f59e0b;
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                }
                
                .conditions-card.poor {
                    border-color: #ef4444;
                    background: linear-gradient(135deg, #fef2f2, #fecaca);
                }
                
                .conditions-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .conditions-header h3 {
                    color: var(--text-primary);
                    font-size: 1.2rem;
                    margin: 0;
                }
                
                .conditions-main {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                    margin-bottom: 20px;
                }
                
                .condition-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex: 1;
                }
                
                .condition-icon {
                    font-size: 2.5rem;
                    color: var(--primary-color);
                }
                
                .condition-content {
                    flex: 1;
                }
                
                .condition-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                    font-variant-numeric: tabular-nums;
                }
                
                .condition-label {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                    margin-bottom: 4px;
                }
                
                .condition-status {
                    font-size: 0.8rem;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 12px;
                    display: inline-block;
                }
                
                .condition-status.good {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .condition-status.warning {
                    background: #fef3c7;
                    color: #92400e;
                }
                
                .condition-status.error {
                    background: #fecaca;
                    color: #991b1b;
                }
                
                .condition-divider {
                    width: 1px;
                    height: 60px;
                    background: var(--border-color);
                    margin: 0 16px;
                }
                
                .conditions-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color);
                    font-size: 0.9rem;
                }
                
                .overall-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                
                .last-reading {
                    color: var(--text-muted);
                }
                
                .environment-alerts {
                    margin-top: 16px;
                }
                
                .alert-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-weight: 500;
                    margin-bottom: 8px;
                }
                
                .alert-item.error {
                    background: linear-gradient(135deg, #fecaca, #fca5a5);
                    border: 1px solid #f87171;
                    color: #991b1b;
                }
                
                .alert-item.warning {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border: 1px solid #fbbf24;
                    color: #92400e;
                }
                
                .alert-item.info {
                    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
                    border: 1px solid #60a5fa;
                    color: #1e40af;
                }
                
                .metric-card.environment {
                    border-color: #0277bd;
                }
                
                .metric-card.environment.online::before {
                    background: linear-gradient(90deg, #0277bd, #03a9f4);
                }
                
                .no-conditions,
                .conditions-error {
                    text-align: center;
                    padding: 40px 20px;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    color: var(--text-secondary);
                }
                
                .conditions-error {
                    color: var(--error-color);
                }
                
                .data-range {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .conditions-main {
                        flex-direction: column;
                        gap: 20px;
                    }
                    
                    .condition-divider {
                        width: 100%;
                        height: 1px;
                        margin: 16px 0;
                    }
                    
                    .conditions-footer {
                        flex-direction: column;
                        gap: 8px;
                        text-align: center;
                    }
                }
            </style>
        `;
    }
}

// Export for use in other components
window.DHT22Page = DHT22Page;