#!/bin/bash

# Usage: ./script.sh <path_to_private_key>

# Note: to get the list of IPs, AWS CLI must be configured with appropriate permissions.
IP_LIST=$(aws ec2 describe-instances --query "Reservations[*].Instances[*].PublicIpAddress" --output text)

KEY=$1

for IP in $IP_LIST; do
  ./configure_ssh.sh "$IP" "$KEY"
done

cd sshesame
for IP in $IP_LIST; do
  ./install_sshesame.sh "$IP" "$KEY"
done
cd ..