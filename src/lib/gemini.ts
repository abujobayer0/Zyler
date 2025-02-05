import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

export const aiSummariseCommit = async (diff: string) => {
  //https://github.com/owner/repo-name/commit/<commithash>.diff

  const response = await model.generateContent([
    `You are an expert programmer, and trying to summerize a git diff.
    Reminders about the git diff format:
    For every file,there are a few metadata lines, like (for example):
    \`\`\`
    diff --git a/index.js b/index.js
    index aaaf691..bfef603 100644
    --- a/lib/index.js
    +++ b/lib/index.js
    \`\`\`
    This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
    Then there is a specifier of the lines that were modified.
    A line starting with \`+\` means it was added.
    A line that starting with \`-\` means it was removed.
    A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
    It is not part of the diff.
    [....]
    EXAMPLE SUMMERY COMMENTS:
    \`\`\`
    * Raised the amount of returned recordings from \`10\` to \`100\` [package/server/recordings_api.ts], [package/server/constants.ts]
    * Fixed the issue of the \`fetchRecordings\` method not returning the expected recordings [package/server/recordings_api.ts]
    * Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
    * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
    * Lowered numeric tolerance for test files
    \`\`\`
    Most commits will have less comments than this example list.
    The last comment does not include the file names,
    because there were more than two relevant files in the hypothetical commit.
    Do not include this part of the example in your summery.
    It is given only as an example of appropriate comments.`,
    `Please summarise in the following diff file: \n\n${diff}`,
  ]);

  return response.response.text();
};

export const summariseCode = async (doc: Document) => {
  const code = doc.pageContent.slice(0, 6000);

  const maxRetries = 5;
  let attempt = 0;
  const baseDelay = 2000; // 2 seconds base delay

  while (attempt < maxRetries) {
    try {
      if (attempt > 0) {
        // Add jitter to avoid thundering herd problem
        const jitter = Math.random() * 1000;
        const delayTime = Math.min(
          baseDelay * Math.pow(2, attempt) + jitter,
          30000, // Max delay of 30 seconds
        );
        console.log(
          `Attempt ${attempt + 1}/${maxRetries}: Waiting ${
            Math.round(delayTime / 100) / 10
          }s before retry...`,
        );
        await delay(delayTime);
      }

      console.log(
        `Attempt ${attempt + 1}/${maxRetries}: Generating content...`,
      );
      const response = await model.generateContent([
        `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.`,
        `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
        Here is the code:
        ---
        ${code}
        ---
        Give me a summary no more than 150 words of the code above.`,
      ]);

      return response.response.text();
    } catch (error: any) {
      attempt++;

      if (error.status === 429) {
        if (attempt >= maxRetries) {
          throw new Error(`Rate limit exceeded after ${maxRetries} attempts`);
        }
        console.warn(`Rate limit hit on attempt ${attempt}/${maxRetries}`);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw new Error("Max retries exceeded");
};

// Delay function to simulate waiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateEmbedding = async (summary: string) => {
  const result = await embeddingModel.embedContent(summary);
  const embedding = result.embedding;
  console.log("Emedding succeeded!");
  return embedding.values;
};
