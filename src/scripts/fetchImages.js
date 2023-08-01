import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const NOTION_SECRET = process.env['PUBLIC_NOTION_SECRET']
const ARTICLES_DATABASE_ID = 'bf7e16c44b7b46a6ac4d11d5d4db77d8';

async function logImageMetadata(imageBuffer, id) {
	const FILE_NAME = "imageData.json";
	const FILE_PATH = path.resolve('public/images', FILE_NAME);
	const imageDataAlreadyExists = fs.existsSync(FILE_PATH);

	if (!imageDataAlreadyExists) {
		fs.writeFileSync(FILE_PATH, JSON.stringify({}));
	}
		const existingImageData = JSON.parse(fs.readFileSync(FILE_PATH));
		const newImageData = await sharp(imageBuffer).metadata();
		const massagedImageData = {
			format: newImageData.format,
			size: newImageData.size,
			width: newImageData.width,
			height: newImageData.height,
			aspectRatio: newImageData.width / newImageData.height,
		}
		if (existingImageData[id]) {
			return;
		}
		existingImageData[id] = massagedImageData;
		fs.writeFileSync(FILE_PATH, JSON.stringify(existingImageData));
}

async function fetchAndWriteImage(url, id) {
	const imagesDirectoryExists = fs.existsSync(path.resolve(process.cwd(), 'public/images'));
	if (!imagesDirectoryExists) {
		fs.mkdirSync(path.resolve(process.cwd(), 'public/images'));
	}
  const response = await fetch(url);
  const buffer = await response.buffer();
	const SOURCE_PATH = path.resolve(process.cwd(), 'public/images', `${id}.png`);

  fs.writeFileSync(SOURCE_PATH, buffer);

	await	logImageMetadata(buffer, id)

	const avifPromise = sharp(SOURCE_PATH).avif({quality: 50}).toFile(path.resolve(process.cwd(), 'public/images', `${id}.avif`))
	const webpPromise = sharp(SOURCE_PATH).webp({quality: 50}).toFile(path.resolve(process.cwd(), 'public/images', `${id}.webp`))
	const jpegPromise = sharp(SOURCE_PATH).jpeg({quality: 50}).toFile(path.resolve(process.cwd(), 'public/images', `${id}.jpeg`))

	return await Promise.all([avifPromise, webpPromise, jpegPromise]);
}

async function fetchImages() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${ARTICLES_DATABASE_ID}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          or: [
            {
              property: "Status",
              select: {
                equals: "Published",
              },
            },
            {
              property: "Status",
              select: {
                equals: "Standalone",
              },
            },
          ],
        },
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NOTION_SECRET}`,
        "Notion-Version": "2022-06-28",
      },
    }
  ).then((res) => res.json());

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
