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
			"x-todoist-hmac-sha256"
		);
		if (process.env.TODOIST_CLIENT_SECRET) {
			const generatedSignature = crypto
				.createHmac("sha256", process.env.TODOIST_CLIENT_SECRET)
				.update(JSON.stringify(payload))
				.digest("base64");
			if (signature !== generatedSignature) {
				return json({ message: "Signature mismatch" }, 401);
			}
			// Do webhook stuff here
			return json({success: true}, 200)
		}
}