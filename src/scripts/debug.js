// This is handy to get a look into fetchArticles. Don't forget to remove the ~ in my imports!
import { fetchArticlesWithName } from "./fetchArticles.js";

(async () => {
	await fetchArticlesWithName("Things I use and love");
})()