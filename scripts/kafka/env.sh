#!/bin/bash

# Kafka Environment Variables
export KAFKA_HOME=$HOME/bigdata/kafka
export PATH=$KAFKA_HOME/bin:$PATH

# Add existing Java home
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
