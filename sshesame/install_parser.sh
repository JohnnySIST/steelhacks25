#!/bin/bash

# Usage: ./install_parser.sh <target_ip> <path_to_ssh_key>
# This script will:
# 1. Store the public IP in /etc/public_ip on the remote server
# 2. Install dependencies for parse_log.py (pip, boto3, requests)
# 3. Set up crontab to run parse_log.py every minute
# Note: Assumes the remote server has access to corresponding AWS resources.

if [ $# -ne 2 ]; then
  echo "Usage: $0 <target_ip> <path_to_ssh_key>"
  exit 1
fi

IP=$1
PORT=22022
KEY=$2
SSH_ARGS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $PORT -i $KEY"

# 1. Store public IP to /etc/public_ip
ssh $SSH_ARGS root@"$IP" "echo $IP | tee /etc/public_ip"

# 2. Install dependencies (pip, boto3, requests)
ssh $SSH_ARGS root@"$IP" "sudo apt-get update && sudo apt-get install -y python3-boto3"
rsync -avz -e "ssh $SSH_ARGS" parse_log.py root@"$IP":~/sshesame/

# 3. Set up crontab to run parse_log.py every minute
ssh $SSH_ARGS root@"$IP" "(echo '* * * * * cd ~/sshesame && python3 parse_log.py >> debug.log 2>&1') | crontab -"

echo "Parser installation and scheduling complete on $IP."
