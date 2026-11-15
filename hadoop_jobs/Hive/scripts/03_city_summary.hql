USE weather_climate;

SELECT 
    city, 
    COUNT(*) as records, 
    ROUND(AVG(temperature), 2) as avg_temp, 
    ROUND(MIN(temperature), 2) as min_temp, 
    ROUND(MAX(temperature), 2) as max_temp, 
    ROUND(AVG(humidity), 2) as avg_humidity, 
    ROUND(SUM(rainfall), 2) as total_rainfall, 
    ROUND(AVG(wind_speed), 2) as avg_wind_speed, 
    ROUND(MAX(wind_speed), 2) as max_wind_speed, 
    ROUND(AVG(pressure), 2) as avg_pressure 
FROM weather_data 
GROUP BY city 
ORDER BY city;
