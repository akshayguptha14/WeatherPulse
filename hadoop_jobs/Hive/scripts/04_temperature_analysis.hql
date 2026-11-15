USE weather_climate;

-- Average temperature by city
SELECT city, ROUND(AVG(temperature), 2) as avg_temp FROM weather_data GROUP BY city ORDER BY avg_temp DESC;

-- Maximum temperature by city
SELECT city, MAX(temperature) as max_temp FROM weather_data GROUP BY city ORDER BY max_temp DESC;

-- Minimum temperature by city
SELECT city, MIN(temperature) as min_temp FROM weather_data GROUP BY city ORDER BY min_temp ASC;

-- Overall average temperature
SELECT ROUND(AVG(temperature), 2) as overall_avg_temp FROM weather_data;

-- City with highest recorded temperature
SELECT city, temperature FROM weather_data ORDER BY temperature DESC LIMIT 1;
