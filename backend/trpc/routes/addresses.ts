import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDynamoClient, TABLES, generateId } from '@/backend/db';
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export const addressesRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getDynamoClient();
      
      const result = await db.send(new QueryCommand({
        TableName: TABLES.ADDRESSES,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': input.userId,
        },
      }));

      const addresses = result.Items || [];
      addresses.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

      return addresses.map((addr: any) => ({
        id: addr.id,
        type: addr.type,
        nickname: addr.nickname,
        address: addr.address,
        landmark: addr.landmark,
        coordinates: {
          lat: addr.lat,
          lng: addr.lng,
        },
      }));
    }),

  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      type: z.enum(['Home', 'Work', 'Other']),
      nickname: z.string().optional(),
      address: z.string(),
      landmark: z.string().optional(),
      lat: z.number(),
      lng: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = getDynamoClient();

      const addressId = generateId();
      const addr = {
        id: addressId,
        userId: input.userId,
        type: input.type,
        nickname: input.nickname,
        address: input.address,
        landmark: input.landmark,
        lat: input.lat,
        lng: input.lng,
        createdAt: Date.now(),
      };

      await db.send(new PutCommand({
        TableName: TABLES.ADDRESSES,
        Item: addr,
      }));

      return {
        id: addr.id,
        type: addr.type,
        nickname: addr.nickname,
        address: addr.address,
        landmark: addr.landmark,
        coordinates: {
          lat: addr.lat,
          lng: addr.lng,
        },
      };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      type: z.enum(['Home', 'Work', 'Other']).optional(),
      nickname: z.string().optional(),
      address: z.string().optional(),
      landmark: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDynamoClient();
      const { id, ...updates } = input;

      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (updates.type) {
        updateExpression.push('#type = :type');
        expressionAttributeNames['#type'] = 'type';
        expressionAttributeValues[':type'] = updates.type;
      }
      if (updates.nickname !== undefined) {
        updateExpression.push('#nickname = :nickname');
        expressionAttributeNames['#nickname'] = 'nickname';
        expressionAttributeValues[':nickname'] = updates.nickname;
      }
      if (updates.address) {
        updateExpression.push('#address = :address');
        expressionAttributeNames['#address'] = 'address';
        expressionAttributeValues[':address'] = updates.address;
      }
      if (updates.landmark !== undefined) {
        updateExpression.push('#landmark = :landmark');
        expressionAttributeNames['#landmark'] = 'landmark';
        expressionAttributeValues[':landmark'] = updates.landmark;
      }
      if (updates.lat) {
        updateExpression.push('#lat = :lat');
        expressionAttributeNames['#lat'] = 'lat';
        expressionAttributeValues[':lat'] = updates.lat;
      }
      if (updates.lng) {
        updateExpression.push('#lng = :lng');
        expressionAttributeNames['#lng'] = 'lng';
        expressionAttributeValues[':lng'] = updates.lng;
      }

      await db.send(new UpdateCommand({
        TableName: TABLES.ADDRESSES,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }));

      const result = await db.send(new GetCommand({
        TableName: TABLES.ADDRESSES,
        Key: { id },
      }));

      const addr = result.Item;
      if (!addr) {
        throw new Error('Address not found');
      }

      return {
        id: addr.id,
        type: addr.type,
        nickname: addr.nickname,
        address: addr.address,
        landmark: addr.landmark,
        coordinates: {
          lat: addr.lat,
          lng: addr.lng,
        },
      };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDynamoClient();
      await db.send(new DeleteCommand({
        TableName: TABLES.ADDRESSES,
        Key: { id: input.id },
      }));
      return { success: true };
    }),
});
