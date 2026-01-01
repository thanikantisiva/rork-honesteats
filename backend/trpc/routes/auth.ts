import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { getDynamoClient, TABLES } from '@/backend/db';
import { GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ 
      phone: z.string(),
      firebaseToken: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('Login with Firebase token for:', input.phone);
      
      const userId = `user-${input.phone.replace(/\+/g, '')}`;
      
      const db = getDynamoClient();
      const existingUser = await db.send(new GetCommand({
        TableName: TABLES.USERS,
        Key: { id: userId },
      }));
      
      if (!existingUser.Item) {
        await db.send(new PutCommand({
          TableName: TABLES.USERS,
          Item: {
            id: userId,
            phone: input.phone,
            name: 'User',
            email: null,
            createdAt: new Date().toISOString(),
          },
        }));
      }
      
      return {
        user: {
          id: userId,
          phone: input.phone,
          name: existingUser.Item?.name || 'User',
          email: existingUser.Item?.email || null,
        },
        token: userId,
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
