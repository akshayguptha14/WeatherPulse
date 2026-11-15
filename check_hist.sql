USE weather_climate;
SELECT `timestamp`, city, temperature, humidity, rainfall, wind_speed, pressure, weather_condition
FROM weather_data
WHERE city != 'city'
ORDER BY `timestamp` ASC;
