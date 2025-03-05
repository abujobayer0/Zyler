import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummariseCommit } from "./gemini";
import { cleanGithubUrl } from "./utils";
import redis from "./redis";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type Response = {
  commitMessage: string;
  commitHash: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

// Advanced retry configuration
const RETRY_CONFIG = {
  BASE_DELAY: 1000, // Initial delay between retries
  MAX_DELAY: 30000, // Maximum delay between retries
  MAX_ATTEMPTS: 10, // Maximum number of retry attempts
  TIMEOUT: 15000, // Request timeout
  JITTER_FACTOR: 0.2, // Random jitter to prevent thundering herd
};

const calculateDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(
    RETRY_CONFIG.BASE_DELAY * Math.pow(2, attempt),
    RETRY_CONFIG.MAX_DELAY,
  );

  const jitter = exponentialDelay * RETRY_CONFIG.JITTER_FACTOR * Math.random();
  return exponentialDelay + jitter;
};

export const summariseCommitsWithRetry = async (
  githubUrl: string,
  commitHash: string,
): Promise<string> => {
  const cachedSummary = await redis.get(commitHash);
  if (cachedSummary) {
    console.log(`Cache hit for commit: ${commitHash}`);
    return cachedSummary;
  }

  const url = `${githubUrl}/commit/${commitHash}.diff`;

  const attemptSummarization = async (attempt: number = 0): Promise<string> => {
    if (attempt >= RETRY_CONFIG.MAX_ATTEMPTS) {
      console.error(
        `Failed to summarize commit ${commitHash} after ${RETRY_CONFIG.MAX_ATTEMPTS} attempts.`,
      );
      return "";
    }

    try {
      const response = await axios.get(url, {
        headers: { Accept: "application/vnd.github.v3.diff" },
        timeout: RETRY_CONFIG.TIMEOUT,
      });

      const summary = await aiSummariseCommit(response.data);

      if (summary && summary.trim() !== "") {
        await redis.set(commitHash, summary, "EX", 3600); // Cache for 1 hour
        return summary;
      }

      throw new Error("Empty summary received");
    } catch (error: any) {
      console.warn(`Attempt ${attempt + 1} failed: ${error.message}`);

      const shouldRetry =
        error.code === "ECONNABORTED" || // Timeout
        error.response?.status >= 500 || // Server errors
        error.message === "Empty summary received";

      if (shouldRetry) {
        const delay = calculateDelay(attempt);

        await new Promise((resolve) => setTimeout(resolve, delay));

        return attemptSummarization(attempt + 1);
      }

      return "";
    }
  };

  return attemptSummarization();
};

export const getCommitHashes = async (
  githubUrl: string,
): Promise<Response[]> => {
  const [owner, repo] = cleanGithubUrl(githubUrl).split("/").slice(-2);
  if (!owner || !repo) throw new Error("Invalid owner or repo");

  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  const sortedCommits = data.sort(
    (a: any, b: any) =>
      new Date(b.commit.author.date).getTime() -
      new Date(a.commit.author.date).getTime(),
  ) as any;

  return sortedCommits.slice(0, 10).map((commit: any) => ({
    commitMessage: commit.commit.message ?? "",
    commitHash: commit.sha as string,
    commitAuthorName: commit?.commit?.author?.name ?? "",
    commitAuthorAvatar: commit?.author?.avatar_url ?? "",
    commitDate: commit?.commit?.author?.date ?? "",
  }));
};

export const pollCommits = async (projectId: string) => {
  const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
  const commitHashes = await getCommitHashes(githubUrl);
  const unprocessedCommits = await filterUnprocessedCommits(
    projectId,
    commitHashes,
  );

  const summaries = await Promise.all(
    unprocessedCommits.map(
      async (commit) =>
        await summariseCommitsWithRetry(
          cleanGithubUrl(githubUrl),
          commit.commitHash,
        ),
    ),
  );

  const commits = db.commit.createMany({
    data: unprocessedCommits.map((commit, index) => ({
      commitHash: commit.commitHash,
      commitMessage: commit.commitMessage,
      projectId: projectId,
      commitAuthorName: commit.commitAuthorName,
      commitAuthorAvatar: commit.commitAuthorAvatar,
      commitDate: commit.commitDate,
      summery: summaries[index] || "",
    })),
  });

  return commits;
};

const fetchProjectGithubUrl = async (projectId: string) => {
  if (!projectId) return { project: null, githubUrl: "" };
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubUrl: true,
    },
  });

  return { project: project, githubUrl: project!.githubUrl };
};

const filterUnprocessedCommits = async (
  projectId: string,
  commitHashes: Response[],
) => {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
    orderBy: {
      createdAt: "desc",
    },
  });

  return commitHashes.filter(
    (commit) =>
      !processedCommits.some(
        (processedCommit) => processedCommit.commitHash === commit.commitHash,
      ),
  );
};
