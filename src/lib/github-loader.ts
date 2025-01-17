import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "@/server/db";
import { cleanGithubUrl } from "./utils";

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || process.env.GITHUB_TOKEN,
    ignoreFiles: [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lockb",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });

  const docs = await loader.load();
  // setProjectStatus("Docs successfully loaded! Starting embedding...");
  console.log("Docs successfully loaded! Next phase started...");
  return docs;
};

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(cleanGithubUrl(githubUrl), githubToken);
  const allEmbeddings = await generateEmbeddings(docs);
  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      // setProjectStatus(
      //   `Processing ${embedding.fileName} of ${allEmbeddings.length}....`,
      // );
      console.log(`Processing ${index} of ${allEmbeddings.length}....`);
      if (!embedding) return;
      const sourceCodeEmbeddings = await db.sourceCodeEmbedding.create({
        data: {
          projectId,
          summary: embedding.summary,
          sourceCode: embedding.sourceCode,
          fileName: embedding.fileName,
        },
      });
      await db.$executeRaw`
      UPDATE "SourceCodeEmbedding"
      SET "summaryEmbedding"= ${embedding.embedding}::vector
      WHERE "id"= ${sourceCodeEmbeddings.id}
      `;
    }),
  );
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateEmbeddings = async (docs: Document[]) => {
  const batchSize = 5;
  const delayTime = 10000;

  const result: any[] = [];

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (doc) => {
        const summary = await summariseCode(doc);
        const embedding = await generateEmbedding(summary);

        result.push({
          summary,
          embedding,
          sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
          fileName: doc.metadata.source,
        });
      }),
    );

    if (i + batchSize < docs.length) {
      const text =
        `Batch ${Math.floor(i / batchSize) + 1} processed. Pausing for ${delayTime / 1000} seconds... ` +
        `Total files: ${docs.length}, Files processed: ${result.length}`;

      console.log(
        `Batch ${i / batchSize + 1} processed. Waiting for ${delayTime / 1000} seconds... total files ${docs.length} completed ${result?.length}`,
      );

      await delay(delayTime);
    }
  }

  return result;
};
