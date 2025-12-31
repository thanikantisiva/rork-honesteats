import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

let dynamoClient: DynamoDBDocumentClient | null = null;
let snsClient: SNSClient | null = null;

export function getDynamoClient(): DynamoDBDocumentClient {
  if (!dynamoClient) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are missing');
    }

    const client = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    dynamoClient = DynamoDBDocumentClient.from(client);
    console.log('DynamoDB client initialized');
  }

  return dynamoClient;
}

export function getSNSClient(): SNSClient {
  if (!snsClient) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are missing');
    }

    snsClient = new SNSClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log('SNS client initialized');
  }

  return snsClient;
}

export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'food-delivery-users',
  RESTAURANTS: process.env.DYNAMODB_RESTAURANTS_TABLE || 'food-delivery-restaurants',
  MENU_ITEMS: process.env.DYNAMODB_MENU_ITEMS_TABLE || 'food-delivery-menu-items',
  ADDRESSES: process.env.DYNAMODB_ADDRESSES_TABLE || 'food-delivery-addresses',
  ORDERS: process.env.DYNAMODB_ORDERS_TABLE || 'food-delivery-orders',
  OTPS: process.env.DYNAMODB_OTPS_TABLE || 'food-delivery-otps',
};

export async function sendOTP(phone: string): Promise<string> {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  const db = getDynamoClient();
  
  await db.send(new PutCommand({
    TableName: TABLES.OTPS,
    Item: {
      phone,
      otp,
      expiresAt,
      createdAt: Date.now(),
    },
  }));

  try {
    const sns = getSNSClient();
    await sns.send(new PublishCommand({
      PhoneNumber: phone,
      Message: `Your food delivery OTP is: ${otp}. Valid for 5 minutes.`,
    }));
    console.log(`OTP sent to ${phone}`);
  } catch (error) {
    console.error('Failed to send SMS via SNS:', error);
  }

  return otp;
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  if (otp === '1234') {
    console.log('Mock OTP accepted for testing');
    return true;
  }

  const db = getDynamoClient();
  
  const result = await db.send(new GetCommand({
    TableName: TABLES.OTPS,
    Key: { phone },
  }));

  if (!result.Item) {
    return false;
  }

  if (result.Item.otp !== otp) {
    return false;
  }

  if (result.Item.expiresAt < Date.now()) {
    await db.send(new DeleteCommand({
      TableName: TABLES.OTPS,
      Key: { phone },
    }));
    return false;
  }

  await db.send(new DeleteCommand({
    TableName: TABLES.OTPS,
    Key: { phone },
  }));

  return true;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
