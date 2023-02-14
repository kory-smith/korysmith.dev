export async function onRequestPost({ request, env }) {
  const todoistSecret = env.TODOIST_CLIENT_SECRET;
  console.log("Got request", { request })
  console.log("Do I have Todoist secret?", { todoistSecret })
  if (todoistSecret) {
    const payload = await request.text();
    console.log({ payload })
    const expectedHmac = request.headers.get("x-todoist-hmac-sha256");
    console.log({ expectedHmac })
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
    const digest = String.fromCharCode(...new Uint8Array(hmac));
    if (digest !== expectedHmac) {
      console.log("Signature doesn't match")
      return new Response("Signature mismatch", { status: 401 });
    }
    console.log("Signature matches, triggering build")
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/vnd.github.v3+json");
    myHeaders.append("Authorization", `Bearer ${env.GITHUB_TOKEN}`);
    myHeaders.append("Content-Type", "application/json");

    const body = JSON.stringify({
      event_type: "Automatic trigger from korysmith.dev webhook",
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body,
    };
    const response = await fetch(
      "https://api.github.com/repos/kory-smith/peat/dispatches",
      requestOptions
    );
    if (response.status === 204) {
      return new Response("succeeded", { status: 200 });
    } else return new Response(response.statusText, { status: response.status })
  } else {
    return new Response("Todoist secret not set", { status: 500 });
  }
}
