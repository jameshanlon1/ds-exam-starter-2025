import { SQSEvent } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: process.env.REGION });

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("Processing SQS event:", JSON.stringify(event));

  const queueBUrl = process.env.QUEUE_B_URL;
  if (!queueBUrl) {
    console.error("QUEUE_B_URL environment variable is not set.");
    throw new Error("Missing QUEUE_B_URL");
  }

  for (const record of event.Records) {
    const message = record.body;
    console.log("Received message from Queue A:", message);

    try {
      const messageData = JSON.parse(message);

      if (!messageData.email) {
        const command = new SendMessageCommand({
          QueueUrl: queueBUrl,
          MessageBody: message,
          MessageAttributes: {
            ProcessedBy: {
              DataType: "String",
              StringValue: "LambdaX",
            },
            Timestamp: {
              DataType: "String",
              StringValue: new Date().toISOString(),
            },
          },
        });

        await sqsClient.send(command);
        console.log("Message forwarded to Queue B (missing email property)");
      } else {
        console.log("Message has email property, not forwarding to Queue B");
      }
    } catch (parseError) {
      console.error("Error parsing message body as JSON:", parseError);
    }
  }
};
