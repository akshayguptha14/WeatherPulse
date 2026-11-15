#!/bin/bash
set -e

source /mnt/c/Users/aksha/Desktop/BDT/weather_climate_project/scripts/hadoop/env.sh

echo "=== Configuring hadoop-env.sh ==="
sed -i "s|# export JAVA_HOME=.*|export JAVA_HOME=$JAVA_HOME|g" $HADOOP_HOME/etc/hadoop/hadoop-env.sh
sed -i "s|.*export JAVA_HOME=.*|export JAVA_HOME=$JAVA_HOME|g" $HADOOP_HOME/etc/hadoop/hadoop-env.sh

echo "=== Creating HDFS Data Directories ==="
mkdir -p ~/hadoop_data/namenode
mkdir -p ~/hadoop_data/datanode

echo "=== Configuring core-site.xml ==="
cat <<EOT > $HADOOP_HOME/etc/hadoop/core-site.xml
<configuration>
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://localhost:9000</value>
    </property>
    <property>
        <name>hadoop.tmp.dir</name>
        <value>$HOME/hadoop_tmp</value>
    </property>
</configuration>
EOT

echo "=== Configuring hdfs-site.xml ==="
cat <<EOT > $HADOOP_HOME/etc/hadoop/hdfs-site.xml
<configuration>
    <property>
        <name>dfs.replication</name>
        <value>1</value>
    </property>
    <property>
        <name>dfs.namenode.name.dir</name>
        <value>file://$HOME/hadoop_data/namenode</value>
    </property>
    <property>
        <name>dfs.datanode.data.dir</name>
        <value>file://$HOME/hadoop_data/datanode</value>
    </property>
</configuration>
EOT

echo "=== Configuring yarn-site.xml ==="
cat <<EOT > $HADOOP_HOME/etc/hadoop/yarn-site.xml
<configuration>
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
    <property>
        <name>yarn.nodemanager.env-whitelist</name>
        <value>JAVA_HOME,HADOOP_COMMON_HOME,HADOOP_HDFS_HOME,HADOOP_CONF_DIR,CLASSPATH_PREPEND_DISTCACHE,HADOOP_YARN_HOME,HADOOP_MAPRED_HOME</value>
    </property>
</configuration>
EOT

echo "=== Configuring mapred-site.xml ==="
cat <<EOT > $HADOOP_HOME/etc/hadoop/mapred-site.xml
<configuration>
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
    <property>
        <name>mapreduce.application.classpath</name>
        <value>\$HADOOP_HOME/share/hadoop/mapreduce/*:\$HADOOP_HOME/share/hadoop/mapreduce/lib/*</value>
    </property>
</configuration>
EOT

echo "=== Configuration Complete ==="
