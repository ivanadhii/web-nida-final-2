// components/sidebar.js - Sidebar Component
class SidebarComponent {
    constructor() {
        this.collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    }
    
    render() {
        return `
            <!-- Sidebar Overlay for Mobile -->
            <div id="sidebar-overlay" class="sidebar-overlay"></div>
            
            <!-- Main Sidebar -->
            <div id="sidebar" class="sidebar ${this.collapsed ? 'collapsed' : ''}">
                <!-- Sidebar Header -->
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <i class="fas fa-solar-panel"></i>
                        <span class="sidebar-logo-text">Solar Monitor</span>
                    </div>
                    <button id="sidebar-collapse" class="sidebar-collapse-btn" title="Toggle Sidebar">
                        <i class="fas fa-angle-left"></i>
                    </button>
                </div>
                
                <!-- Sidebar Menu -->
                <nav class="sidebar-nav">
                    <div class="sidebar-section">
                        <div class="sidebar-section-title">
                            <i class="fas fa-chart-line"></i>
                            <span>Dashboard</span>
                        </div>
                        <ul class="sidebar-menu">
                            <li>
                                <a href="/" class="sidebar-menu-item active" data-route="dashboard">
                                    <i class="fas fa-tachometer-alt"></i>
                                    <span class="sidebar-menu-text">Overview</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="sidebar-section">
                        <div class="sidebar-section-title">
                            <i class="fas fa-database"></i>
                            <span>Historical Data</span>
                        </div>
                        <ul class="sidebar-menu">
                            <li>
                                <a href="/pzem016" class="sidebar-menu-item" data-route="pzem016">
                                    <i class="fas fa-plug"></i>
                                    <span class="sidebar-menu-text">PZEM-016 (AC)</span>
                                    <div class="sidebar-menu-badge">AC Power</div>
                                </a>
                            </li>
                            <li>
                                <a href="/pzem017" class="sidebar-menu-item" data-route="pzem017">
                                    <i class="fas fa-sun"></i>
                                    <span class="sidebar-menu-text">PZEM-017 (DC)</span>
                                    <div class="sidebar-menu-badge">Solar</div>
                                </a>
                            </li>
                            <li>
                                <a href="/dht22" class="sidebar-menu-item" data-route="dht22">
                                    <i class="fas fa-thermometer-half"></i>
                                    <span class="sidebar-menu-text">DHT22</span>
                                    <div class="sidebar-menu-badge">Environment</div>
                                </a>
                            </li>
                            <li>
                                <a href="/system" class="sidebar-menu-item" data-route="system">
                                    <i class="fas fa-server"></i>
                                    <span class="sidebar-menu-text">System</span>
                                    <div class="sidebar-menu-badge">Resources</div>
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="sidebar-section">
                        <div class="sidebar-section-title">
                            <i class="fas fa-dollar-sign"></i>
                            <span>Financial</span>
                        </div>
                        <ul class="sidebar-menu">
                            <li>
                                <a href="/roi-settings" class="sidebar-menu-item" data-route="roi-settings">
                                    <i class="fas fa-cog"></i>
                                    <span class="sidebar-menu-text">ROI Settings</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
                
                <!-- Sidebar Footer -->
                <div class="sidebar-footer">
                    <div class="sidebar-status">
                        <div class="status-indicator online"></div>
                        <span class="status-text">System Online</span>
                    </div>
                    <div class="sidebar-version">v2.0</div>
                </div>
            </div>
        `;
    }
    
    getStyles() {
        return `
            <style>
                /* Sidebar Overlay */
                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 998;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .sidebar-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                /* Main Sidebar */
                .sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 280px;
                    height: 100vh;
                    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
                    border-right: 1px solid var(--border-color);
                    box-shadow: var(--shadow-lg);
                    z-index: 999;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .sidebar.collapsed {
                    width: 70px;
                }
                
                /* Mobile Styles */
                @media (max-width: 768px) {
                    .sidebar.mobile-mode {
                        transform: translateX(0);
                    }
                    
                    .sidebar.mobile-mode.mobile-hidden {
                        transform: translateX(-100%);
                    }
                }
                
                /* Sidebar Header */
                .sidebar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 16px;
                    border-bottom: 1px solid var(--border-color);
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
                    color: white;
                    min-height: 80px;
                }
                
                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 1.2rem;
                    font-weight: 700;
                    transition: opacity 0.3s ease;
                }
                
                .sidebar.collapsed .sidebar-logo-text {
                    display: none;
                }
                
                .sidebar-collapse-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .sidebar-collapse-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .sidebar.collapsed .sidebar-collapse-btn i {
                    transform: rotate(180deg);
                }
                
                /* Sidebar Navigation */
                .sidebar-nav {
                    flex: 1;
                    padding: 20px 0;
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                
                .sidebar-section {
                    margin-bottom: 24px;
                }
                
                .sidebar-section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-muted);
                    margin-bottom: 8px;
                    transition: opacity 0.3s ease;
                }
                
                .sidebar.collapsed .sidebar-section-title span {
                    display: none;
                }
                
                .sidebar.collapsed .sidebar-section-title {
                    justify-content: center;
                    padding: 8px;
                }
                
                .sidebar-menu {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .sidebar-menu li {
                    margin-bottom: 4px;
                }
                
                .sidebar-menu-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    color: var(--text-secondary);
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 0 12px;
                    transition: all 0.3s ease;
                    position: relative;
                    gap: 12px;
                    font-weight: 500;
                }
                
                .sidebar-menu-item:hover {
                    background: var(--surface-color);
                    color: var(--text-primary);
                    transform: translateX(2px);
                }
                
                .sidebar-menu-item.active {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
                    color: white;
                    box-shadow: var(--shadow-md);
                }
                
                .sidebar-menu-item.active:hover {
                    transform: translateX(2px);
                    background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
                }
                
                .sidebar-menu-item i {
                    width: 20px;
                    text-align: center;
                    font-size: 1.1rem;
                }
                
                .sidebar-menu-text {
                    flex: 1;
                    transition: opacity 0.3s ease;
                }
                
                .sidebar.collapsed .sidebar-menu-text {
                    display: none;
                }
                
                .sidebar-menu-badge {
                    background: var(--info-color);
                    color: white;
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-weight: 600;
                    transition: opacity 0.3s ease;
                }
                
                .sidebar.collapsed .sidebar-menu-badge {
                    display: none;
                }
                
                .sidebar.collapsed .sidebar-menu-item {
                    justify-content: center;
                    padding: 12px;
                    margin: 0 8px;
                }
                
                /* Tooltip for collapsed state */
                .sidebar.collapsed .sidebar-menu-item {
                    position: relative;
                }
                
                .sidebar.collapsed .sidebar-menu-item::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    background: var(--dark-bg);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    margin-left: 8px;
                    z-index: 1000;
                }
                
                .sidebar.collapsed .sidebar-menu-item:hover::after {
                    opacity: 1;
                    visibility: visible;
                }
                
                /* Sidebar Footer */
                .sidebar-footer {
                    padding: 16px 20px;
                    border-top: 1px solid var(--border-color);
                    background: var(--surface-color);
                }
                
                .sidebar-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    transition: opacity 0.3s ease;
                }
                
                .sidebar.collapsed .sidebar-status {
                    justify-content: center;
                }
                
                .sidebar.collapsed .status-text {
                    display: none;
                }
                
                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--success-color);
                    animation: pulse-dot 2s infinite;
                }
                
                .status-indicator.offline {
                    background: var(--error-color);
                    animation: none;
                }
                
                @keyframes pulse-dot {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .status-text {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    font-weight: 500;
                }
                
                .sidebar-version {
                    text-align: center;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    transition: opacity 0.3s ease;
                }
                
                .sidebar.collapsed .sidebar-version {
                    display: none;
                }
                
                /* Mobile Hamburger Button */
                .mobile-menu-toggle {
                    display: none;
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    z-index: 1001;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    cursor: pointer;
                    box-shadow: var(--shadow-lg);
                    transition: all 0.3s ease;
                }
                
                .mobile-menu-toggle:hover {
                    background: var(--primary-dark);
                    transform: scale(1.05);
                }
                
                @media (max-width: 768px) {
                    .mobile-menu-toggle {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .sidebar {
                        width: 280px;
                        transform: translateX(-100%);
                    }
                    
                    .sidebar.mobile-mode {
                        transform: translateX(0);
                    }
                }
                
                /* Scrollbar Styling */
                .sidebar-nav::-webkit-scrollbar {
                    width: 4px;
                }
                
                .sidebar-nav::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .sidebar-nav::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 2px;
                }
                
                .sidebar-nav::-webkit-scrollbar-thumb:hover {
                    background: var(--text-muted);
                }
            </style>
        `;
    }
    
    initialize() {
        // Add tooltips to collapsed menu items
        this.addTooltips();
        
        // Update system status
        this.updateSystemStatus();
        
        // Set up periodic status updates
        setInterval(() => {
            this.updateSystemStatus();
        }, 30000); // Update every 30 seconds
    }
    
    addTooltips() {
        const menuItems = document.querySelectorAll('.sidebar-menu-item');
        menuItems.forEach(item => {
            const text = item.querySelector('.sidebar-menu-text')?.textContent;
            if (text) {
                item.setAttribute('data-tooltip', text);
            }
        });
    }
    
    async updateSystemStatus() {
        try {
            if (window.sensorApp && window.sensorApp.components.api) {
                const health = await window.sensorApp.components.api.getHealth();
                const statusIndicator = document.querySelector('.status-indicator');
                const statusText = document.querySelector('.status-text');
                
                if (health.success && health.status === 'healthy') {
                    statusIndicator?.classList.remove('offline');
                    statusIndicator?.classList.add('online');
                    if (statusText) statusText.textContent = 'System Online';
                } else {
                    statusIndicator?.classList.remove('online');
                    statusIndicator?.classList.add('offline');
                    if (statusText) statusText.textContent = 'System Offline';
                }
            }
        } catch (error) {
            const statusIndicator = document.querySelector('.status-indicator');
            const statusText = document.querySelector('.status-text');
            
            statusIndicator?.classList.remove('online');
            statusIndicator?.classList.add('offline');
            if (statusText) statusText.textContent = 'Connection Error';
        }
    }
}

// Export for use in other components
window.SidebarComponent = SidebarComponent;