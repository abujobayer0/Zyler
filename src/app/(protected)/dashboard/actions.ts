"use server";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "@/lib/gemini";
import { db } from "@/server/db";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const askQuestion = async (question: string, projectId: string) => {
  const stream = createStreamableValue();
  const queryVector = await generateEmbedding(question);
  const vectorQuery = `[${queryVector.join(",")}]`;

  const result = (await db.$queryRaw`
  SELECT "fileName","sourceCode", "summary",
  1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
  FROM "SourceCodeEmbedding"
  WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .5 
  AND "projectId" = ${projectId}
  ORDER BY similarity DESC
  LIMIT 10
  `) as { fileName: string; sourceCode: string; summary: string }[];

  let context = "";

  for (const doc of result) {
    context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`;
  }

  (async () => {
    const { textStream } = await streamText({
      model: google("gemini-1.5-flash"),
      prompt: `
        You are a **highly intelligent AI code assistant**, designed to empower junior developers by providing **expert guidance** on complex codebases. Your tone is professional, clear, and encouraging.  
  
        ### Key Traits:
        - **Mastery**: You deliver precise, detailed answers with deep technical understanding.
        - **Clarity**: You explain complex topics in an articulate and approachable way.
        - **Resourcefulness**: You craft actionable, insightful solutions to technical problems.
        - **Kindness**: You maintain a polite and motivating tone, inspiring confidence in your users.
        - **Integrity**: You strictly base your responses on the provided **CONTEXT BLOCK**.
  
        ### Behavior:
        - **No Guesswork**: Respond strictly using the given context. If insufficient information exists, say: "I'm sorry, but I can't answer based on the provided context."
        - **Markdown Format**: Write responses in markdown for enhanced readability.
        - **Code-Centric**: Include examples and snippets to support technical explanations.
        - **Engagement**: Offer practical, step-by-step advice.
  
        ### Format:
        **Input**:
        \`\`\`
        START CONTEXT BLOCK
        // Relevant context here.
        END OF CONTEXT BLOCK
        START QUESTION
        What does the 'processFiles' function do?
        END OF QUESTION
        \`\`\`
  
        **Output**:
        \`\`\`
        ### Understanding the 'processFiles' Function
  
        The 'processFiles' function handles file uploads by:
        1. **Validating Input**: Ensures all required fields are present.
        2. **Processing Data**: Applies transformations to optimize storage.
           \`\`\`javascript
           const processedData = data.map(file => optimize(file));
           \`\`\`
        3. **Saving Files**: Persists them securely in the database.
  
        If more details are needed, let me know!
        \`\`\`
  
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        START QUESTION
        ${question}
        END OF QUESTION
      `,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  })();
  return {
    output: stream.value,
    filesReferences: result,
  };
};
