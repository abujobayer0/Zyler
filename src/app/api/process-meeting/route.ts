import { processMeeting } from "@/lib/assembly";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodyParser = z.object({
  meetingUrl: z.string(),
  meetingId: z.string(),
});
export const maxDuration = 300;

export const POST = async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { meetingId, meetingUrl } = bodyParser.parse(body);
    const { summaries } = await processMeeting(meetingUrl);
    await db.issue.createMany({
      data: summaries.map((summary) => ({
        start: summary.start,
        end: summary.end,
        summary: summary.summary,
        gist: summary.gist,
        headline: summary.headline,
        meetingId,
      })),
    });

    await db.meeting.update({
      where: { id: meetingId },
      data: { status: "COMPLETED", name: summaries[0]!.headline },
    });

    return NextResponse.json(
      { message: "Meeting summaries processed" },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
};
