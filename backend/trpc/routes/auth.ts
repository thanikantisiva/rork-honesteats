import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDynamoClient, TABLES } from '@/backend/db';
import { GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const MOCK_OTP_MODE = true;
const MOCK_OTP = '1234';

export const authRouter = createTRPCRouter({
  requestOTP: publicProcedure
    .input(z.object({ 
      phone: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('OTP requested for:', input.phone);
      
      if (MOCK_OTP_MODE) {
        console.log(`MOCK MODE: OTP is ${MOCK_OTP}`);
        return { success: true };
      }
      
      try {
        console.log('Sending OTP via Firebase to:', input.phone);
        return { success: true, message: 'Firebase OTP requires client-side reCAPTCHA' };
      } catch (error) {
        console.error('Failed to send OTP:', error);
        throw new Error('Failed to send OTP. Please check your network connection.');
      }
    }),

  login: publicProcedure
    .input(z.object({ 
      phone: z.string(),
      otp: z.string(),
      verificationId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('Login attempt:', input);
      
      if (MOCK_OTP_MODE) {
        if (input.otp === MOCK_OTP) {
          console.log('MOCK MODE: Login successful');
          const mockUserId = `mock-${input.phone.replace(/\+/g, '')}`;
          
          const db = getDynamoClient();
          const existingUser = await db.send(new GetCommand({
            TableName: TABLES.USERS,
            Key: { id: mockUserId },
          }));
          
          if (!existingUser.Item) {
            await db.send(new PutCommand({
              TableName: TABLES.USERS,
              Item: {
                id: mockUserId,
                phone: input.phone,
                name: 'Test User',
                email: null,
                createdAt: new Date().toISOString(),
              },
            }));
          }
          
          return {
            user: {
              id: mockUserId,
              phone: input.phone,
              name: existingUser.Item?.name || 'Test User',
              email: existingUser.Item?.email || null,
            },
            token: mockUserId,
          };
        } else {
          throw new Error('Invalid OTP. Use 1234 for testing.');
        }
      }
      
      throw new Error('Firebase phone auth requires client-side verification. Please use MOCK_OTP_MODE.');
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
