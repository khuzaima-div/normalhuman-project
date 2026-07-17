import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, " "),
    });

    const embedding = response.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error("No embeddings returned from OpenAI API");
    }

    return embedding;
  } catch (error) {
    console.error("Error calling OpenAI embeddings API:", error);
    throw error;
  }
}
