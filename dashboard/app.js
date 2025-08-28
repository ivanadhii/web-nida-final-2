// app.js - Main SPA Router & Application Logic
class SensorMonitoringApp {
    constructor() {
        this.currentRoute = '';
        this.sidebarCollapsed = false;
        this.components = {};
        
        // Initialize app
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Sensor Monitoring SPA...');
        
        // Load components
        await this.loadComponents();
        
        // Setup routing
        this.setupRouting();
        
        // Setup sidebar
        this.setupSidebar();
        
        // Handle initial route
        this.handleRoute();
        
        // Setup mobile responsive
        this.setupMobileHandlers();
        
        console.log('✅ SPA initialized successfully');
    }
    
    async loadComponents() {
        try {
            // Import all components
            const componentScripts = [
                'components/sidebar.js',
                'components/dashboard.js', 
                'components/roi-card.js',
                'components/data-table.js',
                'components/date-filter.js',
                'pages/pzem016.js',
                'pages/pzem017.js', 
                'pages/dht22.js',
                'pages/system.js',
                'pages/roi-settings.js',
                'utils/api.js',
                'utils/export.js',
                'modals/tariff-change-modal.js'
            ];
            
            // Load all component scripts
            await Promise.all(componentScripts.map(src => this.loadScript(src)));
            
            // Initialize component instances
            this.components = {
                sidebar: new SidebarComponent(),
                dashboard: new DashboardComponent(),
                roiCard: new ROICardComponent(),
                dataTable: new DataTableComponent(),
                dateFilter: new DateFilterComponent(),
                pzem016: new PZEM016Page(),
                pzem017: new PZEM017Page(),
                dht22: new DHT22Page(),
                system: new SystemPage(),
                roiSettings: new ROISettingsPage(),
                api: new APIUtils(),
                export: new ExportUtils(),
                tariffModal: new TariffChangeModal()
            };
            
        } catch (error) {
            console.error('Error loading components:', error);
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupRouting() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        
        // Handle route clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                this.navigateTo(route);
            }
        });
    }
    
    setupSidebar() {
        // Sidebar toggle functionality
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
        
        // Collapse button
        const collapseBtn = document.getElementById('sidebar-collapse');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.toggleSidebarCollapse();
            });
        }
    }
    
    setupMobileHandlers() {
        // Handle window resize for responsive behavior
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Initial resize check
        this.handleResize();
    }
    
    handleResize() {
        const isMobile = window.innerWidth < 768;
        const sidebar = document.getElementById('sidebar');
        
        if (sidebar) {
            if (isMobile) {
                sidebar.classList.add('mobile-mode');
                this.closeSidebar();
            } else {
                sidebar.classList.remove('mobile-mode');
                sidebar.classList.remove('mobile-hidden');
            }
        }
    }
    
    navigateTo(route) {
        // Update URL without page reload
        window.history.pushState({}, '', route === 'dashboard' ? '/' : `/${route}`);
        this.handleRoute();
    }
    
    handleRoute() {
        const path = window.location.pathname;
        let route = 'dashboard';
        
        // Parse route from URL
        if (path === '/' || path === '/dashboard') {
            route = 'dashboard';
        } else if (path.startsWith('/')) {
            route = path.substring(1);
        }
        
        this.currentRoute = route;
        this.renderRoute(route);
        this.updateSidebarActive(route);
        
        // Close mobile sidebar after navigation
        if (window.innerWidth < 768) {
            this.closeSidebar();
        }
    }
    
    async renderRoute(route) {
        const appContent = document.getElementById('app-content');
        if (!appContent) return;
        
        // Show loading state
        appContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                Loading ${route}...
            </div>
        `;
        
        try {
            let content = '';
            
            switch (route) {
                case 'dashboard':
                    content = await this.components.dashboard.render();
                    break;
                case 'pzem016':
                    content = await this.components.pzem016.render();
                    break;
                case 'pzem017':
                    content = await this.components.pzem017.render();
                    break;
                case 'dht22':
                    content = await this.components.dht22.render();
                    break;
                case 'system':
                    content = await this.components.system.render();
                    break;
                case 'roi-settings':
                    content = await this.components.roiSettings.render();
                    break;
                default:
                    content = `<div class="error">Page not found: ${route}</div>`;
            }
            
            appContent.innerHTML = content;
            
            // Initialize page-specific functionality
            await this.initializePage(route);
            
        } catch (error) {
            console.error(`Error rendering route ${route}:`, error);
            appContent.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-circle"></i>
                    Error loading page: ${error.message}
                </div>
            `;
        }
    }
    
    async initializePage(route) {
        try {
            switch (route) {
                case 'dashboard':
                    await this.components.dashboard.initialize();
                    break;
                case 'pzem016':
                    await this.components.pzem016.initialize();
                    break;
                case 'pzem017':
                    await this.components.pzem017.initialize();
                    break;
                case 'dht22':
                    await this.components.dht22.initialize();
                    break;
                case 'system':
                    await this.components.system.initialize();
                    break;
                case 'roi-settings':
                    await this.components.roiSettings.initialize();
                    break;
            }
        } catch (error) {
            console.error(`Error initializing page ${route}:`, error);
        }
    }
    
    updateSidebarActive(route) {
        // Remove active class from all menu items
        document.querySelectorAll('.sidebar-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current route
        const activeItem = document.querySelector(`[data-route="${route}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.toggle('mobile-hidden');
            overlay?.classList.toggle('active');
        }
    }
    
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.add('mobile-hidden');
            overlay?.classList.remove('active');
        }
    }
    
    toggleSidebarCollapse() {
        const sidebar = document.getElementById('sidebar');
        
        if (sidebar) {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
            
            // Save state to localStorage
            localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
        }
    }
    
    // Utility methods for components to use
    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
    
    formatNumber(number, decimals = 2) {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }
    
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('id-ID');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sensorApp = new SensorMonitoringApp();
});

// Export for other components to use
window.SensorMonitoringApp = SensorMonitoringApp;