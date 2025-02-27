import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface Project {
  id: string;
  name: string;
  description?: string;
  repositoryUrl: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  projects: {
    getAll: async (userId: string): Promise<Project[]> => {
      const response = await axios.get(`${API_URL}/projects/user/${userId}`);
      return response.data;
    },

    getById: async (id: string): Promise<Project> => {
      const response = await axios.get(`${API_URL}/projects/${id}`);
      return response.data;
    },

    create: async (
      data: Omit<Project, "id" | "createdAt" | "updatedAt">,
    ): Promise<Project> => {
      const response = await axios.post(`${API_URL}/projects`, data);
      return response.data;
    },

    update: async (
      id: string,
      data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>,
    ): Promise<Project> => {
      const response = await axios.put(`${API_URL}/projects/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await axios.delete(`${API_URL}/projects/${id}`);
    },
  },
};
