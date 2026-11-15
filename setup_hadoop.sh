#!/bin/bash
set -e

echo "=== Identifying Java 17 path ==="
JAVA_PATH=$(update-alternatives --list java | grep java-17 | head -n 1)
JAVA_HOME_DIR=$(dirname $(dirname $JAVA_PATH))
echo "JAVA_HOME detected as: $JAVA_HOME_DIR"

echo "=== Configuring SSH ==="
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
fi
if ! grep -q "$(cat ~/.ssh/id_rsa.pub)" ~/.ssh/authorized_keys 2>/dev/null; then
    cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
fi

echo "=== Testing SSH ==="
ssh -o StrictHostKeyChecking=no localhost echo "SSH login successful"

echo "=== Downloading and Extracting Hadoop 3.5.0 ==="
mkdir -p ~/bigdata
cd ~/bigdata
if [ ! -d "hadoop-3.5.0" ]; then
    echo "Downloading Hadoop..."
    wget -q https://downloads.apache.org/hadoop/common/hadoop-3.5.0/hadoop-3.5.0.tar.gz -O hadoop-3.5.0.tar.gz || wget -q https://archive.apache.org/dist/hadoop/common/hadoop-3.5.0/hadoop-3.5.0.tar.gz -O hadoop-3.5.0.tar.gz
    echo "Extracting Hadoop..."
    tar -xzf hadoop-3.5.0.tar.gz
    rm hadoop-3.5.0.tar.gz
fi

rm -f ~/bigdata/hadoop
ln -s ~/bigdata/hadoop-3.5.0 ~/bigdata/hadoop

echo "=== Configuring Environment Variables ==="
# Append to bashrc if not exists
if ! grep -q "HADOOP_HOME=" ~/.bashrc; then
cat <<EOT >> ~/.bashrc
export JAVA_HOME=$JAVA_HOME_DIR
export HADOOP_HOME=\$HOME/bigdata/hadoop
export HADOOP_CONF_DIR=\$HADOOP_HOME/etc/hadoop
export HADOOP_COMMON_HOME=\$HADOOP_HOME
export HADOOP_HDFS_HOME=\$HADOOP_HOME
export HADOOP_MAPRED_HOME=\$HADOOP_HOME
export HADOOP_YARN_HOME=\$HADOOP_HOME
export PATH=\$PATH:\$JAVA_HOME/bin:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin
export PDSH_RCMD_TYPE=ssh
EOT
fi

echo "=== Finished Script 1 ==="
