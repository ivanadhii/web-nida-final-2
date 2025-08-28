// utils/export.js - Excel Export Utilities
class ExportUtils {
    constructor() {
        this.sensorTypeNames = {
            'pzem016': 'PZEM-016 (AC Power)',
            'pzem017': 'PZEM-017 (DC Solar)', 
            'dht22': 'DHT22 (Environment)',
            'system': 'System Resources'
        };
    }
    
    // Download blob as file
    async downloadBlob(blob, filename) {
        try {
            // Create download URL
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary download link
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            // Add to DOM, click, and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Cleanup URL
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
            
            console.log(`Successfully downloaded: ${filename}`);
            
        } catch (error) {
            console.error('Error downloading file:', error);
            throw new Error(`Download failed: ${error.message}`);
        }
    }
    
    // Export sensor data to Excel
    async exportSensorData(sensorType, options = {}) {
        try {
            // Show loading toast
            if (window.sensorApp) {
                window.sensorApp.showToast('Preparing export...', 'info');
            }
            
            // Validate date range if provided
            if (options.startDate && options.endDate) {
                if (window.sensorApp && window.sensorApp.components.api) {
                    window.sensorApp.components.api.validateDateRange(options.startDate, options.endDate);
                }
            }
            
            // Get data from API
            if (window.sensorApp && window.sensorApp.components.api) {
                const blob = await window.sensorApp.components.api.exportSensorData(sensorType, options);
                
                // Generate filename
                const filename = this.generateSensorFilename(sensorType, options);
                
                // Download file
                await this.downloadBlob(blob, filename);
                
                // Show success toast
                if (window.sensorApp) {
                    window.sensorApp.showToast(`${this.sensorTypeNames[sensorType]} data exported successfully!`, 'success');
                }
                
                return filename;
            }
            
        } catch (error) {
            console.error(`Error exporting ${sensorType} data:`, error);
            
            // Show error toast
            if (window.sensorApp) {
                window.sensorApp.showToast(`Export failed: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }
    
    // Export ROI report to Excel
    async exportROIReport(options = {}) {
        try {
            // Show loading toast
            if (window.sensorApp) {
                window.sensorApp.showToast('Generating ROI report...', 'info');
            }
            
            // Get ROI data from API
            if (window.sensorApp && window.sensorApp.components.api) {
                const blob = await window.sensorApp.components.api.exportROIReport(options);
                
                // Generate filename
                const filename = this.generateROIFilename(options);
                
                // Download file
                await this.downloadBlob(blob, filename);
                
                // Show success toast
                if (window.sensorApp) {
                    window.sensorApp.showToast('ROI report exported successfully!', 'success');
                }
                
                return filename;
            }
            
        } catch (error) {
            console.error('Error exporting ROI report:', error);
            
            // Show error toast
            if (window.sensorApp) {
                window.sensorApp.showToast(`ROI export failed: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }
    
    // Generate filename for sensor data export
    generateSensorFilename(sensorType, options = {}) {
        const sensorName = sensorType.toUpperCase();
        const now = new Date();
        
        let filename = `${sensorName}_`;
        
        if (options.startDate && options.endDate) {
            filename += `${options.startDate}_to_${options.endDate}`;
        } else if (options.startDate) {
            filename += `from_${options.startDate}`;
        } else if (options.endDate) {
            filename += `until_${options.endDate}`;
        } else {
            // Default to current date
            filename += this.formatDateForFilename(now);
        }
        
        filename += '.xlsx';
        return filename;
    }
    
    // Generate filename for ROI report
    generateROIFilename(options = {}) {
        const now = new Date();
        
        let filename = 'ROI-Report_';
        
        if (options.startDate && options.endDate) {
            filename += `${options.startDate}_to_${options.endDate}`;
        } else {
            // Default to current date
            filename += this.formatDateForFilename(now);
        }
        
        filename += '.xlsx';
        return filename;
    }
    
    // Client-side CSV export (fallback if backend export fails)
    exportToCSV(data, filename, headers = null) {
        try {
            if (!data || data.length === 0) {
                throw new Error('No data to export');
            }
            
            let csvContent = '';
            
            // Add headers
            if (headers) {
                csvContent += headers.join(',') + '\n';
            } else if (data[0]) {
                // Auto-generate headers from first object
                csvContent += Object.keys(data[0]).join(',') + '\n';
            }
            
            // Add data rows
            data.forEach(row => {
                const values = Object.values(row).map(value => {
                    // Escape commas and quotes in values
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                });
                csvContent += values.join(',') + '\n';
            });
            
            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const csvFilename = filename.replace('.xlsx', '.csv');
            
            this.downloadBlob(blob, csvFilename);
            
            if (window.sensorApp) {
                window.sensorApp.showToast(`Data exported as CSV: ${csvFilename}`, 'success');
            }
            
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            
            if (window.sensorApp) {
                window.sensorApp.showToast(`CSV export failed: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }
    
    // Export current dashboard view as image (bonus feature)
    async exportDashboardImage(elementId = 'app-content') {
        try {
            // This would require html2canvas library to be loaded
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas library not available');
            }
            
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error('Element not found');
            }
            
            // Show loading toast
            if (window.sensorApp) {
                window.sensorApp.showToast('Capturing dashboard...', 'info');
            }
            
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher resolution
                logging: false,
                useCORS: true
            });
            
            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 0.9);
            });
            
            // Download
            const filename = `Dashboard_${this.formatDateForFilename(new Date())}.png`;
            await this.downloadBlob(blob, filename);
            
            if (window.sensorApp) {
                window.sensorApp.showToast('Dashboard image exported successfully!', 'success');
            }
            
        } catch (error) {
            console.error('Error exporting dashboard image:', error);
            
            if (window.sensorApp) {
                window.sensorApp.showToast(`Image export failed: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }
    
    // Utility methods for formatting
    formatDateForFilename(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    formatTimestampForFilename(date) {
        return date.toISOString().replace(/[:.]/g, '-').split('.')[0]; // YYYY-MM-DDTHH-MM-SS
    }
    
    // Get file size in human readable format
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Validate export options
    validateExportOptions(options = {}) {
        const errors = [];
        
        // Validate date range
        if (options.startDate && options.endDate) {
            const start = new Date(options.startDate);
            const end = new Date(options.endDate);
            
            if (start > end) {
                errors.push('Start date must be before end date');
            }
            
            if (end > new Date()) {
                errors.push('End date cannot be in the future');
            }
            
            // Check if range is too large
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 365) {
                errors.push('Date range cannot exceed 1 year');
            }
        }
        
        // Validate sensor type
        if (options.sensorType && !this.sensorTypeNames[options.sensorType]) {
            errors.push(`Invalid sensor type: ${options.sensorType}`);
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
        
        return true;
    }
    
    // Get export progress (if backend supports it)
    async getExportStatus(exportId) {
        try {
            if (window.sensorApp && window.sensorApp.components.api) {
                const response = await window.sensorApp.components.api.apiCall(`/export/status/${exportId}`);
                return response.data;
            }
        } catch (error) {
            console.error('Error getting export status:', error);
            return null;
        }
    }
    
    // Show export confirmation dialog
    showExportConfirmation(sensorType, options = {}) {
        return new Promise((resolve, reject) => {
            const sensorName = this.sensorTypeNames[sensorType] || sensorType;
            let message = `Export ${sensorName} data`;
            
            if (options.startDate && options.endDate) {
                message += ` from ${options.startDate} to ${options.endDate}`;
            }
            
            message += '?';
            
            // Simple confirmation dialog (could be replaced with custom modal)
            const confirmed = confirm(message + '\n\nThis may take a few moments for large datasets.');
            
            if (confirmed) {
                resolve(true);
            } else {
                reject(new Error('Export cancelled by user'));
            }
        });
    }
    
    // Batch export multiple sensors
    async exportMultipleSensors(sensorTypes, options = {}) {
        try {
            if (window.sensorApp) {
                window.sensorApp.showToast(`Exporting ${sensorTypes.length} sensor datasets...`, 'info');
            }
            
            const exports = [];
            
            for (const sensorType of sensorTypes) {
                try {
                    const filename = await this.exportSensorData(sensorType, options);
                    exports.push({ sensorType, filename, success: true });
                } catch (error) {
                    exports.push({ sensorType, error: error.message, success: false });
                }
            }
            
            // Show summary
            const successful = exports.filter(e => e.success).length;
            const failed = exports.filter(e => !e.success).length;
            
            let message = `Export completed: ${successful} successful`;
            if (failed > 0) {
                message += `, ${failed} failed`;
            }
            
            if (window.sensorApp) {
                window.sensorApp.showToast(message, failed > 0 ? 'warning' : 'success');
            }
            
            return exports;
            
        } catch (error) {
            console.error('Error in batch export:', error);
            
            if (window.sensorApp) {
                window.sensorApp.showToast(`Batch export failed: ${error.message}`, 'error');
            }
            
            throw error;
        }
    }
}

// Export for use in other components
window.ExportUtils = ExportUtils;