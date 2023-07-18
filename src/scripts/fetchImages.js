import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const NOTION_SECRET = "secret_JCzfvkeA0KeTb6nCGSmtZ90Ura8OcVWsFiOyNCqdGFE"
const ARTICLES_DATABASE_ID = 'bf7e16c44b7b46a6ac4d11d5d4db77d8';

async function fetchAndWriteImage(url, id) {
  const response = await fetch(url);
  const buffer = await response.buffer();
	const sourcePath = path.resolve(process.cwd(), 'public', `${id}.png`);

  fs.writeFileSync(path.resolve(process.cwd(), 'public', `${id}.png`), buffer);

	const avifPromise = sharp(sourcePath).avif({quality: 10}).toFile(path.resolve(process.cwd(), 'public', `${id}.avif`))
	const webpPromise = sharp(sourcePath).webp({quality: 10}).toFile(path.resolve(process.cwd(), 'public', `${id}.webp`))
	const jpegPromise = sharp(sourcePath).jpeg({quality: 10}).toFile(path.resolve(process.cwd(), 'public', `${id}.jpeg`))

	return await Promise.all([avifPromise, webpPromise, jpegPromise]);
}

async function fetchImages() {
  const response = await fetch(`https://api.notion.com/v1/databases/${ARTICLES_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_SECRET}`,
      'Notion-Version': '2021-05-13',
    },
  }).then((res) => res.json());

  const articles = response.results.map(async (article) => {
    const childBlocks = await fetch(`https://api.notion.com/v1/blocks/${article.id}/children?page_size=800`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${NOTION_SECRET}`,
        'Notion-Version': '2022-02-22',
      },
    }).then((res) => res.json());

    for (let i = 0; i < childBlocks.results.length; i++) {
      const result = childBlocks.results[i];
      if (result.type === "image") {
        await fetchAndWriteImage(result.image.file.url, result.id);
      }
    }
  });

  await Promise.all(articles);
}

fetchImages().catch(console.error);
