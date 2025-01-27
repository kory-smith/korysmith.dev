import type { ENV } from "~/src/env";

export const prerender = false;

export async function POST({
  request,
  locals,
}: {
  request: Request;
  locals: {
    runtime: {
      env: ENV;
    };
  };
}) {
  const todoistSecret = locals.runtime.env.TODOIST_CLIENT_SECRET;
  if (todoistSecret) {
    const payload = await request.text();

    const expectedHmac = request.headers.get("x-todoist-hmac-sha256");
    const generatedHmac = await generateTodoistHmac({ payload, todoistSecret });
    if (generatedHmac !== expectedHmac) {
      return new Response("Signature mismatch", { status: 401 });
    }

    const peatDispatch = await fetch(
      "https://api.github.com/repos/kory-smith/peat/dispatches",
      {
        method: "POST",
        headers: new Headers({
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${locals.runtime.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "korysmith.dev",
        }),
        body: JSON.stringify({
          event_type: "Automatic trigger from korysmith.dev webhook",
        }),
      }
    );
    if (peatDispatch.status === 204) {
      return new Response("succeeded", { status: 200 });
    } else
      return new Response(peatDispatch.statusText, {
        status: peatDispatch.status,
      });
  } else {
    return new Response("Todoist secret not set", { status: 500 });
  }
}

async function generateTodoistHmac({
  payload,
  todoistSecret,
}: {
  payload: string;
  todoistSecret: string;
}) {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(todoistSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const hmac = await crypto.subtle.sign("HMAC", key, data);
  return btoa(String.fromCharCode(...new Uint8Array(hmac)));
}
