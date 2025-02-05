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
  LIMIT 5
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
        - **Code Generation**: When asked to write code, ensure it follows the patterns and conventions shown in the context, maintaining consistency with the existing codebase.
        - **Markdown Format**: Write responses in markdown for enhanced readability.
        - **Code-Centric**: Include examples and snippets to support technical explanations.
        - **Engagement**: Offer practical, step-by-step advice.
  
        ### Format for Questions:
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
        [Detailed explanation...]
        \`\`\`

        ### Format for Code Writing:
        When asked to write code, provide:
        1. A brief explanation of the implementation approach
        2. The complete code solution following codebase patterns
        3. Instructions for integration if relevant
        4. Any important considerations or limitations

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
