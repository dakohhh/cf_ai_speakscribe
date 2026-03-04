import z from "zod";

export const getAllSpeakerTurnsQuerySchema = z.object({
  transcriptionId: z.uuidv4().optional(),
});

export type GetAllSpeakerTurnsQuerySchema = z.infer<typeof getAllSpeakerTurnsQuerySchema>;
