import z from "zod";
export const getAllConversationMessageQuerySchema = z.object({
  transcriptionId: z.uuidv4().optional(),
});

export type GetAllConversationMessageQuerySchema = z.infer<typeof getAllConversationMessageQuerySchema>;
