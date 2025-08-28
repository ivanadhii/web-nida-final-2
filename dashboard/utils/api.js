// utils/api.js - Centralized API Utilities
class APIUtils {
    constructor() {
        this.baseURL = 'https://api-nida.meltedcloud.cloud/api';
        this.defaultTimeout = 30000; // 30 seconds
    }
    
    // Generic API call method
    async apiCall(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.defaultTimeout
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            console.log(`API Call: ${config.method} ${url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`API Response:`, result);
            
            return result;
            
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }
    
    // ============ EXISTING API METHODS ============
    
    async getLatestData(limit = 50) {
        return await this.apiCall(`/latest?limit=${limit}`);
    }
    
    async getSummary() {
        return await this.apiCall('/summary');
    }
    
    async getTimeSeries(sensorType, hours = 24) {
        return await this.apiCall(`/timeseries/${sensorType}?hours=${hours}`);
    }
    
    async getPowerFlow() {
        return await this.apiCall('/power_flow');
    }
    
    async getAnalysis() {
        return await this.apiCall('/analysis');
    }
    
    async getHealth() {
        return await this.apiCall('/health');
    }
    
    // ============ NEW API METHODS FOR HISTORICAL DATA ============
    
    async getSensorData(sensorType, options = {}) {
        const params = new URLSearchParams();
        
        if (options.startDate) params.append('start_date', options.startDate);
        if (options.endDate) params.append('end_date', options.endDate);
        if (options.page) params.append('page', options.page);
        if (options.limit) params.append('limit', options.limit || 50);
        
        const endpoint = `/data/${sensorType}?${params.toString()}`;
        return await this.apiCall(endpoint);
    }
    
    async exportSensorData(sensorType, options = {}) {
        const params = new URLSearchParams();
        
        if (options.startDate) params.append('start_date', options.startDate);
        if (options.endDate) params.append('end_date', options.endDate);
        params.append('format', 'excel');
        
        const endpoint = `/export/${sensorType}?${params.toString()}`;
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }
            
            return response.blob();
            
        } catch (error) {
            console.error(`Export Error for ${sensorType}:`, error);
            throw error;
        }
    }
    
    // ============ ROI API METHODS ============
    
    async getROISummary() {
        return await this.apiCall('/roi/summary');
    }
    
    async getROIDetailed(options = {}) {
        const params = new URLSearchParams();
        
        if (options.startDate) params.append('start_date', options.startDate);
        if (options.endDate) params.append('end_date', options.endDate);
        if (options.groupBy) params.append('group_by', options.groupBy); // daily, monthly
        
        const endpoint = `/roi/detailed?${params.toString()}`;
        return await this.apiCall(endpoint);
    }
    
    async getROISettings() {
        return await this.apiCall('/roi/settings');
    }
    
    async updateROISettings(settings) {
        return await this.apiCall('/roi/settings', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }
    
    async exportROIReport(options = {}) {
        const params = new URLSearchParams();
        
        if (options.startDate) params.append('start_date', options.startDate);
        if (options.endDate) params.append('end_date', options.endDate);
        params.append('format', 'excel');
        
        const endpoint = `/roi/export?${params.toString()}`;
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            });
            
            if (!response.ok) {
                throw new Error(`ROI Export failed: ${response.statusText}`);
            }
            
            return response.blob();
            
        } catch (error) {
            console.error('ROI Export Error:', error);
            throw error;
        }
    }
    
    // ============ UTILITY METHODS ============
    
    // Format date untuk API calls (YYYY-MM-DD)
    formatDateForAPI(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toISOString().split('T')[0];
    }
    
    // Get default date ranges
    getDateRanges() {
        const now = new Date();
        const today = new Date(now);
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 6)); // -1 + -6 = -7 total
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 23)); // -7 + -23 = -30 total
        
        return {
            today: {
                label: 'Today',
                startDate: this.formatDateForAPI(today),
                endDate: this.formatDateForAPI(today)
            },
            yesterday: {
                label: 'Yesterday', 
                startDate: this.formatDateForAPI(yesterday),
                endDate: this.formatDateForAPI(yesterday)
            },
            last7days: {
                label: 'Last 7 Days',
                startDate: this.formatDateForAPI(sevenDaysAgo),
                endDate: this.formatDateForAPI(new Date())
            },
            last30days: {
                label: 'Last 30 Days',
                startDate: this.formatDateForAPI(thirtyDaysAgo),
                endDate: this.formatDateForAPI(new Date())
            }
        };
    }
    
    // Validate date range
    validateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        
        if (start > end) {
            throw new Error('Start date must be before end date');
        }
        
        if (end > now) {
            throw new Error('End date cannot be in the future');
        }
        
        // Check if range is too large (more than 1 year)
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 365) {
            throw new Error('Date range cannot exceed 1 year');
        }
        
        return true;
    }
    
    // Handle API errors consistently
    handleAPIError(error, context = '') {
        let message = 'An error occurred';
        
        if (error.name === 'AbortError') {
            message = 'Request timed out. Please try again.';
        } else if (error.message.includes('HTTP')) {
            message = `Server error: ${error.message}`;
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            message = 'Network error. Please check your connection.';
        } else {
            message = error.message || 'Unknown error occurred';
        }
        
        if (context) {
            message = `${context}: ${message}`;
        }
        
        // Show toast notification if available
        if (window.sensorApp) {
            window.sensorApp.showToast(message, 'error');
        }
        
        return message;
    }
    
    // Retry mechanism for failed requests
    async withRetry(apiCallFunction, maxRetries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await apiCallFunction();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                
                console.warn(`API call attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
    }
    
    // Batch API calls for multiple sensors
    async getBatchSensorData(sensorTypes, options = {}) {
        const promises = sensorTypes.map(sensorType => 
            this.getSensorData(sensorType, options)
        );
        
        try {
            const results = await Promise.allSettled(promises);
            
            return sensorTypes.reduce((acc, sensorType, index) => {
                const result = results[index];
                acc[sensorType] = result.status === 'fulfilled' 
                    ? result.value 
                    : { error: result.reason.message };
                return acc;
            }, {});
            
        } catch (error) {
            console.error('Batch API call failed:', error);
            throw error;
        }
    }
}

// Export for use in other components
window.APIUtils = APIUtils;