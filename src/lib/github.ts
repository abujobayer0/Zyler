import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummariseCommit } from "./gemini";
import { cleanGithubUrl } from "./utils";

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
  const summerisesResponse = await Promise.allSettled(
    unprocessedCommits.map(async (commit) => {
      return await summariseCommits(
        cleanGithubUrl(githubUrl),
        commit.commitHash,
      );
    }),
  );

  const summerises = summerisesResponse.map((res) => {
    if (res.status === "fulfilled") {
      return res.value;
    } else {
      return "";
    }
  });

  const commits = db.commit.createMany({
    data: summerises.map((summery, index) => {
      return {
        commitHash: unprocessedCommits[index]!.commitHash,
        commitMessage: unprocessedCommits[index]!.commitMessage,
        projectId: projectId,
        commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
        commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
        commitDate: unprocessedCommits[index]!.commitDate,
        summery,
      };
    }),
  });
  return commits;
};

export const summariseCommits = async (
  githubUrl: string,
  commitHash: string,
  maxRetries: number = 5,
  delay: number = 3000,
): Promise<string> => {
  const url = `${githubUrl}/commit/${commitHash}.diff`;

  let retries = 0;

  while (retries < maxRetries) {
    try {
      const { data } = await axios.get(url, {
        headers: { Accept: "application/vnd.github.v3.diff" },
      });

      // Pass the data to the AI summarization function
      const summary = await aiSummariseCommit(data);

      if (summary) {
        return summary;
      }

      console.warn(`Empty summary on attempt ${retries + 1}, retrying...`);
    } catch (error: any) {
      console.error(`Error on attempt ${retries + 1}:`, error.message);
    }

    retries += 1;
    if (retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  console.error(`Failed to summarize commits after ${maxRetries} attempts.`);
  return "";
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

  const unprocessedCommits = commitHashes.filter(
    (commit) =>
      !processedCommits.some(
        (processedCommit) => processedCommit.commitHash === commit.commitHash,
      ),
  );
  return unprocessedCommits;
};
