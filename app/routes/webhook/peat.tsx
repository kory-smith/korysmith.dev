import { LoaderFunction } from '@remix-run/server-runtime'
import { json } from '@remix-run/server-runtime'

export const loader: LoaderFunction = async ({ request }) => {
  console.log({ request })
	return json({name: "kory"})
}
