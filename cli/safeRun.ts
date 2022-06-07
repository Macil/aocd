import { getAocd } from "../mod.ts";
import { basicAuth } from "https://deno.land/x/basic_auth@v1.0.2/mod.ts";
import once from "https://deno.land/x/once@0.3.0/index.ts";

export interface SafeRunOptions {
  scriptArg: string;
  denoFlags?: string[];
  submit?: boolean;
}

export async function safeRun(
  options: SafeRunOptions,
): Promise<Deno.ProcessStatus> {
  const apiServer = Deno.listen({ port: 0, hostname: "localhost" });
  if (apiServer.addr.transport !== "tcp") {
    throw new Error("Should not happen: wrong transport mode");
  }
  const apiServerClose = once(() => apiServer.close());
  try {
    const { addr } = apiServer;

    const password = crypto.randomUUID();

    const runServer = async () => {
      async function respond(request: Request): Promise<Response> {
        try {
          const errResponse = basicAuth(request, "sandbox", {
            sandbox: password,
          });
          if (errResponse) {
            return errResponse;
          }
          const url = new URL(request.url);
          if (url.pathname === "/getInput") {
            const year = Number(url.searchParams.get("year"));
            const day = Number(url.searchParams.get("day"));
            const input = await getAocd().getInput(year, day);
            return new Response(input, {
              headers: {
                "Content-Type": "text/plain",
              },
              status: 200,
            });
          } else if (url.pathname === "/submit") {
            if (!options.submit) {
              return new Response("Forbidden", { status: 403 });
            }
            const body = await request.json();
            const { year, day, part, solution } = body;
            if (
              typeof year !== "number" || typeof day !== "number" ||
              typeof part !== "number" || typeof solution !== "number"
            ) {
              return new Response("Invalid body", { status: 400 });
            }
            const correct = await getAocd().submit(year, day, part, solution);
            const responseBody = { correct };
            return new Response(JSON.stringify(responseBody), {
              headers: {
                "Content-Type": "application/json",
              },
              status: 200,
            });
          } else {
            return new Response("Not found", { status: 404 });
          }
        } catch (err) {
          console.error("Error while serving request", err);
          return new Response("Internal Server Error", { status: 500 });
        }
      }

      async function serveHttp(conn: Deno.Conn) {
        // This "upgrades" a network connection into an HTTP connection.
        const httpConn = Deno.serveHttp(conn);
        // Each request sent over the HTTP connection will be yielded as an async
        // iterator from the HTTP connection.
        for await (const requestEvent of httpConn) {
          requestEvent.respondWith(respond(requestEvent.request));
        }
      }

      for await (const conn of apiServer) {
        serveHttp(conn);
      }
    };

    const runScript = async () => {
      const apiDomain = `localhost:${addr.port}`;
      const apiAddr = `http://sandbox:${password}@${apiDomain}`;
      const denoFlags = options.denoFlags?.slice() || [];

      let addAllowNetFlag = true;
      for (let i = 0; i < denoFlags.length; i++) {
        if (denoFlags[i] === "--allow-net") {
          addAllowNetFlag = false;
          break;
        }
        if (denoFlags[i].startsWith("--allow-net=")) {
          denoFlags[i] = denoFlags[i].replace(
            "--allow-net=",
            `--allow-net=${apiDomain},`,
          );
          addAllowNetFlag = false;
          break;
        }
      }
      if (addAllowNetFlag) {
        denoFlags.push(`--allow-net=${apiDomain}`);
      }

      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          ...denoFlags,
          options.scriptArg,
          `--aocd-api-addr=${apiAddr}`,
          ...(options.submit ? ["--submit"] : []),
        ],
      });
      const status = await p.status();
      apiServerClose();
      return status;
    };

    const [, status] = await Promise.all([runServer(), runScript()]);
    return status;
  } finally {
    apiServerClose();
  }
}
