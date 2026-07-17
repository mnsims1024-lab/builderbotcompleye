import type { Config } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { projects } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId")?.trim();
  const projectId = url.searchParams.get("id")?.trim();
  if (!clientId) return Response.json({ error: "Client ID is required." }, { status: 400 });

  try {
    if (projectId) {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.clientId, clientId)))
        .limit(1);
      return project ? Response.json(project) : Response.json({ error: "Project not found." }, { status: 404 });
    }

    const history = await db
      .select({
        id: projects.id,
        name: projects.name,
        summary: projects.summary,
        prompt: projects.prompt,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.clientId, clientId))
      .orderBy(desc(projects.createdAt))
      .limit(20);

    return Response.json(history);
  } catch (error) {
    console.error("Forge history failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Build history is unavailable." }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/projects",
};
