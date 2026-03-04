import z from "zod";
export const getTranscriptionParamSchema = z.object({
  transcriptionId: z.coerce.string(),
});
