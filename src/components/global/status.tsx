import React from "react";
import { AlertDescription, AlertTitle } from "../ui/alert";
import { Alert } from "../ui/alert";
import { FileText } from "lucide-react";
import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";

const Status = () => {
  const { projectId, project } = useProject();
  const { data: projectStatus, isPending: isProjectStatusPending } =
    api.project.getProjectStatus.useQuery(
      { projectId },
      { refetchInterval: 3000, enabled: project?.status !== "COMPLETED" },
    );

  return (
    <div>
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
    </div>
  );
};

export default Status;
