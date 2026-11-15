USE weather_climate;

-- Average wind speed by city
SELECT city, ROUND(AVG(wind_speed), 2) as avg_wind_speed FROM weather_data GROUP BY city ORDER BY avg_wind_speed DESC;

-- Maximum wind speed by city
SELECT city, MAX(wind_speed) as max_wind_speed FROM weather_data GROUP BY city ORDER BY max_wind_speed DESC;

-- City-wise wind comparison (Avg vs Max)
SELECT city, ROUND(AVG(wind_speed), 2) as avg_wind_speed, MAX(wind_speed) as max_wind_speed FROM weather_data GROUP BY city ORDER BY max_wind_speed DESC;
