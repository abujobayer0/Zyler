"use client";

import useProject from "@/hooks/use-project";
import { ExternalLink, FileText, Github, Terminal, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { CommitLog } from "./commit-log";
import AskQuestionCard from "./ask-question-card";
import MeetingCard from "./meeting-card";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import ArchiveButton from "./archive-button";
const InviteButton = dynamic(() => import("./invite-button"), { ssr: false });
import TeamMembers from "./team-members";
import dynamic from "next/dynamic";
import useRefetch from "@/hooks/use-refetch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const { projectId, project } = useProject();
  const router = useRouter();
  const deleteProject = api.project.projectDelete.useMutation();
  const { data: projectStatus, isPending: isProjectStatusPending } =
    api.project.getProjectStatus.useQuery(
      { projectId },
      { refetchInterval: 3000, enabled: project?.status !== "COMPLETED" },
    );

  const refetch = useRefetch();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        <div className="w-fit rounded-md bg-primary px-4 py-3">
          {/* Github Link */}
          <div className="flex items-center">
            <Github className="size-5 text-white" />
            <div className="ml-2">
              <p className="text-sm font-medium text-white">
                This project is linked to{" "}
                <Link
                  href={project?.githubUrl ?? ""}
                  className="inline-flex items-center text-white/80 hover:underline"
                >
                  {project?.githubUrl}
                  <ExternalLink className="ml-1 size-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="h-4"></div>
        <div className="flex items-center gap-4">
          <TeamMembers /> <InviteButton /> <ArchiveButton />
          <Button
            variant={"destructive"}
            size={"sm"}
            disabled={deleteProject.isPending}
            onClick={async () => {
              deleteProject.mutate({ projectId: projectId });
              router.push("/dashboard");
              await refetch();
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {project?.status === "PROCESSING" && (
        <>
          <div className="h-4"></div>

          <Alert className="rounded-md border-l-4 border-blue-500 bg-blue-100 p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <FileText className="h-6 w-6 text-blue-500" />
              <div>
                <AlertTitle className="text-lg font-semibold text-blue-800">
                  Project Processing
                </AlertTitle>

                <AlertDescription className="text-sm text-blue-700">
                  <span className="">
                    {project.status === "PROCESSING" && !projectStatus
                      ? "Project is currently processing. Please wait..."
                      : !isProjectStatusPending &&
                        projectStatus &&
                        projectStatus.message}
                    .
                  </span>{" "}
                  We will send you a notification immediately after the project
                  has been processed.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </>
      )}
      <div className="h-4"></div>
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <AskQuestionCard /> <MeetingCard />
        </div>
      </div>
      <div className="mt-8"></div>
      <CommitLog />
    </div>
  );
};

export default DashboardPage;
