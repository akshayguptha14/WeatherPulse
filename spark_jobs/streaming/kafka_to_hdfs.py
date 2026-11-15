from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, DoubleType
import sys

def main():
    print("=== Starting Spark Structured Streaming: Kafka to HDFS ===")
    
    spark = SparkSession.builder \
        .appName("WeatherKafkaToHDFS") \
        .getOrCreate()

    # Define schema matching the producer's JSON
    schema = StructType([
        StructField("source_timestamp", StringType(), True),
        StructField("ingest_timestamp", StringType(), True),
        StructField("city", StringType(), True),
        StructField("temperature", DoubleType(), True),
        StructField("humidity", DoubleType(), True),
        StructField("rainfall", DoubleType(), True),
        StructField("wind_speed", DoubleType(), True),
        StructField("pressure", DoubleType(), True),
        StructField("weather_condition", StringType(), True)
    ])

    print("Subscribing to Kafka topic 'weather_stream'...")
    
    import os

    # Read from Kafka starting from latest offsets by default to avoid replaying historical messages
    starting_offsets = os.environ.get("STARTING_OFFSETS", "latest")
    df = spark \
        .readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", "localhost:9092") \
        .option("subscribe", "weather_stream") \
        .option("startingOffsets", starting_offsets) \
        .option("failOnDataLoss", "false") \
        .load()

    # Parse JSON from the Kafka 'value' column
    parsed_df = df.selectExpr("CAST(value AS STRING) as json_value") \
        .select(from_json(col("json_value"), schema).alias("data")) \
        .select("data.*") \
        .withColumn("spark_processing_timestamp", current_timestamp())

    # Versioned output and checkpoint paths (preserves /weather/streaming/raw and older checkpoints)
    output_path = os.environ.get("OUTPUT_LOCATION", "hdfs://localhost:9000/weather/streaming/raw_v5")
    checkpoint_path = os.environ.get("CHECKPOINT_LOCATION", "hdfs://localhost:9000/weather/streaming/checkpoints/kafka_to_hdfs_v5")

    print(f"Writing to HDFS: {output_path}")
    print(f"Checkpoint location: {checkpoint_path}")

    # Write stream to HDFS as Parquet
    query = parsed_df \
        .writeStream \
        .outputMode("append") \
        .format("parquet") \
        .option("path", output_path) \
        .option("checkpointLocation", checkpoint_path) \
        .trigger(processingTime='5 seconds') \
        .start()

    query.awaitTermination()

if __name__ == "__main__":
    main()
