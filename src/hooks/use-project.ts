import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";

const useProject = () => {
  const { data: projects, isPending } = api.project.getProjects.useQuery();
  const [projectId, setProjectId] = useLocalStorage("zyler-projectId", "");
  const project = projects?.find((project) => project.id === projectId);

  return {
    projects,
    projectId,
    setProjectId,
    project,
    loading: isPending,
  };
};

export default useProject;
