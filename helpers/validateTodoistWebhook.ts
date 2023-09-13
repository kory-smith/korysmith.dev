export async function validateTodoistWebhook(request: Request, todoistSecret: string) {
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
}