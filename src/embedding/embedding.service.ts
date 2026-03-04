import { Environment } from "../types/env";

export async function generateEmbeddings(text: string | string[], env: Environment): Promise<Ai_Cf_Baai_Bge_Base_En_V1_5_Output> {
  let data: string[];
  if (typeof text === "string") {
    data = [text];
  } else {
    data = text;
  }
  const modelResp = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: data,
  });

  return modelResp;
}
