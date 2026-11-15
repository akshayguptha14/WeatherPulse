USE weather_climate;

-- Frequency of each weather condition
SELECT weather_condition, COUNT(*) as condition_count 
FROM weather_data 
GROUP BY weather_condition 
ORDER BY condition_count DESC;
