#!/bin/bash

# Usage: ./script.sh <target_ip> <path_to_private_key>
# This script deploys sshesame to a remote server via rsync and SSH, then starts the service using systemd.
# Note: Assumes the remote server is accessible via SSH on port 22022.

if [ $# -ne 2 ]; then
  echo "Usage: $0 <target_ip> <path_to_private_key>"
  exit 1
fi

 # Generate SSH host keys if not exist
if [ ! -f ssh_host_rsa_key ]; then
  ssh-keygen -t rsa -b 4096 -f ssh_host_rsa_key -N ""
fi
if [ ! -f ssh_host_ecdsa_key ]; then
  ssh-keygen -t ecdsa -b 521 -f ssh_host_ecdsa_key -N ""
fi
if [ ! -f ssh_host_ed25519_key ]; then
  ssh-keygen -t ed25519 -f ssh_host_ed25519_key -N ""
fi

IP=$1
PORT=22022
KEY=$2
SSH_ARGS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $PORT -i $KEY"

# Copy the files on the remote server
ssh $SSH_ARGS root@"$IP" "command -v rsync >/dev/null 2>&1 || (apt-get update && apt-get install -y rsync)"
rsync -avz -e "ssh $SSH_ARGS" sshesame root@"$IP":/usr/local/bin/
ssh $SSH_ARGS root@"$IP" "chmod +x /usr/local/bin/sshesame"
rsync -avz -e "ssh $SSH_ARGS" sshesame.yaml root@"$IP":/etc/sshesame/
rsync -avz -e "ssh $SSH_ARGS" ssh_host_rsa_key root@"$IP":/etc/sshesame/
rsync -avz -e "ssh $SSH_ARGS" ssh_host_ecdsa_key root@"$IP":/etc/sshesame/
rsync -avz -e "ssh $SSH_ARGS" ssh_host_ed25519_key root@"$IP":/etc/sshesame/
rsync -avz -e "ssh $SSH_ARGS" sshesame.service root@"$IP":/etc/systemd/system/

# Start and enable the sshesame service on the remote server
ssh $SSH_ARGS root@"$IP" "systemctl daemon-reload && systemctl enable sshesame && systemctl restart sshesame && systemctl status sshesame --no-pager"

echo "Deployment completed."
