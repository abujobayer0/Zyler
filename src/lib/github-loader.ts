import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "@/server/db";
import { cleanGithubUrl } from "./utils";

interface ProcessingConfig {
  BATCH_SIZE: number;
  MAX_RETRIES: number;
  BASE_DELAY: number;
  MAX_DELAY: number;
  TIMEOUT: number;
  JITTER_FACTOR: number;
}

enum ErrorType {
  API_LIMIT = "API_LIMIT",
  TIMEOUT = "TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

interface ProcessingResult {
  summary: string;
  embedding: number[];
  sourceCode: string;
  fileName: string;
}

const PROCESSING_CONFIG: ProcessingConfig = {
  BATCH_SIZE: 3,
  MAX_RETRIES: 10,
  BASE_DELAY: 1000,
  MAX_DELAY: 60000,
  TIMEOUT: 30000,
  JITTER_FACTOR: 0.2,
};

const classifyError = (error: Error): ErrorType => {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
    return ErrorType.API_LIMIT;
  }

  if (errorMessage.includes("timeout") || errorMessage.includes("time out")) {
    return ErrorType.TIMEOUT;
  }

  if (errorMessage.includes("network") || errorMessage.includes("connection")) {
    return ErrorType.NETWORK_ERROR;
  }

  return ErrorType.UNKNOWN;
};

const calculateDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(
    PROCESSING_CONFIG.BASE_DELAY * Math.pow(2, attempt),
    PROCESSING_CONFIG.MAX_DELAY,
  );

  const jitter =
    exponentialDelay * PROCESSING_CONFIG.JITTER_FACTOR * Math.random();
  return exponentialDelay + jitter;
};

const processDocument = async (
  doc: Document,
  projectId: string,
): Promise<ProcessingResult | null> => {
  const processAttempt = async (
    attempt: number = 0,
  ): Promise<ProcessingResult | null> => {
    if (attempt >= PROCESSING_CONFIG.MAX_RETRIES) {
      console.error(
        `Failed to process document after ${PROCESSING_CONFIG.MAX_RETRIES} attempts`,
      );
      return null;
    }

    try {
      const timeoutPromise: Promise<never> = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Processing timeout")),
          PROCESSING_CONFIG.TIMEOUT,
        ),
      );

      const processingPromise = async (): Promise<ProcessingResult> => {
        const summary = await summariseCode(doc);
        const embedding = await generateEmbedding(summary || "");

        if (!summary) {
          throw new Error("Empty summary generated");
        }

        return {
          summary,
          embedding,
          sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
          fileName: doc.metadata.source,
        };
      };

      const result = await Promise.race([processingPromise(), timeoutPromise]);

      return result;
    } catch (error) {
      const typedError =
        error instanceof Error ? error : new Error(String(error));
      const errorType = classifyError(typedError);

      console.warn(`Attempt ${attempt + 1} failed: ${typedError.message}`);

      switch (errorType) {
        case ErrorType.API_LIMIT:
          await new Promise((resolve) =>
            setTimeout(resolve, calculateDelay(attempt) * 2),
          );
          break;
        case ErrorType.TIMEOUT:
        case ErrorType.NETWORK_ERROR:
          await new Promise((resolve) =>
            setTimeout(resolve, calculateDelay(attempt)),
          );
          break;
        default:
          return null;
      }

      return processDocument(doc, projectId);
    }
  };

  return processAttempt();
};

const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
  projectId?: string,
): Promise<Document[]> => {
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

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  await db.projectProcessStatus.create({
    data: {
      projectId,
      status: "PROCESSING",
      message: "Loading documents from GitHub",
    },
  });

  const docs = await loader.load();

  await db.projectProcessStatus.update({
    where: { projectId },
    data: {
      message:
        "Documents successfully loaded! Preparing for summarizing and embedding",
    },
  });

  return docs;
};

export const processGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
  projectId?: string,
): Promise<void> => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const docs = await loadGithubRepo(
    cleanGithubUrl(githubUrl),
    githubToken,
    projectId,
  );

  const processDocumentBatches = async (): Promise<void> => {
    const successfulResults: ProcessingResult[] = [];

    for (let i = 0; i < docs.length; i += PROCESSING_CONFIG.BATCH_SIZE) {
      const batch = docs.slice(i, i + PROCESSING_CONFIG.BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map((doc) => processDocument(doc, projectId)),
      );

      const batchSuccesses = batchResults
        .filter(
          (result): result is PromiseFulfilledResult<ProcessingResult> =>
            result.status === "fulfilled" && result.value !== null,
        )
        .map((result) => result.value);

      successfulResults.push(...batchSuccesses);

      await updateProcessingProgress(
        projectId,
        successfulResults.length,
        docs.length,
      );

      await new Promise((resolve) =>
        setTimeout(resolve, PROCESSING_CONFIG.BASE_DELAY),
      );
    }

    await saveEmbeddings(successfulResults, projectId);
  };

  await processDocumentBatches();
};

const updateProcessingProgress = async (
  projectId: string,
  processedCount: number,
  totalCount: number,
): Promise<void> => {
  const percentComplete = Math.round((processedCount / totalCount) * 100);

  await db.projectProcessStatus.update({
    where: { projectId },
    data: {
      message: `Processing: ${percentComplete}% complete. Processed: ${processedCount}/${totalCount}`,
      status: percentComplete === 100 ? "COMPLETED" : "PROCESSING",
    },
  });
};

const saveEmbeddings = async (
  results: ProcessingResult[],
  projectId: string,
): Promise<void> => {
  if (results.length === 0) {
    console.warn("No successful embeddings to save");
    return;
  }

  const embeddingOperations = results.map(async (embedding) => {
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
      SET "summaryEmbedding" = ${embedding.embedding}::vector
      WHERE "id" = ${sourceCodeEmbeddings.id}
    `;
  });

  await Promise.allSettled(embeddingOperations);

  await db.project.update({
    where: { id: projectId },
    data: { status: "COMPLETED" },
  });

  await db.projectProcessStatus.delete({
    where: { projectId },
  });
};
