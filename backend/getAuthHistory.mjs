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
      ProjectionExpression: "#ip, #timestamp, #accepted, #event_type, #password, #src_ip, #user",
      ExpressionAttributeNames: {
        "#ip": "ip",
        "#timestamp": "timestamp",
        "#accepted": "accepted",
        "#event_type": "event_type",
        "#password": "password",
        "#src_ip": "src_ip",
        "#user": "user"
      },
      ExclusiveStartKey: lastKey
    }));
    items = items.concat(data.Items.map(unmarshall));
    lastKey = data.LastEvaluatedKey;
  } while (lastKey);

  // Filter for event_type === 'password_auth'
  const filtered = items.filter(item => item.event_type === 'password_auth');

  // Return all fields as-is (DynamoDB types are preserved)
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filtered)
  };
};
