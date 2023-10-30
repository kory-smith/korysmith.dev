import fetch from 'node-fetch';
import imageData from "~/public/images/imageData.json"

const NOTION_SECRET = process.env['PUBLIC_NOTION_SECRET']
const ARTICLES_DATABASE_ID = 'bf7e16c44b7b46a6ac4d11d5d4db77d8';

function handleImage(result) {
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

async function fetchChildBlocksRecursively(blockId) {
  const { results: childBlocks } = await fetch(
    `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${NOTION_SECRET}`,
        "Notion-Version": "2022-06-28",
      },
    }
  ).then((res) => res.json());

  const list = []
  for (const childBlock of childBlocks) {
    list.push({
      children: childBlock.has_children ? await fetchChildBlocksRecursively(childBlock.id) : null,
      type: childBlock.type,
      richText: childBlock[childBlock.type].rich_text,
      id: childBlock.id
    }) 
  }
  return list
}

/**
 * Converts an array of objects with type, richText, and id properties to HTML content.
 *
 * @param {Array<{type: string, children: {}, richText: string, id: string}>} content - The array of objects to convert.
 * @returns {string} The HTML content.
 */
function contentToHTML(content) {
  let html = "";
  let listHtml = "";
  let inList = false;
  for (const block of content) {
    if (block.type === "image") {
      html += handleImage(block);
    } else {
      const tag = createTag(block);
      const innerHTML = notionRichTextToHtml(block.richText);
      if (tag === "ul" || tag === "ol") {
        inList = true;
        listHtml += `<li>${innerHTML}${
          block.children ? contentToHTML(block.children) : ""
        }</li>`;
      } else {
        if (inList) {
          html += wrapInTag("ul", listHtml);
          listHtml = "";
          inList = false;
        }
        html += wrapInTag(tag, innerHTML);
      }
    }
  }
  if (inList) {
    html += wrapInTag("ul", listHtml);
  }
  return html;
}

function createTag(block) {
  if (block.type === "paragraph") {
    return "p" 
  } else if (block.type === "heading_1") {
    return "h1"
  } else if (block.type === "heading_2") {
    return "h2"
  } else if (block.type === "heading_3") {
    return "h3"
  } else if (block.type === "bulleted_list_item") {
    return "ul"
  } else if (block.type === "numbered_list_item") {
    return "ol"
  } else if (block.type === "divider") {
    return "hr"
  } else if (block.type === "code") {
    return "code"
  } else if (block.type === "quote") {
    return "blockquote"
  }
   else {
    return ""
  }
}

function wrapInTag(tag, content) {
  return `<${tag}>${content}</${tag}>`;
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
    const content = await fetchChildBlocksRecursively(article.id);
    const parsedContent = contentToHTML(content)
    return {
      id: article.id,
      title: article.properties.Name.title[0].plain_text,
      slug: article.properties.Slug.rich_text[0].plain_text,
      publishedDate: article.properties["Published Date"].date.start,
      lastEditedTime: article.properties["Last Edited Time"].last_edited_time,
      content: parsedContent,
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
