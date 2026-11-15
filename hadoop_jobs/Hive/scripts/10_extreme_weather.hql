USE weather_climate;

-- Identify notable records based on extreme conditions
-- Demonstration thresholds:
-- Temperature >= 40.0 (Extreme Heat)
-- Rainfall >= 20.0 (Heavy Rain)
-- Wind Speed >= 20.0 (Strong Wind)
SELECT 
    `timestamp`, 
    city, 
    temperature, 
    humidity, 
    rainfall, 
    wind_speed, 
    weather_condition 
FROM weather_data 
WHERE temperature >= 40.0 
   OR rainfall >= 20.0 
   OR wind_speed >= 20.0 
ORDER BY `timestamp` DESC;
