#!/bin/bash
source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

CP=$(hadoop classpath)

cat << EOT > /home/akshay/bigdata/hadoop/etc/hadoop/mapred-site.xml
<configuration>
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
    <property>
        <name>yarn.app.mapreduce.am.env</name>
        <value>HADOOP_MAPRED_HOME=/home/akshay/bigdata/hadoop</value>
    </property>
    <property>
        <name>mapreduce.map.env</name>
        <value>HADOOP_MAPRED_HOME=/home/akshay/bigdata/hadoop</value>
    </property>
    <property>
        <name>mapreduce.reduce.env</name>
        <value>HADOOP_MAPRED_HOME=/home/akshay/bigdata/hadoop</value>
    </property>
    <property>
        <name>mapreduce.application.classpath</name>
        <value>$CP</value>
    </property>
</configuration>
EOT
