import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const NOTION_SECRET = "secret_JCzfvkeA0KeTb6nCGSmtZ90Ura8OcVWsFiOyNCqdGFE"
const ARTICLES_DATABASE_ID = 'bf7e16c44b7b46a6ac4d11d5d4db77d8';

async function fetchAndWriteImage(url, id) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFile(path.resolve(process.cwd(), 'public', `${id}.png`), buffer, (err) => {
    console.log({err})
  })
  return `/${id}.png`;
}

function convertToSlug(string) {
  const slug = string.trim().replace(/[^\w\s-]/g, "").replace(/ /g, "-").toLowerCase();
  return slug;
}

async function handleImage(result) {
  const localImagePath = await fetchAndWriteImage(result.image.file.url, result.id);
  return `<img src="${localImagePath}" alt="Image" />`;
}

async function notionBlocksToHtml(page) {
  const { results } = page;
  let html = "";
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.type === "image") {
      html += await handleImage(result);
    } else {
      html += "<p>Block type not supported.</p>";
    }
  }
  return html;
}

export async function fetchArticles() {
  const response = await fetch(`https://api.notion.com/v1/databases/${ARTICLES_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_SECRET}`,
      'Notion-Version': '2021-05-13',
    },
  }).then((res) => res.json());

  const articles = response.results.map(async (article) => {
    const childBlocks = await fetch(`https://api.notion.com/v1/blocks/${article.id}/children?page_size=100`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${NOTION_SECRET}`,
        'Notion-Version': '2022-02-22',
      },
    }).then((res) => res.json());

    const content = await notionBlocksToHtml(childBlocks);
    return {
      id: article.id,
      title: article.properties.Name.title[0].plain_text,
      slug: convertToSlug(article.properties.Name.title[0].plain_text),
      content: content,
    };
  });

  return await Promise.all(articles);
}

export async function getStaticPaths() {
  const articles = await fetchArticles();
  const paths = articles.map((article) => ({ params: { slug: article.slug } }));
  return paths;
}
