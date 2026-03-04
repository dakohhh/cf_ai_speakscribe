import z from "zod";
export const deleteTranscriptionParamSchema = z.object({
  transcriptionId: z.coerce.string(),
});
