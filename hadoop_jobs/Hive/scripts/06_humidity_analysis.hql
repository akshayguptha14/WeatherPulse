USE weather_climate;

-- Average humidity by city
SELECT city, ROUND(AVG(humidity), 2) as avg_humidity FROM weather_data GROUP BY city ORDER BY avg_humidity DESC;

-- Minimum humidity by city
SELECT city, MIN(humidity) as min_humidity FROM weather_data GROUP BY city ORDER BY min_humidity ASC;

-- Maximum humidity by city
SELECT city, MAX(humidity) as max_humidity FROM weather_data GROUP BY city ORDER BY max_humidity DESC;

-- Overall average humidity
SELECT ROUND(AVG(humidity), 2) as overall_avg_humidity FROM weather_data;
