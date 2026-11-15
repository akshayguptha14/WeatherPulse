package com.weather.analysis;

import java.io.IOException;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;

public class WeatherStatsReducer extends Reducer<Text, WeatherStatsWritable, Text, Text> {

    private Text result = new Text();

    @Override
    public void reduce(Text key, Iterable<WeatherStatsWritable> values, Context context) throws IOException, InterruptedException {
        int count = 0;
        double sumTemp = 0.0;
        double minTemp = Double.MAX_VALUE;
        double maxTemp = Double.MIN_VALUE;
        double sumHumidity = 0.0;
        double totalRainfall = 0.0;
        double sumWindSpeed = 0.0;
        double maxWindSpeed = Double.MIN_VALUE;
        double sumPressure = 0.0;

        for (WeatherStatsWritable val : values) {
            count += val.getCount();
            
            double temp = val.getTemperature();
            sumTemp += temp;
            if (temp < minTemp) minTemp = temp;
            if (temp > maxTemp) maxTemp = temp;
            
            sumHumidity += val.getHumidity();
            totalRainfall += val.getRainfall();
            
            double wind = val.getWindSpeed();
            sumWindSpeed += wind;
            if (wind > maxWindSpeed) maxWindSpeed = wind;
            
            sumPressure += val.getPressure();
        }

        if (count > 0) {
            double avgTemp = sumTemp / count;
            double avgHumidity = sumHumidity / count;
            double avgWindSpeed = sumWindSpeed / count;
            double avgPressure = sumPressure / count;

            String outStr = String.format("%d %.2f %.2f %.2f %.2f %.2f %.2f %.2f %.2f",
                count, avgTemp, minTemp, maxTemp, avgHumidity, totalRainfall, avgWindSpeed, maxWindSpeed, avgPressure);
            
            result.set(outStr);
            context.write(key, result);
        }
    }
}
