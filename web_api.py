# Backend API Additions for web_api.py
# Add these endpoints to your existing web_api.py file

import io
import xlsxwriter
from datetime import datetime, timedelta

# ============ NEW DATABASE SCHEMA FOR ROI ============

def init_roi_tables():
    """Initialize ROI-related database tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # ROI Settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS roi_settings (
                id INTEGER PRIMARY KEY,
                pv_investment_cost REAL DEFAULT 20500000,
                current_tariff_per_kwh REAL DEFAULT 1352,
                system_start_date TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tariff history for accurate historical calculations
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tariff_history (
                id INTEGER PRIMARY KEY,
                tariff_per_kwh REAL NOT NULL,
                effective_date TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default values if not exists
        cursor.execute('SELECT COUNT(*) FROM roi_settings')
        if cursor.fetchone()[0] == 0:
            # Auto-detect system start date from first successful PZEM-016 reading
            cursor.execute('''
                SELECT MIN(timestamp) FROM pzem_data 
                WHERE device_type = 'PZEM-016_AC' 
                AND status = 'success'
                AND parsed_data IS NOT NULL
            ''')
            system_start = cursor.fetchone()[0] or datetime.now().isoformat()
            
            cursor.execute('''
                INSERT INTO roi_settings (system_start_date) VALUES (?)
            ''', (system_start,))
            
            # Insert initial tariff
            cursor.execute('''
                INSERT INTO tariff_history (tariff_per_kwh, effective_date) 
                VALUES (1352, ?)
            ''', (system_start,))
        
        conn.commit()
        logger.info("ROI tables initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing ROI tables: {e}")
    finally:
        conn.close()

# ============ HISTORICAL DATA API ENDPOINTS ============

@app.route('/api/data/<sensor_type>', methods=['GET'])
def get_sensor_historical_data(sensor_type):
    """Get historical sensor data with pagination and date filtering"""
    try:
        # Parse parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        # Validate sensor type
        valid_sensors = {
            'pzem016': 'PZEM-016_AC',
            'pzem017': 'PZEM-017_DC',
            'dht22': 'dht22_data',
            'system': 'system_data'
        }
        
        if sensor_type not in valid_sensors:
            return jsonify({
                'success': False,
                'error': f'Invalid sensor type: {sensor_type}'
            }), 400
        
        # Build query based on sensor type
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        offset = (page - 1) * limit
        where_conditions = []
        params = []
        
        if sensor_type in ['pzem016', 'pzem017']:
            # PZEM sensors
            table = 'pzem_data'
            device_type = valid_sensors[sensor_type]
            where_conditions.append('device_type = ?')
            params.append(device_type)
            
            base_query = '''
                SELECT timestamp, device_type, raw_registers, register_count, 
                       status, error_message, parsed_data, received_at
                FROM pzem_data
            '''
        elif sensor_type == 'dht22':
            # DHT22 sensor
            table = 'dht22_data'
            base_query = '''
                SELECT timestamp, temperature, humidity, gpio_pin, library,
                       status, error_message, received_at
                FROM dht22_data
            '''
        elif sensor_type == 'system':
            # System resources
            table = 'system_data'
            base_query = '''
                SELECT timestamp, ram_usage_percent, storage_usage_percent,
                       cpu_usage_percent, cpu_temperature, storage_total_gb,
                       storage_used_gb, storage_free_gb, status, error_message, received_at
                FROM system_data
            '''
        
        # Add date filters
        if start_date:
            where_conditions.append('timestamp >= ?')
            params.append(start_date)
        
        if end_date:
            # Add one day to end_date to include the full day
            end_datetime = datetime.fromisoformat(end_date) + timedelta(days=1)
            where_conditions.append('timestamp < ?')
            params.append(end_datetime.isoformat())
        
        # Build WHERE clause
        where_clause = ''
        if where_conditions:
            where_clause = 'WHERE ' + ' AND '.join(where_conditions)
        
        # Get total count
        count_query = f'SELECT COUNT(*) FROM {table} {where_clause}'
        cursor.execute(count_query, params)
        total_records = cursor.fetchone()[0]
        
        # Get paginated data
        data_query = f'{base_query} {where_clause} ORDER BY timestamp DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        cursor.execute(data_query, params)
        
        # Format results
        records = []
        for row in cursor.fetchall():
            if sensor_type in ['pzem016', 'pzem017']:
                record = {
                    'timestamp': row[0],
                    'device_type': row[1],
                    'raw_registers': json.loads(row[2]) if row[2] else [],
                    'register_count': row[3],
                    'status': row[4],
                    'error_message': row[5],
                    'parsed_data': json.loads(row[6]) if row[6] else None,
                    'received_at': row[7]
                }
            elif sensor_type == 'dht22':
                record = {
                    'timestamp': row[0],
                    'temperature': row[1],
                    'humidity': row[2],
                    'gpio_pin': row[3],
                    'library': row[4],
                    'status': row[5],
                    'error_message': row[6],
                    'received_at': row[7]
                }
            elif sensor_type == 'system':
                record = {
                    'timestamp': row[0],
                    'ram_usage_percent': row[1],
                    'storage_usage_percent': row[2],
                    'cpu_usage_percent': row[3],
                    'cpu_temperature': row[4],
                    'storage_total_gb': row[5],
                    'storage_used_gb': row[6],
                    'storage_free_gb': row[7],
                    'status': row[8],
                    'error_message': row[9],
                    'received_at': row[10]
                }
            records.append(record)
        
        total_pages = (total_records + limit - 1) // limit
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'records': records,
                'pagination': {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_records': total_records,
                    'per_page': limit
                },
                'filters': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'sensor_type': sensor_type
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting historical data for {sensor_type}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/export/<sensor_type>', methods=['GET'])
def export_sensor_data(sensor_type):
    """Export sensor data to Excel format"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Get data (no pagination for export)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Build query similar to historical data endpoint but without pagination
        where_conditions = []
        params = []
        
        if sensor_type == 'pzem016':
            where_conditions.append('device_type = ?')
            params.append('PZEM-016_AC')
            query = '''
                SELECT timestamp, parsed_data, status, error_message
                FROM pzem_data
            '''
        elif sensor_type == 'pzem017':
            where_conditions.append('device_type = ?')
            params.append('PZEM-017_DC')
            query = '''
                SELECT timestamp, parsed_data, status, error_message
                FROM pzem_data
            '''
        elif sensor_type == 'dht22':
            query = '''
                SELECT timestamp, temperature, humidity, gpio_pin, library, status, error_message
                FROM dht22_data
            '''
        elif sensor_type == 'system':
            query = '''
                SELECT timestamp, ram_usage_percent, storage_usage_percent,
                       cpu_usage_percent, cpu_temperature, storage_total_gb,
                       storage_used_gb, storage_free_gb, status, error_message
                FROM system_data
            '''
        else:
            return jsonify({
                'success': False,
                'error': f'Invalid sensor type: {sensor_type}'
            }), 400
        
        # Add date filters
        if start_date:
            where_conditions.append('timestamp >= ?')
            params.append(start_date)
        
        if end_date:
            end_datetime = datetime.fromisoformat(end_date) + timedelta(days=1)
            where_conditions.append('timestamp < ?')
            params.append(end_datetime.isoformat())
        
        # Build final query
        if where_conditions:
            query += ' WHERE ' + ' AND '.join(where_conditions)
        query += ' ORDER BY timestamp DESC'
        
        cursor.execute(query, params)
        data = cursor.fetchall()
        conn.close()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data found for the specified criteria'
            }), 404
        
        # Create Excel file in memory
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1
        })
        
        date_format = workbook.add_format({'num_format': 'yyyy-mm-dd hh:mm:ss'})
        number_format = workbook.add_format({'num_format': '0.000'})
        
        # Create worksheet
        sensor_names = {
            'pzem016': 'PZEM-016 AC Power',
            'pzem017': 'PZEM-017 DC Solar',
            'dht22': 'DHT22 Environment',
            'system': 'System Resources'
        }
        
        worksheet = workbook.add_worksheet(sensor_names.get(sensor_type, sensor_type.upper()))
        
        # Write headers and data based on sensor type
        if sensor_type in ['pzem016', 'pzem017']:
            headers = ['Timestamp', 'Voltage (V)', 'Current (A)', 'Power (W)', 
                      'Energy (kWh)', 'Status', 'Error Message']
            if sensor_type == 'pzem016':
                headers.extend(['Frequency (Hz)', 'Power Factor', 'Alarm Status'])
            else:
                headers.extend(['Solar Status', 'Over Voltage Alarm', 'Under Voltage Alarm'])
            
            # Write headers
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)
            
            # Write data
            for row, record in enumerate(data, 1):
                timestamp, parsed_data_json, status, error_message = record
                
                # Parse JSON data
                parsed_data = json.loads(parsed_data_json) if parsed_data_json else {}
                
                worksheet.write(row, 0, timestamp, date_format)
                
                if status == 'success' and parsed_data.get('status') == 'success':
                    worksheet.write(row, 1, parsed_data.get('voltage_v', 0), number_format)
                    worksheet.write(row, 2, parsed_data.get('current_a', 0), number_format)
                    worksheet.write(row, 3, parsed_data.get('power_w', 0), number_format)
                    worksheet.write(row, 4, parsed_data.get('energy_kwh', 0), number_format)
                    worksheet.write(row, 5, 'Success')
                    worksheet.write(row, 6, '')
                    
                    if sensor_type == 'pzem016':
                        worksheet.write(row, 7, parsed_data.get('frequency_hz', 0), number_format)
                        worksheet.write(row, 8, parsed_data.get('power_factor', 0), number_format)
                        worksheet.write(row, 9, parsed_data.get('alarm_status', 'OFF'))
                    else:
                        worksheet.write(row, 7, parsed_data.get('solar_status', 'Unknown'))
                        worksheet.write(row, 8, parsed_data.get('over_voltage_alarm', 'OFF'))
                        worksheet.write(row, 9, parsed_data.get('under_voltage_alarm', 'OFF'))
                else:
                    # Error case
                    for col in range(1, 5):
                        worksheet.write(row, col, 0)
                    worksheet.write(row, 5, status or 'Error')
                    worksheet.write(row, 6, error_message or 'Unknown error')
                    for col in range(7, len(headers)):
                        worksheet.write(row, col, '')
        
        elif sensor_type == 'dht22':
            headers = ['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'GPIO Pin', 
                      'Library', 'Status', 'Error Message']
            
            # Write headers
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)
            
            # Write data
            for row, record in enumerate(data, 1):
                timestamp, temperature, humidity, gpio_pin, library, status, error_message = record
                
                worksheet.write(row, 0, timestamp, date_format)
                worksheet.write(row, 1, temperature or 0, number_format)
                worksheet.write(row, 2, humidity or 0, number_format)
                worksheet.write(row, 3, gpio_pin or 0)
                worksheet.write(row, 4, library or '')
                worksheet.write(row, 5, status or 'Error')
                worksheet.write(row, 6, error_message or '')
        
        elif sensor_type == 'system':
            headers = ['Timestamp', 'RAM Usage (%)', 'Storage Usage (%)', 'CPU Usage (%)', 
                      'CPU Temperature (°C)', 'Storage Total (GB)', 'Storage Used (GB)', 
                      'Storage Free (GB)', 'Status', 'Error Message']
            
            # Write headers
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)
            
            # Write data
            for row, record in enumerate(data, 1):
                (timestamp, ram_usage, storage_usage, cpu_usage, cpu_temp, 
                 storage_total, storage_used, storage_free, status, error_message) = record
                
                worksheet.write(row, 0, timestamp, date_format)
                worksheet.write(row, 1, ram_usage or 0, number_format)
                worksheet.write(row, 2, storage_usage or 0, number_format)
                worksheet.write(row, 3, cpu_usage or 0, number_format)
                worksheet.write(row, 4, cpu_temp or 0, number_format)
                worksheet.write(row, 5, storage_total or 0, number_format)
                worksheet.write(row, 6, storage_used or 0, number_format)
                worksheet.write(row, 7, storage_free or 0, number_format)
                worksheet.write(row, 8, status or 'Error')
                worksheet.write(row, 9, error_message or '')
        
        # Auto-adjust column widths
        for col in range(len(headers)):
            worksheet.set_column(col, col, 18)
        
        workbook.close()
        output.seek(0)
        
        # Generate filename
        filename = f"{sensor_type.upper()}"
        if start_date and end_date:
            filename += f"_{start_date}_to_{end_date}"
        elif start_date:
            filename += f"_from_{start_date}"
        elif end_date:
            filename += f"_until_{end_date}"
        else:
            filename += f"_{datetime.now().strftime('%Y-%m-%d')}"
        filename += ".xlsx"
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        logger.error(f"Error exporting {sensor_type} data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============ ROI API ENDPOINTS ============

@app.route('/api/roi/summary', methods=['GET'])
def get_roi_summary():
    """Get ROI summary for dashboard card"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get ROI settings
        cursor.execute('SELECT * FROM roi_settings ORDER BY id DESC LIMIT 1')
        settings_row = cursor.fetchone()
        
        if not settings_row:
            return jsonify({
                'success': False,
                'error': 'ROI settings not configured'
            }), 404
        
        investment_cost = settings_row[1]  # pv_investment_cost
        system_start_date = settings_row[3]  # system_start_date
        
        # Calculate total savings using historical tariffs
        total_savings = calculate_total_savings(cursor, system_start_date)
        
        # Calculate today's and monthly savings
        today = datetime.now().date()
        month_start = today.replace(day=1)
        
        today_savings = calculate_savings_for_period(cursor, today.isoformat(), today.isoformat())
        monthly_savings = calculate_savings_for_period(cursor, month_start.isoformat(), today.isoformat())
        
        # Calculate ROI metrics
        roi_percentage = (total_savings / investment_cost) * 100
        investment_recovered = min(total_savings, investment_cost)
        
        # Calculate payback estimate
        if monthly_savings > 0:
            remaining_investment = max(0, investment_cost - total_savings)
            payback_months = remaining_investment / monthly_savings
        else:
            payback_months = float('inf')
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_investment': investment_cost,
                'total_savings': total_savings,
                'investment_recovered': investment_recovered,
                'roi_percentage': round(roi_percentage, 1),
                'today_savings': today_savings,
                'monthly_savings': monthly_savings,
                'payback_months_remaining': int(payback_months) if payback_months != float('inf') else 0,
                'system_start_date': system_start_date,
                'last_updated': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting ROI summary: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/roi/settings', methods=['GET', 'POST'])
def roi_settings():
    """Get or update ROI settings"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        if request.method == 'GET':
            # Get current settings
            cursor.execute('SELECT * FROM roi_settings ORDER BY id DESC LIMIT 1')
            settings = cursor.fetchone()
            
            # Get tariff history
            cursor.execute('SELECT * FROM tariff_history ORDER BY effective_date DESC')
            tariff_history = cursor.fetchall()
            
            if not settings:
                conn.close()
                return jsonify({
                    'success': False,
                    'error': 'ROI settings not found'
                }), 404
            
            conn.close()
            return jsonify({
                'success': True,
                'data': {
                    'pv_investment_cost': settings[1],
                    'current_tariff_per_kwh': settings[2],
                    'system_start_date': settings[3],
                    'tariff_history': [{
                        'tariff_per_kwh': row[1],
                        'effective_date': row[2],
                        'created_at': row[3]
                    } for row in tariff_history]
                }
            })
        
        elif request.method == 'POST':
            # Update settings
            data = request.get_json()
            
            new_tariff = data.get('current_tariff_per_kwh')
            effective_date = data.get('effective_date', datetime.now().date().isoformat())
            
            # Get current tariff to check if changed
            cursor.execute('SELECT current_tariff_per_kwh FROM roi_settings ORDER BY id DESC LIMIT 1')
            current_tariff_row = cursor.fetchone()
            current_tariff = current_tariff_row[0] if current_tariff_row else 0
            
            # Update settings
            cursor.execute('''
                UPDATE roi_settings 
                SET current_tariff_per_kwh = ?, updated_at = ?
                WHERE id = (SELECT id FROM roi_settings ORDER BY id DESC LIMIT 1)
            ''', (new_tariff, datetime.now().isoformat()))
            
            # Add new tariff to history if changed
            if abs(new_tariff - current_tariff) > 0.01:  # Only if significantly different
                cursor.execute('''
                    INSERT INTO tariff_history (tariff_per_kwh, effective_date)
                    VALUES (?, ?)
                ''', (new_tariff, effective_date))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'ROI settings updated successfully'
            })
        
    except Exception as e:
        logger.error(f"Error in ROI settings: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def calculate_total_savings(cursor, system_start_date):
    """Calculate total savings using historical tariffs"""
    try:
        # Get all energy consumption data since system start
        cursor.execute('''
            SELECT timestamp, parsed_data
            FROM pzem_data
            WHERE device_type = 'PZEM-016_AC'
            AND status = 'success'
            AND timestamp >= ?
            AND parsed_data IS NOT NULL
            ORDER BY timestamp ASC
        ''', (system_start_date,))
        
        consumption_data = cursor.fetchall()
        
        if not consumption_data:
            return 0
        
        # Get tariff history
        cursor.execute('SELECT tariff_per_kwh, effective_date FROM tariff_history ORDER BY effective_date ASC')
        tariff_history = cursor.fetchall()
        
        total_savings = 0
        
        for timestamp, parsed_data_json in consumption_data:
            try:
                parsed_data = json.loads(parsed_data_json)
                energy_kwh = parsed_data.get('energy_kwh', 0)
                
                if energy_kwh <= 0:
                    continue
                
                # Find applicable tariff for this timestamp
                applicable_tariff = 1352  # default
                record_date = datetime.fromisoformat(timestamp).date()
                
                for tariff_rate, effective_date in tariff_history:
                    tariff_date = datetime.fromisoformat(effective_date).date()
                    if record_date >= tariff_date:
                        applicable_tariff = tariff_rate
                    else:
                        break
                
                # Calculate savings for this record
                savings = energy_kwh * applicable_tariff
                total_savings += savings
                
            except (json.JSONDecodeError, ValueError) as e:
                continue
        
        return total_savings
        
    except Exception as e:
        logger.error(f"Error calculating total savings: {e}")
        return 0

def calculate_savings_for_period(cursor, start_date, end_date):
    """Calculate savings for a specific period"""
    try:
        end_datetime = datetime.fromisoformat(end_date) + timedelta(days=1)
        
        cursor.execute('''
            SELECT SUM(
                CASE 
                    WHEN status = 'success' AND parsed_data IS NOT NULL 
                    THEN JSON_EXTRACT(parsed_data, '$.energy_kwh') * 1352
                    ELSE 0 
                END
            ) as total_savings
            FROM pzem_data
            WHERE device_type = 'PZEM-016_AC'
            AND timestamp >= ?
            AND timestamp < ?
        ''', (start_date, end_datetime.isoformat()))
        
        result = cursor.fetchone()
        return result[0] if result and result[0] else 0
        
    except Exception as e:
        logger.error(f"Error calculating period savings: {e}")
        return 0

@app.route('/api/roi/export', methods=['GET'])
def export_roi_report():
    """Export comprehensive ROI report to Excel"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get ROI settings
        cursor.execute('SELECT * FROM roi_settings ORDER BY id DESC LIMIT 1')
        settings = cursor.fetchone()
        
        if not settings:
            return jsonify({
                'success': False,
                'error': 'ROI settings not configured'
            }), 404
        
        investment_cost = settings[1]
        system_start_date = settings[3]
        
        # Create Excel file
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        
        # Formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1
        })
        
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 16,
            'bg_color': '#D9E2F3'
        })
        
        currency_format = workbook.add_format({'num_format': '"Rp "#,##0'})
        date_format = workbook.add_format({'num_format': 'yyyy-mm-dd'})
        datetime_format = workbook.add_format({'num_format': 'yyyy-mm-dd hh:mm:ss'})
        
        # Sheet 1: ROI Summary
        summary_sheet = workbook.add_worksheet('ROI Summary')
        
        # System Information
        summary_sheet.write('A1', 'Solar PV System ROI Report', title_format)
        summary_sheet.write('A3', 'System Information')
        summary_sheet.write('A4', 'System Start Date:')
        summary_sheet.write('B4', system_start_date, date_format)
        summary_sheet.write('A5', 'Investment Cost:')
        summary_sheet.write('B5', investment_cost, currency_format)
        
        # Calculate current metrics
        total_savings = calculate_total_savings(cursor, system_start_date)
        roi_percentage = (total_savings / investment_cost) * 100
        
        summary_sheet.write('A7', 'Current Status')
        summary_sheet.write('A8', 'Total Savings:')
        summary_sheet.write('B8', total_savings, currency_format)
        summary_sheet.write('A9', 'ROI Percentage:')
        summary_sheet.write('B9', f'{roi_percentage:.1f}%')
        summary_sheet.write('A10', 'Investment Recovered:')
        summary_sheet.write('B10', min(total_savings, investment_cost), currency_format)
        
        # Set column widths
        summary_sheet.set_column('A:A', 25)
        summary_sheet.set_column('B:B', 20)
        
        # Sheet 2: Daily Savings Detail
        detail_sheet = workbook.add_worksheet('Daily Savings Detail')
        
        # Headers
        headers = ['Date', 'Energy Consumed (kWh)', 'Applicable Tariff (Rp/kWh)', 'Daily Savings (Rp)']
        for col, header in enumerate(headers):
            detail_sheet.write(0, col, header, header_format)
        
        # Get detailed energy data
        cursor.execute('''
            SELECT DATE(timestamp) as date,
                   SUM(CASE WHEN status = 'success' AND parsed_data IS NOT NULL 
                       THEN JSON_EXTRACT(parsed_data, '$.energy_kwh') ELSE 0 END) as daily_energy
            FROM pzem_data
            WHERE device_type = 'PZEM-016_AC'
            AND timestamp >= ?
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
        ''', (system_start_date,))
        
        daily_data = cursor.fetchall()
        
        # Write daily data
        row = 1
        for date_str, daily_energy in daily_data:
            if daily_energy > 0:
                tariff = 1352  # You might want to get historical tariff here
                daily_savings = daily_energy * tariff
                
                detail_sheet.write(row, 0, date_str, date_format)
                detail_sheet.write(row, 1, daily_energy)
                detail_sheet.write(row, 2, tariff)
                detail_sheet.write(row, 3, daily_savings, currency_format)
                row += 1
        
        # Set column widths
        for col in range(4):
            detail_sheet.set_column(col, col, 18)
        
        # Sheet 3: Tariff History
        tariff_sheet = workbook.add_worksheet('Tariff History')
        
        # Headers
        tariff_headers = ['Effective Date', 'Tariff (Rp/kWh)', 'Created Date']
        for col, header in enumerate(tariff_headers):
            tariff_sheet.write(0, col, header, header_format)
        
        # Get tariff history
        cursor.execute('SELECT tariff_per_kwh, effective_date, created_at FROM tariff_history ORDER BY effective_date DESC')
        tariff_history = cursor.fetchall()
        
        # Write tariff data
        for row, (tariff_rate, effective_date, created_at) in enumerate(tariff_history, 1):
            tariff_sheet.write(row, 0, effective_date, date_format)
            tariff_sheet.write(row, 1, tariff_rate)
            tariff_sheet.write(row, 2, created_at, datetime_format)
        
        # Set column widths
        for col in range(3):
            tariff_sheet.set_column(col, col, 18)
        
        workbook.close()
        output.seek(0)
        
        conn.close()
        
        # Generate filename
        filename = "ROI-Report"
        if start_date and end_date:
            filename += f"_{start_date}_to_{end_date}"
        else:
            filename += f"_{datetime.now().strftime('%Y-%m-%d')}"
        filename += ".xlsx"
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        logger.error(f"Error exporting ROI report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============ INITIALIZATION CALL ============
# Add this call to your main app initialization
try:
    init_roi_tables()
except Exception as e:
    logger.error(f"Failed to initialize ROI tables: {e}")

# ============ IMPORT ADDITIONS ============
# Add these imports to the top of your web_api.py file:
# from flask import send_file
# import xlsxwriter