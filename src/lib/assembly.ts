import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_AI_API_KEY!,
});

const msToTime = (ms: number) => {
  const seconds = ms / 1000;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const processMeeting = async (audioUrl: string) => {
  const params = {
    audio: audioUrl,
    auto_chapters: true,
  };

  const transcript = await client.transcripts.transcribe(params);

  const summaries =
    transcript.chapters?.map((chapter) => ({
      start: msToTime(chapter.start),
      end: msToTime(chapter.end),
      gist: chapter.gist,
      headline: chapter.headline,
      summary: chapter.summary,
    })) || [];
  if (!transcript.text) throw new Error("Missing transcript");
  return { summaries };
};
