import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDynamoClient, TABLES, sendOTP, verifyOTP, generateId } from '@/backend/db';
import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export const authRouter = createTRPCRouter({
  requestOTP: publicProcedure
    .input(z.object({ 
      phone: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('OTP requested for:', input.phone);
      await sendOTP(input.phone);
      return { success: true };
    }),

  login: publicProcedure
    .input(z.object({ 
      phone: z.string(),
      otp: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('Login attempt:', input);
      const db = getDynamoClient();

      const isValid = await verifyOTP(input.phone, input.otp);
      if (!isValid) {
        throw new Error('Invalid or expired OTP');
      }

      const result = await db.send(new QueryCommand({
        TableName: TABLES.USERS,
        IndexName: 'phone-index',
        KeyConditionExpression: 'phone = :phone',
        ExpressionAttributeValues: {
          ':phone': input.phone,
        },
      }));

      let user;
      if (result.Items && result.Items.length > 0) {
        user = result.Items[0];
      } else {
        const userId = generateId();
        user = {
          id: userId,
          phone: input.phone,
          name: 'User',
          createdAt: Date.now(),
        };
        
        await db.send(new PutCommand({
          TableName: TABLES.USERS,
          Item: user,
        }));
      }

      return {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
        },
        token: user.id,
      };
    }),

  updateProfile: publicProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDynamoClient();
      const { userId, ...updates } = input;

      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (updates.name) {
        updateExpression.push('#name = :name');
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':name'] = updates.name;
      }
      if (updates.email) {
        updateExpression.push('#email = :email');
        expressionAttributeNames['#email'] = 'email';
        expressionAttributeValues[':email'] = updates.email;
      }

      await db.send(new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { id: userId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }));

      const result = await db.send(new GetCommand({
        TableName: TABLES.USERS,
        Key: { id: userId },
      }));

      const user = result.Item;
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      };
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getDynamoClient();
      
      const result = await db.send(new GetCommand({
        TableName: TABLES.USERS,
        Key: { id: input.userId },
      }));

      const user = result.Item;
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
      };
    }),
});
