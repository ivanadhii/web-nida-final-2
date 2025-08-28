// components/data-table.js - Generic Data Table Component
class DataTableComponent {
    constructor() {
        this.currentData = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalRecords = 0;
        this.pageSize = 50;
        this.isLoading = false;
        this.sortColumn = null;
        this.sortDirection = 'desc'; // default to newest first
        this.filters = {};
    }
    
    render(config) {
        const { 
            sensorType, 
            title, 
            columns,
            showDateFilter = true,
            showExport = true 
        } = config;
        
        return `
            <div class="data-table-container">
                <!-- Table Header -->
                <div class="data-table-header">
                    <h2 class="data-table-title">
                        <i class="fas ${this.getSensorIcon(sensorType)}"></i>
                        ${title} Data
                    </h2>
                    <div class="data-table-actions">
                        ${showDateFilter ? this.renderDateFilter() : ''}
                        ${showExport ? this.renderExportButton(sensorType) : ''}
                    </div>
                </div>
                
                <!-- Filter Summary -->
                <div id="filterSummary" class="filter-summary"></div>
                
                <!-- Table Container -->
                <div class="table-responsive">
                    <table id="dataTable" class="data-table">
                        <thead>
                            ${this.renderTableHeader(columns)}
                        </thead>
                        <tbody id="tableBody">
                            ${this.renderLoadingRow(columns.length)}
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div id="tablePagination" class="table-pagination">
                    ${this.renderPagination()}
                </div>
            </div>
        `;
    }
    
    renderDateFilter() {
        return `
            <div class="date-filter">
                <div class="date-filter-presets">
                    <button class="preset-btn active" data-preset="today">Today</button>
                    <button class="preset-btn" data-preset="7days">7 Days</button>
                    <button class="preset-btn" data-preset="30days">30 Days</button>
                    <button class="preset-btn" data-preset="custom">Custom</button>
                </div>
                <div class="date-filter-inputs" style="display: none;">
                    <input type="date" id="startDate" class="date-input" />
                    <span>to</span>
                    <input type="date" id="endDate" class="date-input" />
                    <button id="applyDateFilter" class="apply-filter-btn">
                        <i class="fas fa-search"></i> Apply
                    </button>
                </div>
            </div>
        `;
    }
    
    renderExportButton(sensorType) {
        return `
            <button id="exportBtn" class="export-btn" data-sensor-type="${sensorType}">
                <i class="fas fa-download"></i>
                Export Excel
            </button>
        `;
    }
    
    renderTableHeader(columns) {
        return `
            <tr>
                ${columns.map(col => `
                    <th class="sortable ${this.sortColumn === col.key ? 'sorted-' + this.sortDirection : ''}" 
                        data-column="${col.key}">
                        ${col.label}
                        <i class="fas fa-sort sort-icon"></i>
                    </th>
                `).join('')}
            </tr>
        `;
    }
    
    renderLoadingRow(colCount) {
        return `
            <tr class="loading-row">
                <td colspan="${colCount}">
                    <div class="table-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading data...
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderNoDataRow(colCount) {
        return `
            <tr class="no-data-row">
                <td colspan="${colCount}">
                    <div class="table-no-data">
                        <i class="fas fa-inbox"></i>
                        <div>No data found</div>
                        <small>Try adjusting your date range or filters</small>
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderErrorRow(colCount, error) {
        return `
            <tr class="error-row">
                <td colspan="${colCount}">
                    <div class="table-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <div>Error loading data</div>
                        <small>${error}</small>
                        <button onclick="this.loadData()" class="retry-btn">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderPagination() {
        if (this.totalPages <= 1) return '';
        
        const pages = this.generatePageNumbers();
        
        return `
            <div class="pagination-info">
                Showing ${((this.currentPage - 1) * this.pageSize) + 1} to ${Math.min(this.currentPage * this.pageSize, this.totalRecords)} of ${this.totalRecords} records
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="sensorApp.components.dataTable.goToPage(1)">
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="sensorApp.components.dataTable.goToPage(${this.currentPage - 1})">
                    <i class="fas fa-angle-left"></i>
                </button>
                
                ${pages.map(page => 
                    page === '...' 
                        ? `<span class="pagination-ellipsis">...</span>`
                        : `<button class="pagination-btn ${page === this.currentPage ? 'active' : ''}" onclick="sensorApp.components.dataTable.goToPage(${page})">${page}</button>`
                ).join('')}
                
                <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} onclick="sensorApp.components.dataTable.goToPage(${this.currentPage + 1})">
                    <i class="fas fa-angle-right"></i>
                </button>
                <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} onclick="sensorApp.components.dataTable.goToPage(${this.totalPages})">
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
        `;
    }
    
    generatePageNumbers() {
        const pages = [];
        const maxVisiblePages = 7;
        
        if (this.totalPages <= maxVisiblePages) {
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            
            if (this.currentPage > 4) {
                pages.push('...');
            }
            
            const start = Math.max(2, this.currentPage - 1);
            const end = Math.min(this.totalPages - 1, this.currentPage + 1);
            
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }
            
            if (this.currentPage < this.totalPages - 3) {
                pages.push('...');
            }
            
            if (!pages.includes(this.totalPages)) {
                pages.push(this.totalPages);
            }
        }
        
        return pages;
    }
    
    async initialize(config) {
        this.config = config;
        this.setupEventListeners();
        
        // Set default date range (today)
        this.setDefaultDateRange();
        
        // Load initial data
        await this.loadData();
    }
    
    setupEventListeners() {
        // Date filter presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handlePresetClick(e.target.dataset.preset);
            });
        });
        
        // Custom date filter
        const applyBtn = document.getElementById('applyDateFilter');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyDateFilter();
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Table sorting
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                this.handleSort(th.dataset.column);
            });
        });
        
        // Enter key on date inputs
        document.querySelectorAll('.date-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyDateFilter();
                }
            });
        });
    }
    
    setDefaultDateRange() {
        const today = new Date().toISOString().split('T')[0];
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) startDate.value = today;
        if (endDate) endDate.value = today;
        
        this.filters.startDate = today;
        this.filters.endDate = today;
    }
    
    handlePresetClick(preset) {
        // Update active state
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-preset="${preset}"]`).classList.add('active');
        
        const customInputs = document.querySelector('.date-filter-inputs');
        
        if (preset === 'custom') {
            customInputs.style.display = 'flex';
            return;
        }
        
        customInputs.style.display = 'none';
        
        // Set date range based on preset
        const ranges = this.getDateRanges();
        const range = ranges[preset];
        
        if (range) {
            this.filters.startDate = range.startDate;
            this.filters.endDate = range.endDate;
            this.updateFilterSummary();
            this.loadData();
        }
    }
    
    getDateRanges() {
        if (window.sensorApp && window.sensorApp.components.api) {
            return window.sensorApp.components.api.getDateRanges();
        }
        
        // Fallback
        const now = new Date();
        const today = new Date(now);
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 6));
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 23));
        
        return {
            today: {
                startDate: today.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0]
            },
            '7days': {
                startDate: sevenDaysAgo.toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
            },
            '30days': {
                startDate: thirtyDaysAgo.toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
            }
        };
    }
    
    applyDateFilter() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        if (!startDate || !endDate) {
            if (window.sensorApp) {
                window.sensorApp.showToast('Please select both start and end dates', 'warning');
            }
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            if (window.sensorApp) {
                window.sensorApp.showToast('Start date must be before end date', 'error');
            }
            return;
        }
        
        this.filters.startDate = startDate;
        this.filters.endDate = endDate;
        this.currentPage = 1; // Reset to first page
        
        this.updateFilterSummary();
        this.loadData();
    }
    
    updateFilterSummary() {
        const summaryEl = document.getElementById('filterSummary');
        if (!summaryEl) return;
        
        let summary = '';
        
        if (this.filters.startDate && this.filters.endDate) {
            const start = new Date(this.filters.startDate).toLocaleDateString('id-ID');
            const end = new Date(this.filters.endDate).toLocaleDateString('id-ID');
            
            if (this.filters.startDate === this.filters.endDate) {
                summary = `Showing data for: ${start}`;
            } else {
                summary = `Showing data from: ${start} to ${end}`;
            }
        }
        
        summaryEl.innerHTML = summary ? `<i class="fas fa-filter"></i> ${summary}` : '';
    }
    
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const tableBody = document.getElementById('tableBody');
        
        if (tableBody) {
            tableBody.innerHTML = this.renderLoadingRow(this.config.columns.length);
        }
        
        try {
            const options = {
                page: this.currentPage,
                limit: this.pageSize,
                startDate: this.filters.startDate,
                endDate: this.filters.endDate
            };
            
            if (window.sensorApp && window.sensorApp.components.api) {
                const result = await window.sensorApp.components.api.getSensorData(this.config.sensorType, options);
                
                if (result.success) {
                    this.currentData = result.data.records || [];
                    this.totalRecords = result.data.total_records || 0;
                    this.totalPages = result.data.total_pages || 1;
                    
                    this.renderTableData();
                    this.updatePagination();
                } else {
                    throw new Error(result.error || 'Failed to load data');
                }
            }
        } catch (error) {
            console.error('Error loading table data:', error);
            
            if (tableBody) {
                tableBody.innerHTML = this.renderErrorRow(this.config.columns.length, error.message);
            }
            
            if (window.sensorApp) {
                window.sensorApp.showToast(`Failed to load data: ${error.message}`, 'error');
            }
        } finally {
            this.isLoading = false;
        }
    }
    
    renderTableData() {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;
        
        if (this.currentData.length === 0) {
            tableBody.innerHTML = this.renderNoDataRow(this.config.columns.length);
            return;
        }
        
        const rows = this.currentData.map((record, index) => {
            const rowClass = index % 2 === 0 ? 'even' : 'odd';
            
            return `
                <tr class="table-row ${rowClass}">
                    ${this.config.columns.map(col => `
                        <td class="table-cell" data-label="${col.label}">
                            ${this.formatCellValue(record, col)}
                        </td>
                    `).join('')}
                </tr>
            `;
        });
        
        tableBody.innerHTML = rows.join('');
    }
    
    formatCellValue(record, column) {
        let value = this.getNestedValue(record, column.key);
        
        if (value === null || value === undefined) {
            return '<span class="null-value">-</span>';
        }
        
        // Apply column-specific formatting
        switch (column.type) {
            case 'timestamp':
                return this.formatTimestamp(value);
            case 'number':
                return this.formatNumber(value, column.decimals || 2);
            case 'currency':
                return this.formatCurrency(value);
            case 'percentage':
                return this.formatPercentage(value);
            case 'status':
                return this.formatStatus(value);
            case 'energy':
                return this.formatEnergy(value);
            case 'voltage':
                return this.formatVoltage(value);
            case 'current':
                return this.formatCurrent(value);
            case 'power':
                return this.formatPower(value);
            case 'temperature':
                return this.formatTemperature(value);
            case 'humidity':
                return this.formatHumidity(value);
            default:
                return String(value);
        }
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    // Formatting methods
    formatTimestamp(value) {
        return new Date(value).toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    formatNumber(value, decimals = 2) {
        return Number(value).toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    formatCurrency(value) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    }
    
    formatPercentage(value) {
        return `${this.formatNumber(value, 1)}%`;
    }
    
    formatStatus(value) {
        const statusClass = value === 'success' ? 'status-success' : 'status-error';
        return `<span class="status-indicator ${statusClass}">${value}</span>`;
    }
    
    formatEnergy(value) {
        return `${this.formatNumber(value, 3)} kWh`;
    }
    
    formatVoltage(value) {
        return `${this.formatNumber(value, 1)} V`;
    }
    
    formatCurrent(value) {
        return `${this.formatNumber(value, 3)} A`;
    }
    
    formatPower(value) {
        return `${this.formatNumber(value, 1)} W`;
    }
    
    formatTemperature(value) {
        return `${this.formatNumber(value, 1)}°C`;
    }
    
    formatHumidity(value) {
        return `${this.formatNumber(value, 1)}%`;
    }
    
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'desc';
        }
        
        // Update sort indicators
        document.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        
        const currentTh = document.querySelector(`[data-column="${column}"]`);
        if (currentTh) {
            currentTh.classList.add(`sorted-${this.sortDirection}`);
        }
        
        // Reset to first page and reload data
        this.currentPage = 1;
        this.loadData();
    }
    
    async goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) {
            return;
        }
        
        this.currentPage = page;
        await this.loadData();
    }
    
    updatePagination() {
        const paginationEl = document.getElementById('tablePagination');
        if (paginationEl) {
            paginationEl.innerHTML = this.renderPagination();
        }
    }
    
    async exportData() {
        try {
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.disabled = true;
                exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            }
            
            const options = {
                startDate: this.filters.startDate,
                endDate: this.filters.endDate
            };
            
            if (window.sensorApp && window.sensorApp.components.export) {
                await window.sensorApp.components.export.exportSensorData(this.config.sensorType, options);
            }
            
        } catch (error) {
            console.error('Export error:', error);
            if (window.sensorApp) {
                window.sensorApp.showToast(`Export failed: ${error.message}`, 'error');
            }
        } finally {
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Excel';
            }
        }
    }
    
    getSensorIcon(sensorType) {
        const icons = {
            'pzem016': 'fa-plug',
            'pzem017': 'fa-sun',
            'dht22': 'fa-thermometer-half',
            'system': 'fa-server'
        };
        return icons[sensorType] || 'fa-database';
    }
    
    getStyles() {
        return `
            <style>
                .data-table-container {
                    background: var(--card-bg);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                }
                
                .data-table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                
                .data-table-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .data-table-title i {
                    color: var(--primary-color);
                }
                
                .data-table-actions {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                
                /* Date Filter Styles */
                .date-filter {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .date-filter-presets {
                    display: flex;
                    gap: 8px;
                }
                
                .preset-btn {
                    padding: 8px 16px;
                    border: 2px solid var(--border-color);
                    background: white;
                    color: var(--text-secondary);
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .preset-btn:hover {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }
                
                .preset-btn.active {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: white;
                }
                
                .date-filter-inputs {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 8px;
                }
                
                .date-input {
                    padding: 8px 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 0.9rem;
                    transition: border-color 0.3s ease;
                }
                
                .date-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                }
                
                .apply-filter-btn {
                    padding: 8px 16px;
                    background: var(--success-color);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .apply-filter-btn:hover {
                    background: #059669;
                    transform: translateY(-1px);
                }
                
                /* Export Button */
                .export-btn {
                    padding: 10px 20px;
                    background: var(--info-color);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .export-btn:hover:not(:disabled) {
                    background: #0891b2;
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .export-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                /* Filter Summary */
                .filter-summary {
                    background: var(--surface-color);
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    border-left: 4px solid var(--info-color);
                }
                
                /* Table Styles */
                .table-responsive {
                    overflow-x: auto;
                    margin-bottom: 20px;
                }
                
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }
                
                .data-table th {
                    background: var(--surface-color);
                    padding: 16px 12px;
                    text-align: left;
                    font-weight: 600;
                    color: var(--text-primary);
                    border-bottom: 2px solid var(--border-color);
                    position: relative;
                    user-select: none;
                }
                
                .data-table th.sortable {
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                
                .data-table th.sortable:hover {
                    background: #e2e8f0;
                }
                
                .sort-icon {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0.5;
                    transition: opacity 0.3s ease;
                }
                
                .sortable:hover .sort-icon {
                    opacity: 0.8;
                }
                
                .sorted-asc .sort-icon::before {
                    content: "\f0de"; /* fa-sort-up */
                    opacity: 1;
                    color: var(--primary-color);
                }
                
                .sorted-desc .sort-icon::before {
                    content: "\f0dd"; /* fa-sort-down */
                    opacity: 1;
                    color: var(--primary-color);
                }
                
                .data-table td {
                    padding: 16px 12px;
                    border-bottom: 1px solid var(--border-color);
                    color: var(--text-primary);
                }
                
                .table-row:hover {
                    background: var(--surface-color);
                }
                
                .table-row.even {
                    background: rgba(248, 250, 252, 0.5);
                }
                
                .null-value {
                    color: var(--text-muted);
                    font-style: italic;
                }
                
                .status-indicator {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .status-success {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .status-error {
                    background: #fecaca;
                    color: #991b1b;
                }
                
                /* Loading/Error/No Data States */
                .table-loading,
                .table-no-data,
                .table-error {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-muted);
                }
                
                .table-loading i,
                .table-no-data i,
                .table-error i {
                    font-size: 2rem;
                    margin-bottom: 12px;
                    display: block;
                }
                
                .table-error {
                    color: var(--error-color);
                }
                
                .retry-btn {
                    margin-top: 12px;
                    padding: 8px 16px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: background 0.3s ease;
                }
                
                .retry-btn:hover {
                    background: var(--primary-dark);
                }
                
                /* Pagination Styles */
                .table-pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 20px;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                
                .pagination-info {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }
                
                .pagination-controls {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .pagination-btn {
                    padding: 8px 12px;
                    border: 1px solid var(--border-color);
                    background: white;
                    color: var(--text-secondary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    min-width: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .pagination-btn:hover:not(:disabled) {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }
                
                .pagination-btn.active {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: white;
                }
                
                .pagination-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .pagination-ellipsis {
                    padding: 8px 4px;
                    color: var(--text-muted);
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .data-table-header {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .data-table-actions {
                        flex-direction: column;
                    }
                    
                    .date-filter-presets {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .data-table {
                        font-size: 0.8rem;
                    }
                    
                    .data-table th,
                    .data-table td {
                        padding: 12px 8px;
                    }
                    
                    .table-pagination {
                        flex-direction: column;
                        text-align: center;
                    }
                }
                
                @media (max-width: 480px) {
                    .data-table-container {
                        padding: 16px;
                    }
                    
                    /* Stack table on mobile */
                    .data-table,
                    .data-table thead,
                    .data-table tbody,
                    .data-table th,
                    .data-table td,
                    .data-table tr {
                        display: block;
                    }
                    
                    .data-table thead tr {
                        position: absolute;
                        top: -9999px;
                        left: -9999px;
                    }
                    
                    .data-table tr {
                        background: white;
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        margin-bottom: 16px;
                        padding: 16px;
                    }
                    
                    .data-table td {
                        border: none;
                        position: relative;
                        padding: 8px 0;
                        border-bottom: 1px solid var(--border-color);
                    }
                    
                    .data-table td:last-child {
                        border-bottom: none;
                    }
                    
                    .data-table td:before {
                        content: attr(data-label) ": ";
                        font-weight: 600;
                        color: var(--text-secondary);
                        display: inline-block;
                        width: 120px;
                        flex-shrink: 0;
                    }
                    
                    .pagination-controls {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                }
            </style>
        `;
    }
}

// Export for use in other components
window.DataTableComponent = DataTableComponent;