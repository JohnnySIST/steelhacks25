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
      ProjectionExpression: "#input",
      ExpressionAttributeNames: { "#input": "input" }
    }));
    items = items.concat(data.Items.map(unmarshall));
    lastKey = data.LastEvaluatedKey;
  } while (lastKey);

  // Count frequency
  const freq = {};
  for (const item of items) {
    if (item.input) {
      freq[item.input] = (freq[item.input] || 0) + 1;
    }
  }

  // Sort and get top 50
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([input, count]) => ({ input, count }));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(top)
  };
};