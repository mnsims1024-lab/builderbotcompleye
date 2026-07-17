import JSZip from "jszip";
import type { Project, ProjectFile } from "./types";

export const getClientId = () => {
  const key = "forge-client-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  localStorage.setItem(key, value);
  return value;
};

export const projectPreview = (files: ProjectFile[]) => {
  const html = files.find((file) => file.path === "index.html")?.content || "";
  const styles = files
    .filter((file) => file.path.endsWith(".css"))
    .map((file) => file.content)
    .join("\n");
  const scripts = files
    .filter((file) => file.path.endsWith(".js"))
    .map((file) => file.content)
    .join("\n")
    .replace(/<\/script/gi, "<\\/script");

  const withoutLinks = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, "");
  const withoutScripts = withoutLinks.replace(/<script[^>]+src=["'][^"']+["'][^>]*><\/script>/gi, "");
  const additions = `<style>${styles}</style><script>${scripts}<\/script>`;
  return withoutScripts.includes("</body>")
    ? withoutScripts.replace("</body>", `${additions}</body>`)
    : `${withoutScripts}${additions}`;
};

export const downloadProject = async (project: Project) => {
  const zip = new JSZip();
  project.files.forEach((file) => zip.file(file.path, file.content));
  zip.file(
    "README.md",
    `# ${project.name}\n\n${project.summary}\n\nGenerated with Forge Open Builder Bot. Open \`index.html\` to run the project.\n`,
  );
  const blob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "forge-project"}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const readSourceFiles = async (list: FileList | File[]) => {
  const accepted = Array.from(list).slice(0, 12);
  const maxSize = 750_000;
  const files = await Promise.all(
    accepted.map(async (file) => {
      if (file.size > maxSize) throw new Error(`${file.name} is larger than 750 KB.`);
      return { name: file.name, content: await file.text() };
    }),
  );
  return files;
};
