"use client";

import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";

const TeamMembers = () => {
  const { projectId } = useProject();
  const { data: members, isPending } = api.project.getTeamMembers.useQuery({
    projectId,
  });

  return (
    <div className="flex items-center gap-2">
      {members?.map((member) => (
        <img
          key={member.id}
          src={member?.user?.imageUrl || ""}
          alt={member?.user?.firstName || ""}
          height={32}
          width={32}
          className="select-none rounded-full"
        />
      ))}
    </div>
  );
};

export default TeamMembers;
