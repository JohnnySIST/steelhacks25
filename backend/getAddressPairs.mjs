import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const handler = async (event) => {
  const client = new DynamoDBClient({});
  let items = [];
  let lastKey = undefined;
  do {
    const data = await client.send(new ScanCommand({
      TableName: "steelhacks-attackdb",
      ProjectionExpression: "#ip, #src_ip, #event_type",
      ExpressionAttributeNames: {
        "#ip": "ip",
        "#src_ip": "src_ip",
        "#event_type": "event_type"
      },
      ExclusiveStartKey: lastKey
    }));
    items = items.concat(data.Items.map(unmarshall));
    lastKey = data.LastEvaluatedKey;
  } while (lastKey);

  // Only keep event_type === 'password_auth'
  const filtered = items.filter(item => item.event_type === 'password_auth');

  // Unique ip, src_ip pairs
  const pairSet = new Set();
  const pairs = [];
  for (const item of filtered) {
    const ip = item.ip || '';
    const src_ip = item.src_ip || '';
    if (!ip || !src_ip) continue;
    const key = ip + '|' + src_ip;
    if (!pairSet.has(key)) {
      pairSet.add(key);
      pairs.push({ ip, src_ip });
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pairs)
  };
};
