import { LoaderFunction } from '@remix-run/server-runtime'
import { json } from '@remix-run/server-runtime'

export const loader: LoaderFunction = async ({ request }) => {
  console.log({ request })
	return json({name: "kory"})
}

export const action: ActionFunction = async ({request}) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }
  const payload = await request.json();

	  /* Validate the webhook */
		const signature = request.headers.get(
			"X-Hub-Signature-256"
		);
		if (process.env.GITHUB_WEBHOOK_SECRET) {
			const generatedSignature = `sha256=${crypto
				.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
				.update(JSON.stringify(payload))
				.digest("hex")}`;
			if (signature !== generatedSignature) {
				return json({ message: "Signature mismatch" }, 401);
			}
			// Do webhook stuff here
			return json({success: true}, 200)
		}
}