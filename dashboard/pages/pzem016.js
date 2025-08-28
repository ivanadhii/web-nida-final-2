// pages/pzem016.js - PZEM-016 AC Power Data Page
class PZEM016Page {
    constructor() {
        this.pageTitle = 'PZEM-016 (AC Power)';
        this.sensorType = 'pzem016';
        this.columns = [
            { key: 'timestamp', label: 'Timestamp', type: 'timestamp' },
            { key: 'parsed_data.voltage_v', label: 'Voltage (V)', type: 'voltage' },
            { key: 'parsed_data.current_a', label: 'Current (A)', type: 'current' },
            { key: 'parsed_data.power_w', label: 'Power (W)', type: 'power' },
            { key: 'parsed_data.energy_kwh', label: 'Energy (kWh)', type: 'energy' },
            { key: 'parsed_data.frequency_hz', label: 'Frequency (Hz)', type: 'number', decimals: 1 },
            { key: 'parsed_data.power_factor', label: 'Power Factor', type: 'number', decimals: 2 },
            { key: 'parsed_data.alarm_status', label: 'Alarm', type: 'status' },
            { key: 'status', label: 'Status', type: 'status' }
        ];
    }
    
    render() {
        return `
            <div class="page-container">
                <!-- Page Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-plug"></i>
                        <h1>PZEM-016 (AC Power)</h1>
                        <span class="page-subtitle">Inverter to Load AC Power Monitoring</span>
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
                    <div class="description-card">
                        <div class="description-content">
                            <h3><i class="fas fa-info-circle"></i> About PZEM-016 AC</h3>
                            <p>
                                The PZEM-016 measures AC power flowing from the inverter to your electrical loads. 
                                This data shows how much solar energy you're actually consuming and helps calculate your PLN savings.
                            </p>
                            <div class="measurement-points">
                                <div class="measurement-point">
                                    <strong>Measurement Point:</strong> Inverter → AC Load
                                </div>
                                <div class="measurement-point">
                                    <strong>Update Interval:</strong> Every 10 seconds
                                </div>
                                <div class="measurement-point">
                                    <strong>Data Retention:</strong> 30 days (default)
                                </div>
                            </div>
                        </div>
                        <div class="description-icon">
                            <i class="fas fa-plug"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Key Metrics Summary -->
                <div id="keyMetrics" class="key-metrics">
                    <div class="metrics-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading key metrics...
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
        console.log('Initializing PZEM-016 page...');
        
        try {
            // Load key metrics
            await this.loadKeyMetrics();
            
            // Initialize data table
            await this.initializeDataTable();
            
            console.log('PZEM-016 page initialized successfully');
            
        } catch (error) {
            console.error('Error initializing PZEM-016 page:', error);
            
            if (window.sensorApp) {
                window.sensorApp.showToast('Failed to initialize page: ' + error.message, 'error');
            }
        }
    }
    
    async loadKeyMetrics() {
        try {
            const metricsContainer = document.getElementById('keyMetrics');
            if (!metricsContainer) return;
            
            if (window.sensorApp && window.sensorApp.components.api) {
                // Get latest data for metrics
                const latestResult = await window.sensorApp.components.api.getLatestData(1);
                
                if (latestResult.success && latestResult.data.pzem_ac && latestResult.data.pzem_ac.length > 0) {
                    const latestData = latestResult.data.pzem_ac[0];
                    this.renderKeyMetrics(metricsContainer, latestData);
                } else {
                    this.renderNoMetrics(metricsContainer);
                }
            }
        } catch (error) {
            console.error('Error loading key metrics:', error);
            this.renderMetricsError(document.getElementById('keyMetrics'), error.message);
        }
    }
    
    renderKeyMetrics(container, data) {
        if (!data.parsed_data || data.parsed_data.status !== 'success') {
            this.renderNoMetrics(container);
            return;
        }
        
        const parsed = data.parsed_data;
        const isOnline = data.status === 'success';
        
        container.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card ${isOnline ? 'online' : 'offline'}">
                    <div class="metric-header">
                        <i class="fas fa-bolt"></i>
                        <span>Current Power</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(parsed.power_w || 0, 1)} W</div>
                    <div class="metric-subtitle">AC Power Draw</div>
                </div>
                
                <div class="metric-card ${isOnline ? 'online' : 'offline'}">
                    <div class="metric-header">
                        <i class="fas fa-plug"></i>
                        <span>Voltage</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(parsed.voltage_v || 0, 1)} V</div>
                    <div class="metric-subtitle">AC Voltage</div>
                </div>
                
                <div class="metric-card ${isOnline ? 'online' : 'offline'}">
                    <div class="metric-header">
                        <i class="fas fa-wave-square"></i>
                        <span>Current</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(parsed.current_a || 0, 3)} A</div>
                    <div class="metric-subtitle">AC Current</div>
                </div>
                
                <div class="metric-card ${isOnline ? 'online' : 'offline'}">
                    <div class="metric-header">
                        <i class="fas fa-chart-bar"></i>
                        <span>Energy Today</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(parsed.energy_kwh || 0, 3)} kWh</div>
                    <div class="metric-subtitle">Total Energy</div>
                </div>
                
                <div class="metric-card ${isOnline ? 'online' : 'offline'}">
                    <div class="metric-header">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>Frequency</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(parsed.frequency_hz || 0, 1)} Hz</div>
                    <div class="metric-subtitle">AC Frequency</div>
                </div>
                
                <div class="metric-card ${isOnline ? 'online' : 'offline'}">
                    <div class="metric-header">
                        <i class="fas fa-signal"></i>
                        <span>Power Factor</span>
                    </div>
                    <div class="metric-value">${this.formatNumber(parsed.power_factor || 0, 2)}</div>
                    <div class="metric-subtitle">${this.getPowerFactorStatus(parsed.power_factor)}</div>
                </div>
            </div>
            
            <div class="last-updated">
                <i class="fas fa-clock"></i>
                Last updated: ${this.formatTimestamp(data.timestamp)}
                <span class="status-indicator ${isOnline ? 'online' : 'offline'}">
                    ${isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
            
            ${parsed.alarm_status === 'ON' ? `
                <div class="alert-banner">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>ALARM ACTIVE:</strong> PZEM-016 system alarm is currently active!
                </div>
            ` : ''}
        `;
    }
    
    renderNoMetrics(container) {
        container.innerHTML = `
            <div class="no-metrics">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No Recent Data</h3>
                <p>No recent PZEM-016 data available. The sensor may be offline or not configured.</p>
            </div>
        `;
    }
    
    renderMetricsError(container, error) {
        container.innerHTML = `
            <div class="metrics-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Metrics</h3>
                <p>${error}</p>
                <button onclick="sensorApp.components.pzem016.loadKeyMetrics()" class="retry-btn">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
    
    async initializeDataTable() {
        const container = document.getElementById('dataTableContainer');
        if (!container) return;
        
        // Render data table
        if (window.sensorApp && window.sensorApp.components.dataTable) {
            const tableConfig = {
                sensorType: this.sensorType,
                title: this.pageTitle,
                columns: this.columns,
                showDateFilter: true,
                showExport: true
            };
            
            container.innerHTML = window.sensorApp.components.dataTable.render(tableConfig);
            
            // Initialize table functionality
            await window.sensorApp.components.dataTable.initialize(tableConfig);
        }
    }
    
    getPowerFactorStatus(powerFactor) {
        if (!powerFactor) return 'Unknown';
        
        if (powerFactor >= 0.9) return 'Excellent';
        if (powerFactor >= 0.8) return 'Good';
        if (powerFactor >= 0.7) return 'Fair';
        return 'Poor';
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
                .page-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }
                
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                
                .page-title h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .page-title i {
                    color: var(--primary-color);
                }
                
                .page-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    margin-top: 4px;
                    display: block;
                }
                
                .page-actions {
                    display: flex;
                    gap: 12px;
                }
                
                .page-action-btn {
                    padding: 10px 16px;
                    background: var(--surface-color);
                    border: 2px solid var(--border-color);
                    color: var(--text-primary);
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .page-action-btn:hover {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                    background: white;
                }
                
                /* Page Description */
                .page-description {
                    margin-bottom: 32px;
                }
                
                .description-card {
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }
                
                .description-content {
                    flex: 1;
                }
                
                .description-content h3 {
                    color: var(--text-primary);
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .description-content p {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 16px;
                }
                
                .measurement-points {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    font-size: 0.9rem;
                }
                
                .measurement-point {
                    color: var(--text-secondary);
                }
                
                .description-icon {
                    font-size: 4rem;
                    color: var(--primary-color);
                    opacity: 0.3;
                }
                
                /* Key Metrics */
                .key-metrics {
                    margin-bottom: 32px;
                }
                
                .metrics-loading,
                .no-metrics,
                .metrics-error {
                    text-align: center;
                    padding: 40px 20px;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    color: var(--text-secondary);
                }
                
                .metrics-error {
                    color: var(--error-color);
                }
                
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }
                
                .metric-card {
                    background: white;
                    border: 2px solid var(--border-color);
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .metric-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .metric-card.online {
                    border-color: var(--success-color);
                }
                
                .metric-card.online::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, var(--success-color), var(--info-color));
                }
                
                .metric-card.offline {
                    border-color: var(--error-color);
                    opacity: 0.7;
                }
                
                .metric-card.offline::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: var(--error-color);
                }
                
                .metric-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                
                .metric-header i {
                    color: var(--primary-color);
                }
                
                .metric-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                    font-variant-numeric: tabular-nums;
                }
                
                .metric-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
                
                .last-updated {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                
                .status-indicator {
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .status-indicator.online {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .status-indicator.offline {
                    background: #fecaca;
                    color: #991b1b;
                }
                
                .alert-banner {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border: 1px solid #fbbf24;
                    color: #92400e;
                    padding: 16px 20px;
                    border-radius: 8px;
                    margin-top: 16px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .alert-banner i {
                    font-size: 1.2rem;
                    color: #d97706;
                }
                
                .retry-btn {
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: background 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .retry-btn:hover {
                    background: var(--primary-dark);
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .page-container {
                        padding: 0 16px;
                    }
                    
                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .page-title h1 {
                        font-size: 1.5rem;
                    }
                    
                    .description-card {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .measurement-points {
                        flex-direction: column;
                        gap: 8px;
                        text-align: left;
                    }
                    
                    .metrics-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .last-updated {
                        flex-direction: column;
                        gap: 8px;
                        text-align: center;
                    }
                }
                
                @media (max-width: 480px) {
                    .metrics-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .metric-value {
                        font-size: 1.5rem;
                    }
                }
            </style>
        `;
    }
}

// Export for use in other components
window.PZEM016Page = PZEM016Page;