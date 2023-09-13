import { validateTodoistWebhook } from "../../helpers/validateTodoistWebhook";

export const prerender = false;

export async function onRequestPost({ request, env }) {
  const todoistSecret = env.TODOIST_AUTO_LABEL_SECRET;
  const openAIAPIKey = env.OPENAI_API_KEY;
  if (todoistSecret && openAIAPIKey) {

    await validateTodoistWebhook(request, todoistSecret);

		const taskId = request.body.event_data.id;
		const taskContent = request.body.event_data.content;

    const messageToGPT = `I use Todoist for task mgmt. When I add a new task, you will analyze the task and return an array of applicable labels from the list below (or null if none apply).
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

		Task: "${taskContent}"`;

    const AIResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${openAIAPIKey}`,
          "Content-Type": "application/json",
          "User-Agent": "korysmith.dev",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: messageToGPT }],
        }),
      }
    );

    const responseText = await AIResponse.json() as any

    const labels = JSON.parse(responseText).choices[0].message.content.labels;

    if (labels === null) {
      return;
    }

    const todoistUpdateResponse = await fetch(
      `https://api.todoist.com/rest/v2/tasks/${taskId}`,
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
		const todistSecretIsMissing = todoistSecret ? "" : "Todoist secret not set";
		const openAIKeyIsMissing = openAIAPIKey ? "" : "OpenAI key not set";
		const combined = todistSecretIsMissing + openAIKeyIsMissing;
    return new Response(combined, { status: 500 });
  }
}
