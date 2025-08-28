// components/roi-card.js - ROI Analysis Card Component
class ROICardComponent {
    constructor() {
        this.roiData = null;
        this.updateInterval = null;
    }
    
    render() {
        return `
            <div class="card col-span-12">
                <div class="card-header">
                    <h3 class="card-title">
                        <div class="card-icon icon-roi">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        ROI Analysis
                    </h3>
                    <span class="status-badge" id="roiStatus">Loading...</span>
                </div>
                <div id="roiCardContent">
                    <div class="loading">Loading ROI data...</div>
                </div>
            </div>
        `;
    }
    
    getStyles() {
        return `
            <style>
                .icon-roi { 
                    background: linear-gradient(135deg, #f59e0b, #d97706); 
                    color: white; 
                }
                
                .roi-card-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .roi-metric {
                    text-align: center;
                    padding: 16px;
                    background: var(--surface-color);
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    transition: transform 0.2s ease;
                }
                
                .roi-metric:hover {
                    transform: translateY(-2px);
                }
                
                .roi-metric-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--primary-color);
                    margin-bottom: 4px;
                    font-variant-numeric: tabular-nums;
                }
                
                .roi-metric-label {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                
                .roi-progress-container {
                    margin: 24px 0;
                }
                
                .roi-progress-label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                
                .roi-progress-bar {
                    width: 100%;
                    height: 24px;
                    background: var(--surface-color);
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    border: 2px solid #e0f2fe;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .roi-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #10b981, #06b6d4);
                    transition: width 0.8s ease-in-out;
                    border-radius: 10px;
                    position: relative;
                    overflow: hidden;
                }
                
                .roi-progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%);
                    animation: shimmer 2s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .roi-progress-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-weight: 700;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
                }
                
                .roi-payback {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 16px;
                    background: linear-gradient(135deg, var(--info-color), var(--primary-color));
                    color: white;
                    border-radius: 12px;
                    margin: 16px 0;
                    box-shadow: var(--shadow-md);
                }
                
                .roi-payback-value {
                    font-size: 1.4rem;
                    font-weight: 700;
                }
                
                .roi-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                
                .roi-action-btn {
                    flex: 1;
                    min-width: 140px;
                    padding: 10px 16px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    background: white;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    text-decoration: none;
                }
                
                .roi-action-btn:hover {
                    border-color: var(--primary-color);
                    background: var(--primary-color);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .roi-action-btn.primary {
                    background: var(--success-color);
                    border-color: var(--success-color);
                    color: white;
                }
                
                .roi-action-btn.primary:hover {
                    background: #059669;
                    border-color: #059669;
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }
                
                .roi-summary-text {
                    text-align: center;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin-top: 16px;
                    padding: 12px;
                    background: var(--surface-color);
                    border-radius: 8px;
                    border-left: 4px solid var(--info-color);
                }
                
                .roi-investment-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 12px 0;
                    padding: 12px;
                    background: #fef7ed;
                    border: 1px solid #fed7aa;
                    border-radius: 8px;
                    font-size: 0.9rem;
                }
                
                .roi-error {
                    text-align: center;
                    padding: 24px;
                    color: var(--error-color);
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    margin: 16px 0;
                }
                
                @media (max-width: 768px) {
                    .roi-card-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .roi-actions {
                        flex-direction: column;
                    }
                    
                    .roi-action-btn {
                        min-width: unset;
                    }
                }
                
                @media (max-width: 480px) {
                    .roi-card-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .roi-metric-value {
                        font-size: 1.5rem;
                    }
                }
            </style>
        `;
    }
    
    async initialize() {
        // Load ROI data
        await this.loadROIData();
        
        // Set up auto-refresh every 5 minutes
        this.updateInterval = setInterval(() => {
            this.loadROIData();
        }, 5 * 60 * 1000);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    async loadROIData() {
        try {
            const statusEl = document.getElementById('roiStatus');
            const contentEl = document.getElementById('roiCardContent');
            
            if (statusEl) {
                statusEl.className = 'status-badge status-warning';
                statusEl.textContent = 'Loading...';
            }
            
            if (window.sensorApp && window.sensorApp.components.api) {
                const result = await window.sensorApp.components.api.getROISummary();
                
                if (result.success) {
                    this.roiData = result.data;
                    this.renderROIContent();
                    
                    if (statusEl) {
                        statusEl.className = 'status-badge status-success';
                        statusEl.textContent = 'Updated';
                    }
                } else {
                    throw new Error(result.error || 'Failed to load ROI data');
                }
            }
        } catch (error) {
            console.error('Error loading ROI data:', error);
            this.renderError(error.message);
            
            const statusEl = document.getElementById('roiStatus');
            if (statusEl) {
                statusEl.className = 'status-badge status-error';
                statusEl.textContent = 'Error';
            }
        }
    }
    
    renderROIContent() {
        const contentEl = document.getElementById('roiCardContent');
        if (!contentEl || !this.roiData) return;
        
        const data = this.roiData;
        const progressPercentage = Math.min(data.roi_percentage || 0, 100);
        const monthsRemaining = Math.max(data.payback_months_remaining || 0, 0);
        
        contentEl.innerHTML = `
            <!-- ROI Metrics Grid -->
            <div class="roi-card-grid">
                <div class="roi-metric">
                    <div class="roi-metric-value">${this.formatCurrency(data.today_savings || 0)}</div>
                    <div class="roi-metric-label">Today's Savings</div>
                </div>
                <div class="roi-metric">
                    <div class="roi-metric-value">${this.formatCurrency(data.monthly_savings || 0)}</div>
                    <div class="roi-metric-label">This Month</div>
                </div>
                <div class="roi-metric">
                    <div class="roi-metric-value">${this.formatCurrency(data.total_savings || 0)}</div>
                    <div class="roi-metric-label">Total Saved</div>
                </div>
            </div>
            
            <!-- Investment Recovery Progress -->
            <div class="roi-progress-container">
                <div class="roi-progress-label">
                    <span>Investment Recovery</span>
                    <span>${progressPercentage.toFixed(1)}%</span>
                </div>
                <div class="roi-progress-bar">
                    <div class="roi-progress-fill" style="width: ${progressPercentage}%"></div>
                    <div class="roi-progress-text">${this.formatCurrency(data.investment_recovered || 0)} / ${this.formatCurrency(data.total_investment || 20500000)}</div>
                </div>
            </div>
            
            <!-- Payback Information -->
            <div class="roi-payback">
                <i class="fas fa-clock"></i>
                <div class="roi-payback-value">${monthsRemaining} months remaining</div>
            </div>
            
            <!-- Investment Info -->
            <div class="roi-investment-info">
                <span><strong>System Start:</strong> ${this.formatDate(data.system_start_date)}</span>
                <span><strong>Investment:</strong> ${this.formatCurrency(data.total_investment || 20500000)}</span>
            </div>
            
            <!-- Action Buttons -->
            <div class="roi-actions">
                <button class="roi-action-btn primary" onclick="sensorApp.components.roiCard.exportROIReport()">
                    <i class="fas fa-download"></i>
                    Export Report
                </button>
                <a href="/roi-settings" class="roi-action-btn" data-route="roi-settings">
                    <i class="fas fa-cog"></i>
                    Settings
                </a>
            </div>
            
            <!-- Summary Text -->
            <div class="roi-summary-text">
                ${this.generateSummaryText(data)}
            </div>
        `;
    }
    
    renderError(message) {
        const contentEl = document.getElementById('roiCardContent');
        if (!contentEl) return;
        
        contentEl.innerHTML = `
            <div class="roi-error">
                <i class="fas fa-exclamation-triangle"></i>
                <div style="margin-top: 8px;">
                    <strong>Unable to load ROI data</strong><br>
                    ${message}
                </div>
                <button class="roi-action-btn" onclick="sensorApp.components.roiCard.loadROIData()" style="margin-top: 12px;">
                    <i class="fas fa-refresh"></i>
                    Retry
                </button>
            </div>
        `;
    }
    
    generateSummaryText(data) {
        const progressPercentage = data.roi_percentage || 0;
        const monthsRemaining = data.payback_months_remaining || 0;
        const yearsRemaining = Math.floor(monthsRemaining / 12);
        const monthsOnly = monthsRemaining % 12;
        
        if (progressPercentage >= 100) {
            return "🎉 Congratulations! Your solar investment has fully paid for itself and is now generating pure profit.";
        } else if (progressPercentage >= 75) {
            return `💪 Excellent progress! You're in the final stretch with only ${monthsRemaining} months to go.`;
        } else if (progressPercentage >= 50) {
            return `📈 Great progress! You've recovered more than half of your investment.`;
        } else if (progressPercentage >= 25) {
            return `🌱 Good start! Your solar system is steadily paying for itself.`;
        } else {
            let timeText = '';
            if (yearsRemaining > 0) {
                timeText = yearsRemaining === 1 
                    ? "1 year" 
                    : `${yearsRemaining} years`;
                if (monthsOnly > 0) {
                    timeText += ` and ${monthsOnly} months`;
                }
            } else {
                timeText = `${monthsRemaining} months`;
            }
            return `🚀 Your solar investment is just getting started. Estimated payback in ${timeText}.`;
        }
    }
    
    async exportROIReport() {
        try {
            if (window.sensorApp) {
                window.sensorApp.showToast('Preparing ROI report...', 'info');
            }
            
            if (window.sensorApp && window.sensorApp.components.api && window.sensorApp.components.export) {
                const blob = await window.sensorApp.components.api.exportROIReport();
                
                const filename = `ROI-Report_${this.formatDateForFilename(new Date())}.xlsx`;
                await window.sensorApp.components.export.downloadBlob(blob, filename);
                
                if (window.sensorApp) {
                    window.sensorApp.showToast('ROI report downloaded successfully!', 'success');
                }
            }
        } catch (error) {
            console.error('Error exporting ROI report:', error);
            if (window.sensorApp) {
                window.sensorApp.showToast('Failed to export ROI report: ' + error.message, 'error');
            }
        }
    }
    
    setupEventListeners() {
        // Handle export button clicks in case they're not handled by onclick
        document.addEventListener('click', (e) => {
            if (e.target.matches('.roi-export-btn') || e.target.closest('.roi-export-btn')) {
                e.preventDefault();
                this.exportROIReport();
            }
        });
    }
    
    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    formatDateForFilename(date) {
        return date.toISOString().split('T')[0];
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Export for use in other components
window.ROICardComponent = ROICardComponent;