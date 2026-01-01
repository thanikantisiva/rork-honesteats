import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDynamoClient, TABLES } from '@/backend/db';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const AWS_API_BASE_URL = 'https://rur4ptgx77.execute-api.ap-south-1.amazonaws.com/dev';

export const authRouter = createTRPCRouter({
  requestOTP: publicProcedure
    .input(z.object({ 
      phone: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('OTP requested for:', input.phone);
      
      const response = await fetch(`${AWS_API_BASE_URL}/api/v1/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: input.phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send OTP');
      }

      return { success: true };
    }),

  login: publicProcedure
    .input(z.object({ 
      phone: z.string(),
      otp: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('Login attempt:', input);
      
      const response = await fetch(`${AWS_API_BASE_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: input.phone,
          otp: input.otp,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid or expired OTP');
      }

      const data = await response.json();
      
      return {
        user: {
          id: data.user.id,
          phone: data.user.phone,
          name: data.user.name,
          email: data.user.email,
        },
        token: data.token,
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
