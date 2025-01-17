import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
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
  // Limit the code length to 10,000 characters
  const code = doc.pageContent.slice(0, 10000);

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log("Attempting to generate content...");
      // setProjectStatus(`Generating summary for ${doc.metadata.source}.`);
      // Generate the summary via the model
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
      console.error("Error generating content:", error);

      if (error.status === 429) {
        // Retry logic if rate limit is hit
        attempt++;
        const delayTime = Math.pow(2, attempt) * 1000; // Exponential backoff (1s, 2s, 4s, 8s...)
        console.log(
          `Rate limit exceeded. Retrying in ${delayTime / 1000} seconds...`,
        );
        // setProjectStatus(
        //   `Rate limit exceeded. Retrying in ${delayTime / 1000} seconds...`,
        // );
        await delay(delayTime); // Wait before retrying
      } else {
        // If it's another error, throw it
        throw error;
      }
    }
  }

  throw new Error("Max retries exceeded");
};

// Delay function to simulate waiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateEmbedding = async (summary: string) => {
  const model = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });

  const result = await model.embedContent(summary);
  const embedding = result.embedding;
  console.log("Emedding succeeded!");
  // setProjectStatus("Embedding succeded!");
  return embedding.values;
};
