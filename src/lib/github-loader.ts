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
      "node_modules",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });

  const docs = await loader.load();
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
      await db.project.update({
        where: { id: projectId },
        data: { status: "COMPLETED" },
      });
    }),
  );
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const generateEmbeddings = async (docs: Document[]) => {
  const batchSize = 5;
  const delayTime = 10000; // 10 seconds delay between batches

  const result: any[] = [];

  const totalDocs = docs.length;
  const totalBatches = Math.ceil(totalDocs / batchSize);

  // Track time for the first batch to estimate processing time
  let estimatedTimePerDoc = 0;
  let processedBatchCount = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);

    const batchStartTime = Date.now(); // Track start time for the batch

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

    const batchEndTime = Date.now();
    const batchProcessingTime = (batchEndTime - batchStartTime) / 1000; // Convert to seconds

    if (processedBatchCount === 0) {
      // Estimate time per document based on the first batch
      estimatedTimePerDoc = batchProcessingTime / batchSize;
    }

    const remainingBatches = totalBatches - (i / batchSize + 1);
    const estimatedTimeRemaining =
      remainingBatches * (batchSize * estimatedTimePerDoc + delayTime / 1000);

    const estimatedTimeRemainingInMin = Math.floor(estimatedTimeRemaining / 60); // Convert to minutes

    console.log(
      `Batch ${Math.floor(i / batchSize) + 1} processed. Pausing for ${delayTime / 1000} seconds... ` +
        `Total files: ${docs.length}, Files processed: ${result.length}. Estimated time remaining: ${estimatedTimeRemainingInMin} minutes.`,
    );

    if (i + batchSize < docs.length) {
      await delay(delayTime);
    }

    processedBatchCount++;
  }

  return result;
};
