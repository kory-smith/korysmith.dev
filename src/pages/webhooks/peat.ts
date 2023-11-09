export const prerender = false;

export async function POST({ request, locals}: { request: Request }) {
  const todoistSecret = locals.env.TODOIST_CLIENT_SECRET;
  console.log(`Do I have the todoist secret? ${todoistSecret != null ? "yes" : "no"}`)
  if (todoistSecret) {
    const payload = await request.text();
    const expectedHmac = request.headers.get("x-todoist-hmac-sha256");

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
    const generatedHmac = btoa(String.fromCharCode(...new Uint8Array(hmac)));
    if (generatedHmac !== expectedHmac) {
      return new Response("Signature mismatch", { status: 401 });
    }
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/vnd.github.v3+json");
    myHeaders.append("Authorization", `Bearer ${locals.env.GITHUB_TOKEN}`);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("User-Agent", "korysmith.dev");
    const body = JSON.stringify({
      event_type: "Automatic trigger from korysmith.dev webhook",
    });
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body,
    };
    const peatDispatch = await fetch(
      "https://api.github.com/repos/kory-smith/peat/dispatches",
      requestOptions
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