package com.weather.analysis;

import java.io.DataInput;
import java.io.DataOutput;
import java.io.IOException;
import org.apache.hadoop.io.Writable;

public class WeatherStatsWritable implements Writable {
    private int count;
    private double temperature;
    private double humidity;
    private double rainfall;
    private double windSpeed;
    private double pressure;

    public WeatherStatsWritable() {
    }

    public WeatherStatsWritable(int count, double temperature, double humidity, double rainfall, double windSpeed, double pressure) {
        this.count = count;
        this.temperature = temperature;
        this.humidity = humidity;
        this.rainfall = rainfall;
        this.windSpeed = windSpeed;
        this.pressure = pressure;
    }

    public void write(DataOutput out) throws IOException {
        out.writeInt(count);
        out.writeDouble(temperature);
        out.writeDouble(humidity);
        out.writeDouble(rainfall);
        out.writeDouble(windSpeed);
        out.writeDouble(pressure);
    }

    public void readFields(DataInput in) throws IOException {
        count = in.readInt();
        temperature = in.readDouble();
        humidity = in.readDouble();
        rainfall = in.readDouble();
        windSpeed = in.readDouble();
        pressure = in.readDouble();
    }

    public int getCount() { return count; }
    public double getTemperature() { return temperature; }
    public double getHumidity() { return humidity; }
    public double getRainfall() { return rainfall; }
    public double getWindSpeed() { return windSpeed; }
    public double getPressure() { return pressure; }
}
