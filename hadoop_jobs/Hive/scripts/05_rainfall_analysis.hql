USE weather_climate;

-- Total rainfall by city
SELECT city, ROUND(SUM(rainfall), 2) as total_rainfall FROM weather_data GROUP BY city ORDER BY total_rainfall DESC;

-- Average rainfall by city
SELECT city, ROUND(AVG(rainfall), 2) as avg_rainfall FROM weather_data GROUP BY city ORDER BY avg_rainfall DESC;

-- Maximum single-record rainfall by city
SELECT city, MAX(rainfall) as max_rainfall FROM weather_data GROUP BY city ORDER BY max_rainfall DESC;

-- Overall rainfall total
SELECT ROUND(SUM(rainfall), 2) as overall_total_rainfall FROM weather_data;
