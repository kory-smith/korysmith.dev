import { validateTodoistWebhook } from "../../helpers/validateTodoistWebhook";

export const prerender = false;

export async function onRequestPost({ request, env }) {
  const todoistSecret = env.TODOIST_CLIENT_SECRET;
  const openAISecret: string | null = env.OPENAI_API_KEY;
  if (todoistSecret) {

    await validateTodoistWebhook(request, todoistSecret);

    const messageToGPT = `Using Todoist for task mgmt. When I add a new task, a webhook triggers AI to analyze the task and return an array of applicable labels from the list below (or null if none apply). I use the GTD method.
		Create_project: Start a new project
		Waiting_for: Awaiting someone else
		Sydney: Involves Sydney
		Sierra: Involves Sierra
		Jeff/Lynn: Involves Jeff or Lynn
		Mom: Involves Mom
		Papa: Involves Grandpa
		Grandma: Involves Grandma
		Anywhere: Can be done anywhere
		Out: Requires going out
		Home: Home-only task
		Phone_call: Needs a call
		Standup: Mention at standup
		
		Task text is "${request.body.event_data.content}"
		`;

    const AIResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${openAISecret}`,
          "Content-Type": "application/json",
          "User-Agent": "korysmith.dev",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: messageToGPT }],
        }),
      }
    );

    const responseText = await AIResponse.json();

    const labels = JSON.parse(responseText).choices[0].message.content.labels;

    if (labels === null) {
      return;
    }

    const todoistUpdateResponse = await fetch(
      `https://api.todoist.com/rest/v2/tasks/${request.body.event_data.id}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${todoistSecret}`,
          "Content-Type": "application/json",
          "User-Agent": "korysmith.dev",
        },
        body: JSON.stringify({
          labels,
        }),
      }
    );

		// Todo: do something with the response
  } else {
    return new Response("Todoist secret not set", { status: 500 });
  }
}
