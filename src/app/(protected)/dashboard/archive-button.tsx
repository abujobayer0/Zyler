"use client";
import { Button } from "@/components/ui/button";
import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";
import { toast } from "sonner";

const ArchiveButton = () => {
  const { projectId } = useProject();
  const archive = api.project.archiveProject.useMutation();
  return (
    <Button
      size={"sm"}
      variant={"destructive"}
      onClick={() => {
        const confirm = window.confirm(
          "Are you sure you want to archive this project",
        );
        if (confirm) {
          archive.mutate(
            { projectId: projectId },
            {
              onSuccess: () => {
                toast.success("Project archived successfully!");
              },
              onError: (error) => {
                toast.error(error.message);
              },
            },
          );
        }
      }}
    >
      Archive
    </Button>
  );
};

export default ArchiveButton;
