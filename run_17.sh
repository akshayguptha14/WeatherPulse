for i in {1..17}; do echo "Batch $i"; python3 kafka_streams/live_weather_producer.py --once; sleep 5; done
