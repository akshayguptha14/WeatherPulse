package com.weather.analysis;

import java.io.IOException;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

public class WeatherStatsMapper extends Mapper<LongWritable, Text, Text, WeatherStatsWritable> {

    public enum WeatherCounters {
        VALID_RECORDS,
        MALFORMED_RECORDS,
        HEADER_RECORDS
    }

    private Text cityOut = new Text();

    @Override
    public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        String line = value.toString().trim();
        
        // Skip header
        if (line.startsWith("timestamp") || line.contains("temperature")) {
            context.getCounter(WeatherCounters.HEADER_RECORDS).increment(1);
            return;
        }
        
        String[] fields = line.split(",");
        
        if (fields.length < 8) {
            context.getCounter(WeatherCounters.MALFORMED_RECORDS).increment(1);
            return;
        }

        try {
            String city = fields[1].trim();
            double temperature = Double.parseDouble(fields[2].trim());
            double humidity = Double.parseDouble(fields[3].trim());
            double rainfall = Double.parseDouble(fields[4].trim());
            double windSpeed = Double.parseDouble(fields[5].trim());
            double pressure = Double.parseDouble(fields[6].trim());
            
            cityOut.set(city);
            WeatherStatsWritable stats = new WeatherStatsWritable(1, temperature, humidity, rainfall, windSpeed, pressure);
            context.write(cityOut, stats);
            
            context.getCounter(WeatherCounters.VALID_RECORDS).increment(1);
        } catch (NumberFormatException e) {
            context.getCounter(WeatherCounters.MALFORMED_RECORDS).increment(1);
        }
    }
}
