import os
import time
from datetime import datetime, timezone
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from dotenv import load_dotenv

import services.ecosystem_service as ecosystem
import services.hive_service as hive
import services.streaming_service as streaming
import services.mapreduce_service as mr
import services.producer_service as producer
import services.historical_service as hist_svc
import services.alert_service as alert_svc
import services.map_service as map_svc
import services.quality_service as quality_svc
import services.search_service as search_svc

load_dotenv()

app = Flask(__name__)
# Allow CORS for typical local development ports
CORS(app, resources={r"/api/*": {"origins": "*"}})

START_TIME = time.time()

@app.route('/api/status', methods=['GET'])
def get_status():
    uptime = round(time.time() - START_TIME, 1)
    eco = ecosystem.get_ecosystem_status(force_fresh=False)
    services_status = {}
    active_count = 0
    total_count = 0
    for k in ['hdfs', 'yarn', 'kafka', 'spark', 'hive', 'mapreduce', 'producer']:
        if k in eco:
            st = eco[k].get('status', 'Unknown')
            services_status[k] = st
            total_count += 1
            if st in ['Running', 'Available']:
                active_count += 1

    return jsonify({
        "status": "running",
        "service": "Flask REST API",
        "version": "1.0.0",
        "pid": os.getpid(),
        "uptime_seconds": uptime,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "active_services": active_count,
        "total_services": total_count,
        "services": services_status
    })

@app.route('/api/ecosystem', methods=['GET'])
def get_ecosystem():
    return jsonify(ecosystem.get_ecosystem_status())

@app.route('/api/summary', methods=['GET'])
def get_summary():
    # Use fast HDFS MapReduce output
    data = mr.get_mapreduce_stats()
    if data:
        total_records = sum(d["records"] for d in data)
        cities_monitored = len(data)
        avg_temp = sum(d["avg_temperature"] * d["records"] for d in data) / total_records if total_records else 0
        avg_hum = sum(d["avg_humidity"] * d["records"] for d in data) / total_records if total_records else 0
        total_rain = sum(d["total_rainfall"] for d in data)
        avg_wind = sum(d["avg_wind_speed"] * d["records"] for d in data) / total_records if total_records else 0
        
        return jsonify({
            "total_records": total_records,
            "cities_monitored": cities_monitored,
            "average_temperature": round(avg_temp, 2),
            "average_humidity": round(avg_hum, 2),
            "total_rainfall": round(total_rain, 2),
            "average_wind_speed": round(avg_wind, 2)
        })
    # Fallback to Hive if HDFS isn't available
    data = hive.get_summary()
    if data:
        return jsonify(data)
    return jsonify({"status": "error", "message": "Hive summary unavailable"}), 503

@app.route('/api/cities', methods=['GET'])
def get_cities():
    data = mr.get_mapreduce_stats()
    if data:
        return jsonify(data)
    # Fallback to Hive
    data = hive.get_cities()
    if data:
        return jsonify(data)
    return jsonify({"status": "error", "message": "Hive cities data unavailable"}), 503

@app.route('/api/temperature', methods=['GET'])
def get_temperature():
    data = mr.get_mapreduce_stats()
    if data:
        # Return city-level aggregations
        res = [{"city": r["city"], "avg_temperature": r["avg_temperature"], "min_temperature": r["min_temperature"], "max_temperature": r["max_temperature"]} for r in data]
        return jsonify(res)
    return jsonify({"status": "error", "message": "Temperature data unavailable"}), 503

@app.route('/api/rainfall', methods=['GET'])
def get_rainfall():
    data = mr.get_mapreduce_stats()
    if data:
        res = [{"city": r["city"], "rainfall": r["total_rainfall"]} for r in data]
        return jsonify(res)
    return jsonify({"status": "error", "message": "Rainfall data unavailable"}), 503

@app.route('/api/humidity', methods=['GET'])
def get_humidity():
    data = mr.get_mapreduce_stats()
    if data:
        res = [{"city": r["city"], "humidity": r["avg_humidity"]} for r in data]
        return jsonify(res)
    return jsonify({"status": "error", "message": "Humidity data unavailable"}), 503

@app.route('/api/wind', methods=['GET'])
def get_wind():
    data = mr.get_mapreduce_stats()
    if data:
        res = [{"city": r["city"], "avg_wind_speed": r["avg_wind_speed"], "max_wind_speed": r["max_wind_speed"]} for r in data]
        return jsonify(res)
    return jsonify({"status": "error", "message": "Wind data unavailable"}), 503

@app.route('/api/historical', methods=['GET'])
def get_historical():
    data = mr.get_mapreduce_stats()
    if data:
        return jsonify(data)
    # Fallback to Hive
    data = hive.get_cities()
    if data:
        return jsonify(data)
    return jsonify({"status": "error", "message": "Historical data unavailable"}), 503

@app.route('/api/historical/daily-trends', methods=['GET'])
def get_historical_daily_trends():
    city = request.args.get('city')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    data = hist_svc.get_daily_trends(city=city, start_date=start_date, end_date=end_date)
    return jsonify(data)

@app.route('/api/historical/records', methods=['GET'])
def get_historical_records():
    city = request.args.get('city')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    data = hist_svc.get_raw_historical_records(city=city, start_date=start_date, end_date=end_date)
    return jsonify(data)

@app.route('/api/historical/conditions', methods=['GET'])
def get_historical_conditions():
    data = hist_svc.get_weather_conditions_distribution()
    return jsonify(data)

@app.route('/api/historical/extremes', methods=['GET'])
def get_historical_extremes():
    data = hist_svc.get_extreme_weather_records()
    return jsonify(data)

@app.route('/api/historical/export', methods=['GET'])
def export_historical_csv():
    dataset_type = request.args.get('type', 'summary')
    city = request.args.get('city')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    csv_content = hist_svc.generate_csv_report(
        dataset_type=dataset_type,
        city=city,
        start_date=start_date,
        end_date=end_date
    )
    filename = f"weather_{dataset_type}_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.route('/api/stream/recent', methods=['GET'])
def get_stream_recent():
    data = streaming.get_recent_stream()
    return jsonify(data)

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    city = request.args.get('city')
    severity = request.args.get('severity')
    rule_id = request.args.get('rule_id')
    try:
        limit = int(request.args.get('limit', 50))
    except (ValueError, TypeError):
        limit = 50
    alerts = alert_svc.get_active_alerts(city=city, severity=severity, rule_id=rule_id, limit=limit)
    return jsonify(alerts)

@app.route('/api/alerts/history', methods=['GET'])
def get_alerts_history():
    city = request.args.get('city')
    severity = request.args.get('severity')
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
    except (ValueError, TypeError):
        page, page_size = 1, 20
    res = alert_svc.get_alerts_history(city=city, severity=severity, page=page, page_size=page_size)
    return jsonify(res)

@app.route('/api/alerts/thresholds', methods=['GET'])
def get_alert_thresholds():
    return jsonify(alert_svc.get_threshold_definitions())

@app.route('/api/alerts/summary', methods=['GET'])
def get_alerts_summary():
    return jsonify(alert_svc.get_alerts_summary())

@app.route('/api/alerts/acknowledge', methods=['POST'])
def acknowledge_alert():
    data = request.get_json(silent=True) or {}
    alert_id = data.get('alert_id')
    note = data.get('note')
    if not alert_id:
        return jsonify({"status": "error", "message": "Missing required field 'alert_id'"}), 400
    res = alert_svc.acknowledge_alert(alert_id, note)
    if res:
        return jsonify({"status": "success", "alert": res})
    return jsonify({"status": "error", "message": "Alert not found or already acknowledged"}), 404

# ==========================================
# Phase 5: Interactive Weather Map Endpoints
# ==========================================
@app.route('/api/map/cities', methods=['GET'])
def get_map_cities():
    force_fresh = request.args.get('force_fresh', 'false').lower() == 'true'
    data = map_svc.get_map_cities(force_fresh=force_fresh)
    return jsonify(data)

# ==========================================
# Phase 5: Data Quality Monitoring Endpoints
# ==========================================
@app.route('/api/quality/summary', methods=['GET'])
def get_quality_summary():
    return jsonify(quality_svc.get_quality_summary())

@app.route('/api/quality/metrics', methods=['GET'])
def get_quality_metrics():
    return jsonify(quality_svc.get_quality_metrics())

@app.route('/api/quality/pipeline', methods=['GET'])
def get_quality_pipeline():
    return jsonify(quality_svc.get_quality_pipeline())

@app.route('/api/quality/issues', methods=['GET'])
def get_quality_issues():
    severity = request.args.get('severity')
    city = request.args.get('city')
    rule = request.args.get('rule')
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
    except (ValueError, TypeError):
        page, page_size = 1, 20
    data = quality_svc.get_quality_issues(page=page, page_size=page_size, severity=severity, city=city, rule=rule)
    return jsonify(data)

# ==========================================
# Global Weather Search Endpoints (Open-Meteo)
# ==========================================
@app.route('/api/search/locations', methods=['GET'])
def search_locations():
    query = request.args.get('q') or request.args.get('query') or ''
    try:
        count = int(request.args.get('count', 8))
    except (ValueError, TypeError):
        count = 8
    data = search_svc.search_locations(query=query, count=count)
    return jsonify(data)

@app.route('/api/search/weather', methods=['GET'])
def get_search_weather():
    lat = request.args.get('lat') or request.args.get('latitude')
    lon = request.args.get('lon') or request.args.get('longitude')
    if lat is None or lon is None:
        return jsonify({"status": "error", "message": "Missing required 'lat' and 'lon' query parameters"}), 400
    data = search_svc.get_current_weather(lat=lat, lon=lon)
    return jsonify(data)

# Start controlled background alert evaluator
alert_svc.start_alert_evaluator()

if __name__ == '__main__':
    # Automatic producer startup disabled during monitoring tasks
    # if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    #     producer.start_producer_if_needed()
    app.run(debug=True, port=5000)
