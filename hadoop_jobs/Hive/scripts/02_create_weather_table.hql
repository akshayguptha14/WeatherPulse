USE weather_climate;

DROP TABLE IF EXISTS weather_data;

CREATE EXTERNAL TABLE weather_data (
    `timestamp` STRING,
    city STRING,
    temperature DOUBLE,
    humidity DOUBLE,
    rainfall DOUBLE,
    wind_speed DOUBLE,
    pressure DOUBLE,
    weather_condition STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/weather/raw/'
TBLPROPERTIES ("skip.header.line.count"="1");
