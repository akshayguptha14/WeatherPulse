USE weather_climate;

-- Average atmospheric pressure by city
SELECT city, ROUND(AVG(pressure), 2) as avg_pressure FROM weather_data GROUP BY city ORDER BY avg_pressure DESC;

-- Minimum pressure by city
SELECT city, MIN(pressure) as min_pressure FROM weather_data GROUP BY city ORDER BY min_pressure ASC;

-- Maximum pressure by city
SELECT city, MAX(pressure) as max_pressure FROM weather_data GROUP BY city ORDER BY max_pressure DESC;
