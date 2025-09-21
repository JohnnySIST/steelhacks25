#!/bin/bash

# Usage: ./configure_ssh.sh <ip> <path_to_private_key>
# This script changes the SSH configuration on all AWS EC2 instances to allow root login and sets the SSH port to 22022.

if [ $# -ne 2 ]; then
  echo "Usage: $0 <ip> <path_to_private_key>"
  exit 1
fi

IP=$1
KEY=$2

echo "Configuring $IP ..."
ssh -i "$KEY" ubuntu@"$IP" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  "sudo sed -i \
  -e 's/^#*Port .*/Port 22022/' \
  -e 's/^#*PermitRootLogin .*/PermitRootLogin yes/' \
  /etc/ssh/sshd_config && \
  sudo cp ~/.ssh/authorized_keys /root/.ssh/ && \
  sudo systemctl daemon-reload && sudo systemctl restart ssh.socket"

if [ $? -eq 0 ]; then
  echo "Configuration on $IP completed."
else
  echo "Failed to configure $IP."
fi