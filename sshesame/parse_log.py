#!/usr/bin/env python3
import boto3

import json
import uuid
import os
from datetime import datetime

host_ip_file = '/etc/public_ip'
if os.path.exists(host_ip_file):
    with open(host_ip_file, 'r') as f:
        HOST_IP = f.read().strip()

# DynamoDB configuration
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('steelhacks-attackdb')

STATE_FILE = 'last_processed.txt'

def parse_log_line(line):
    try:
        data = json.loads(line)
    except Exception:
        return None
    # Extract fields from JSON log
    timestamp = data.get('time')
    source = data.get('source', '')
    event_type = data.get('event_type')
    event = data.get('event', {})
    src_ip, src_port = source.split(':') if ':' in source else (source, None)
    # Flatten event fields
    item = {
        'ip': HOST_IP,
        'timestamp': timestamp,
        'src_ip': src_ip,
        'src_port': src_port,
        'event_type': event_type,
        'event': event,
    }
    # Merge event fields into item
    for k, v in event.items():
        item[k] = v
    return item

def get_last_processed_time():
    try:
        with open(STATE_FILE, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

def set_last_processed_time(ts):
    with open(STATE_FILE, 'w') as f:
        f.write(ts)

def main():
    last_time = get_last_processed_time()
    last_dt = datetime.fromisoformat(last_time.replace('Z','')) if last_time else None
    with open('/var/log/sshesame.log', 'r') as f:
        for line in f:
            parsed = parse_log_line(line)
            if not parsed:
                continue
            # Only use the log timestamp to check progress
            try:
                log_dt = datetime.fromisoformat(parsed['timestamp'].replace('Z',''))
            except Exception:
                log_dt = None
            if last_dt and log_dt and log_dt <= last_dt:
                continue
            table.put_item(Item=parsed)
            print(f"Inserted log with timestamp {parsed['timestamp']} and ip {parsed['ip']}")
            if log_dt:
                set_last_processed_time(parsed['timestamp'])

if __name__ == '__main__':
    main()
