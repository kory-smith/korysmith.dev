export function slugify(text: string) {
  return text
		.trim()
    .toLowerCase() // convert to lower case
    .replace(/['"]/g, "") // remove quotes
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/[^a-z0-9-]/g, ""); // remove non-alphanumeric characters except -
}
