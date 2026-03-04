import z from "zod";
import { conversationMessageRoleEnum } from "../../database/schema";

export const createConversationMessageSchema = z.object({
  message: z.string().min(1).trim(),
  role: z.enum(conversationMessageRoleEnum),
  transcriptionId: z.uuidv4(),
});

export type CreateConversationMessageSchema = z.infer<typeof createConversationMessageSchema>;
