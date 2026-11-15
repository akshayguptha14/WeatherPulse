from pyspark.sql import SparkSession

def main():
    spark = SparkSession.builder.appName("VerifyParquet").getOrCreate()
    df = spark.read.parquet("hdfs://localhost:9000/weather/streaming/raw")
    print("Schema:")
    df.printSchema()
    print("Sample Data:")
    df.show(5, truncate=False)
    print(f"Total Record Count: {df.count()}")
    
    cities = df.select("city").distinct().collect()
    print("Cities Present:", [row['city'] for row in cities])

if __name__ == "__main__":
    main()
