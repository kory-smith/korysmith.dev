import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime'
import crypto from "crypto"
import { json } from '@remix-run/server-runtime'

export const loader: LoaderFunction = async ({ request }) => {
  console.log({ request })
	return json({name: "kory"})
}

// mostly taken from https://remix.run/docs/en/v1/guides/resource-routes#webhooks
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

				const myHeaders = new Headers()
        myHeaders.append('Accept', 'application/vnd.github.v3+json')
        myHeaders.append(
          'Authorization',
          `Bearer ${process.env.GITHUB_TOKEN}`,
        )
        myHeaders.append('Content-Type', 'application/json')

        const body = JSON.stringify({
          event_type: 'Automatic trigger from korysmith.dev webhook',
        })

        const requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body
        }

       const response = await fetch(
          'https://api.github.com/repos/kory-smith/peat/dispatches',
          requestOptions,
        )
				if (response.status === 204) {
					return json({success: true}, 200)
				} else return json({success: false}, 401)
		}
}