import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const aiSummariseCommit = async (diff: string) => {
  //https://github.com/abujobayer01/CollaborationBoard/commit/<commithash>.diff
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
