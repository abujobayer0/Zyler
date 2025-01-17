"use client";
import { api } from "@/trpc/react";
import React from "react";

type Props = {
  meetingId: string;
};

const IssuesList = ({ meetingId }: Props) => {
  const { data: meeting, isLoading } = api.project.getMeetingById.useQuery(
    {
      meetingId,
    },
    { refetchInterval: 4000 },
  );
  return <div>IssuesList</div>;
};

export default IssuesList;
