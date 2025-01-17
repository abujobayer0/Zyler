"use client";
import React from "react";
import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import MeetingCard from "../dashboard/meeting-card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";

const Meetings = () => {
  const { project } = useProject();
  const { data: meetings, isPending } = api.project.getMeetings.useQuery(
    {
      projectId: project?.id || "",
    },
    { refetchInterval: 4000 },
  );
  const deleteMeeting = api.project.deleteMeeting.useMutation();
  const refetch = useRefetch();

  return (
    <div>
      <MeetingCard />
      <div className="h-6"></div>
      <h1 className="text-xl font-semibold">Meetings</h1>
      {meetings && meetings.length === 0 && <div>No meetings found!</div>}
      {isPending && <div>Loading...</div>}
      <ul className="divide-y divide-gray-200">
        {meetings?.map((meeting) => (
          <li
            key={meeting.id}
            className="flex items-center justify-between gap-x-6 py-5"
          >
            <div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="text-sm font-semibold"
                  >
                    {meeting.name}
                  </Link>
                  {meeting.status === "PROCESSING" && (
                    <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                      Processing...
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-x-2 text-xs text-gray-500">
                <p className="whitespace-nowrap">
                  {meeting.createdAt.toLocaleDateString("en-US", {
                    weekday: "long",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="truncate">{meeting.Issues.length} Issues</p>
              </div>
            </div>
            <div className="flex flex-none items-center gap-x-4">
              <Link href={`/meetings/${meeting.id}`}>
                <Button size={"sm"} variant={"outline"}>
                  View Meeting
                </Button>
              </Link>
              <Button
                variant={"destructive"}
                size={"sm"}
                disabled={deleteMeeting.isPending}
                onClick={() =>
                  deleteMeeting.mutate(
                    { meetingId: meeting.id },
                    {
                      onSuccess: () => {
                        toast.success("Meeting deleted successfully!");
                        refetch();
                      },
                      onError: () => {
                        toast.error(
                          "Failed to delete meeting. Please try again.",
                        );
                      },
                    },
                  )
                }
              >
                Delete Meeting
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Meetings;
