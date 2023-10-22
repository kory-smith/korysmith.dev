import fetch from 'node-fetch';
import imageData from "~/public/images/imageData.json"

const NOTION_SECRET = process.env['PUBLIC_NOTION_SECRET']
const ARTICLES_DATABASE_ID = 'bf7e16c44b7b46a6ac4d11d5d4db77d8';

async function handleImage(result) {
  const attributes = generateAttributes(result)
  return `<picture>
            <source srcset="/images/${result.id}.avif" type="image/avif" ${attributes}>
            <source srcset="/images/${result.id}.webp" type="image/webp" ${attributes}>
            <img src="/images/${result.id}.jpeg" type="image/jpeg" ${attributes}>
          </picture>`;
}

function generateAttributes(result) {
  const { width, height } = imageData[result.id];
  const attributes = {
    width,
    height,
    loading: "lazy",
    decoding: "async",
    // alt: result.image.caption[0].plain_text || "",
  }

  return Object.entries(attributes).reduce((acc, [key, value]) => {
    return `${acc} ${key}="${value}"`
  }, "")
}

async function notionBlocksToHtml(page) {
  const { results } = page;
  let html = "";
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.type === "paragraph") {
      html += `<p>${notionRichTextToHtml(result.paragraph.rich_text)}</p>`;
    } else if (result.type === "heading_1") {
      html += `<h1>${notionRichTextToHtml(
        result.heading_1.rich_text
      )}</h1>`;
    } else if (result.type === "heading_2") {
      html += `<h2 id="${result.heading_2.rich_text[0].plain_text}">${notionRichTextToHtml(
        result.heading_2.rich_text
      )}<a href="#${result.heading_2.rich_text[0].plain_text}">#</a></h2>`;
    } else if (result.type === "heading_3") {
      html += `<h3 id="${result.heading_3.rich_text[0].plain_text}">${notionRichTextToHtml(
        result.heading_3.rich_text
      )}<a href="#${result.heading_3.rich_text[0].plain_text}">#</a></h3>`;
    } else if (result.type === "bulleted_list_item") {
      html += `<ul>${notionRichTextToHtml(
        result.bulleted_list_item.rich_text
      )}</ul>`;
    } else if (result.type === "numbered_list_item") {
      html += `<li>${notionRichTextToHtml(
        result.numbered_list_item.rich_text
      )}</li>`;
    } else if (result.type === "divider") {
      html += "<hr>";
    } else if (result.type === "code") {
      html += `<pre><code>${notionRichTextToHtml(
        result.code.rich_text
      )}</code></pre>`;
    } else if (result.type === "quote") {
      html += `<blockquote>${notionRichTextToHtml(
        result.quote.rich_text
      )}</blockquote>`;
    } else if (result.type === "image") {
      html += await handleImage(result);
    } else {
      html += `<p>Block type "${result.type}" not supported.</p>`;
    }
  }
  return html;
}

function notionRichTextToHtml(richText) {
  let html = "";
  richText.forEach((item) => {
    if (item.type === "text") {
      let content = item.text.content;
      // Apply annotations
      if (item.annotations.italic) {
        content = `<em>${content}</em>`;
      }
      if (item.annotations.bold) {
        content = `<strong>${content}</strong>`;
      }
      if (item.annotations.underline) {
        content = `<u>${content}</u>`;
      }
      if (item.annotations.strikethrough) {
        content = `<s>${content}</s>`;
      }
      if (item.annotations.code) {
        content = `<code>${content}</code>`;
      }
      // Handle links
      if (item.text.link) {
        content = `<a href="${item.text.link.url}">${content}</a>`;
      }
      html += content;
    }
  });
  return html;
}

export async function fetchArticlesUsingCustomFilter(filter) {
  const response = await fetch(`https://api.notion.com/v1/databases/${ARTICLES_DATABASE_ID}/query`, {
    method: 'POST',
    // Don't include a body if there's no filter
    ...(filter && { body: JSON.stringify(filter) }),
    headers: {
      'Content-Type': "application/json",
      Authorization: `Bearer ${NOTION_SECRET}`,
      'Notion-Version': '2022-06-28',
    },
  }).then((res) => res.json());

  const articles = response.results.map(async (article) => {
    const childBlocks = await fetch(`https://api.notion.com/v1/blocks/${article.id}/children?page_size=100`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${NOTION_SECRET}`,
        'Notion-Version': '2022-06-28',
      },
    }).then((res) => res.json());

    const content = await notionBlocksToHtml(childBlocks);
    return {
      id: article.id,
      title: article.properties.Name.title[0].plain_text,
      slug: article.properties.Slug.rich_text[0].plain_text,
      content,
    };
  });

  return await Promise.all(articles);
}

export async function fetchAllArticles() {
  return await fetchArticlesUsingCustomFilter();
}

export async function fetchArticlesWithName(name) {
  return await fetchArticlesUsingCustomFilter({
    filter: {
      property: "Name",
      rich_text: {
        equals: name
      }
    }
  })
}

export async function fetchArticlesWithStatus(status) {
  return await fetchArticlesUsingCustomFilter({
    filter: {
      property: "Status",
      select: {
        equals: status
      }
    }
  })
}
