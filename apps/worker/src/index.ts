export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        env: env.ENVIRONMENT,
        time: new Date().toISOString(),
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
