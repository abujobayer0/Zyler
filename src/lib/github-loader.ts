import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "@/server/db";
import { cleanGithubUrl } from "./utils";

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
  projectId?: string,
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
  await db.projectProcessStatus.create({
    data: {
      projectId: projectId!,
      status: "PROCESSING",
      message: "Loading documents from GitHub",
    },
  });
  const docs = await loader.load();
  await db.projectProcessStatus.update({
    where: { projectId: projectId },
    data: {
      message:
        "Documents successfully loaded! Preparing for summarizing and embedding ",
    },
  });

  return docs;
};

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(
    cleanGithubUrl(githubUrl),
    githubToken,
    projectId,
  );
  const allEmbeddings = await generateEmbeddings(docs, projectId);
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

      await db.projectProcessStatus.delete({
        where: { projectId: projectId },
      });
    }),
  );
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const generateEmbeddings = async (docs: Document[], projectId: string) => {
  const batchSize = 3;
  const delayTime = 10000;
  const maxRetries = 3;
  const result: any[] = [];

  const totalDocs = docs.length;
  const totalBatches = Math.ceil(totalDocs / batchSize);

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    let retryCount = 0;
    let batchSuccess = false;

    while (!batchSuccess && retryCount < maxRetries) {
      try {
        const batchStartTime = Date.now();

        const batchPromises = batch.map(async (doc) => {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Operation timed out")), 15000),
          );

          const processingPromise = (async () => {
            const summary = await summariseCode(doc);
            const embedding = await generateEmbedding(summary || "");
            return {
              summary,
              embedding,
              sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
              fileName: doc.metadata.source,
            };
          })();

          return Promise.race([processingPromise, timeoutPromise]);
        });

        const batchResults = await Promise.allSettled(batchPromises);

        const successfulResults = batchResults
          .filter(
            (r): r is PromiseFulfilledResult<any> => r.status === "fulfilled",
          )
          .map((r) => r.value);

        result.push(...successfulResults);

        await updateProgress(
          projectId,
          i,
          batchSize,
          totalBatches,
          totalDocs,
          result.length,
        );

        const processingTime = Date.now() - batchStartTime;
        const adaptiveDelay = Math.max(delayTime - processingTime, 5000);
        await delay(adaptiveDelay);

        batchSuccess = true;
      } catch (error) {
        retryCount++;
        console.error(
          `Batch ${Math.floor(i / batchSize) + 1} failed. Attempt ${retryCount}/${maxRetries}`,
        );

        if (retryCount === maxRetries) {
          await handleBatchFailure(projectId, error);
          continue;
        }

        await delay(Math.min(1000 * Math.pow(2, retryCount), 30000));
      }
    }
  }

  return result;
};

const updateProgress = async (
  projectId: string,
  currentIndex: number,
  batchSize: number,
  totalBatches: number,
  totalFiles: number,
  processedFiles: number,
) => {
  const currentBatch = Math.floor(currentIndex / batchSize) + 1;
  const percentComplete = Math.round((processedFiles / totalFiles) * 100);

  if (percentComplete === 100) {
    await db.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED" },
    });
  }

  await db.projectProcessStatus.update({
    where: { projectId },
    data: {
      message:
        `Processing: ${percentComplete}% complete. Batch ${currentBatch}/${totalBatches}. ` +
        `Files processed: ${processedFiles}/${totalFiles}`,
      status: percentComplete === 100 ? "COMPLETED" : "PROCESSING",
    },
  });
};

const handleBatchFailure = async (projectId: string, error: any) => {
  await db.projectProcessStatus.update({
    where: { projectId },
    data: {
      message: `Warning: Some files may have failed to process. Error: ${error.message}`,
    },
  });
};
