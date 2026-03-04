import z from "zod";

export const createTranscriptionSchema = z.object({
  name: z.string().min(3).max(256).trim(),
});

export type CreateTranscriptionSchema = z.infer<typeof createTranscriptionSchema>;
