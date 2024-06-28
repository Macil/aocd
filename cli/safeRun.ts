import { Server } from "@std/http/server";
import { basicAuth } from "https://deno.land/x/basic_auth@v1.1.1/mod.ts";
import type { DefaultAocdSource } from "../DefaultAocdSource.ts";

export interface SafeRunOptions {
  scriptArg: string;
  denoFlags?: string[];
  submit?: boolean;
  time?: boolean;
}

export async function safeRun(
  defaultAocdSource: DefaultAocdSource,
  options: SafeRunOptions,
): Promise<Deno.CommandStatus> {
  const abortController = new AbortController();

  const password = crypto.randomUUID();

  const server = new Server({
    port: 0,
    hostname: "localhost",
    async handler(request, _connInfo) {
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
        const input = await defaultAocdSource.getInput(year, day);
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
          typeof part !== "number" ||
          !["number", "string"].includes(typeof solution)
        ) {
          return new Response("Invalid body", { status: 400 });
        }
        const correct = await defaultAocdSource.submit(
          year,
          day,
          part,
          solution,
        );
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
    },
  });
  abortController.signal.addEventListener("abort", () => {
    server.close();
  }, { once: true });
  try {
    const serverPromise = server.listenAndServe();
    const addr = server.addrs[0];
    if (addr.transport !== "tcp") {
      throw new Error("Should not happen: wrong transport mode");
    }

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

      const command = new Deno.Command("deno", {
        args: [
          "run",
          ...denoFlags,
          options.scriptArg,
          `--aocd-api-addr=${apiAddr}`,
          ...(options.submit ? ["--submit"] : []),
          ...(options.time ? ["--time"] : []),
        ],
        signal: abortController.signal,
      });
      const child = command.spawn();
      const status = await child.status;
      abortController.abort();
      return status;
    };

    const [, status] = await Promise.all([serverPromise, runScript()]);
    return status;
  } finally {
    abortController.abort();
  }
}
