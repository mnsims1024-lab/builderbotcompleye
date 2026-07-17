export type SourceFile = {
  name: string;
  content: string;
};

export type ProjectFile = {
  path: string;
  content: string;
  language?: string;
};

export type Project = {
  id: string;
  name: string;
  summary: string;
  prompt: string;
  files: ProjectFile[];
  createdAt: string;
};

export type ProjectSummary = Omit<Project, "files">;
