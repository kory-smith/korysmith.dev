import fetch from "node-fetch";
import imageData from "~/public/images/imageData.json";

const NOTION_SECRET = process.env["PUBLIC_NOTION_SECRET"];
const ARTICLES_DATABASE_ID = "bf7e16c44b7b46a6ac4d11d5d4db77d8";

function handleImage(result) {
  const attributes = generateAttributes(result);
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
  };

  return Object.entries(attributes).reduce((acc, [key, value]) => {
    return `${acc} ${key}="${value}"`;
  }, "");
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
        const relExternalOrNothing = item.text.link.url.includes(
          "korysmith.dev"
        )
          ? ""
          : "rel=external";
        content = `<a href="${item.text.link.url}" ${relExternalOrNothing}>${content}</a>`;
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

  const list = [];
  for (const childBlock of childBlocks) {
    list.push({
      children: childBlock.has_children
        ? await fetchChildBlocksRecursively(childBlock.id)
        : null,
      type: childBlock.type,
      headerHelper: childBlock[childBlock.type]?.rich_text?.[0]?.plain_text,
      richText: childBlock[childBlock.type].rich_text,
      id: childBlock.id,
    });
  }
  return list;
}

function isHeading(block) {
  return [
    "heading_1",
    "heading_2",
    "heading_3",
    "heading_4",
    "heading_5",
    "heading_6",
  ].includes(block.type);
}

/**
 * @typedef {Object} ContentObject
 * @property {string} type
 * @property {string} richText
 * @property {string} id
 * @property {ContentObject[]} children
 */

/**
 * Converts an array of ContentObject to HTML content.
 *
 * @param {ContentObject[]} content - The array of objects to convert.
 * @returns {string} The HTML content.
 */
// Lord forgive me for writing this function
const contentToHTML = (content) => {
  let html = "";
  let listHelper = false;
  for (const block of content) {
    if (block.type === "divider") {
      html += "<hr>";
    } else if (block.type === "image") {
      html += handleImage(block);
    } else if (isHeading(block)) {
      if (listHelper) {
        html += `</${listHelper}>`;
        listHelper = false;
      }
      const tag = createTag(block);
      let innerHTML = notionRichTextToHtml(block.richText);
      innerHTML += `<a href="#${block.headerHelper.toLowerCase()}" class="anchor">#</a>`;
      html += wrapInTag(tag, innerHTML, [
        `id="${block.headerHelper.toLowerCase()}"`,
      ]);
    } else if (block.type === "bulleted_list_item") {
      // If this is the first list item, start a new list and signal for later that we should close it
      if (!listHelper) {
        html += "<ul>";
        const tag = createTag(block);
        html += wrapInTag(tag, notionRichTextToHtml(block.richText));
        // Recursively do this for all children
        if (block.children) {
          html += contentToHTML(block.children);
        }
        listHelper = "ul";
      } else {
        const tag = createTag(block);
        html += wrapInTag(tag, notionRichTextToHtml(block.richText));
        if (block.children) {
          html += contentToHTML(block.children);
        }
      }
    } else if (block.type === "numbered_list_item") {
      // If this is the first list item, start a new list and signal for later that we should close it
      if (!listHelper) {
        html += "<ol>";
        const tag = createTag(block);
        html += wrapInTag(tag, notionRichTextToHtml(block.richText));
        // Recursively do this for all children
        if (block.children) {
          html += contentToHTML(block.children);
        }
        listHelper = "ol";
      } else {
        const tag = createTag(block);
        html += wrapInTag(tag, notionRichTextToHtml(block.richText));
        if (block.children) {
          html += contentToHTML(block.children);
        }
      }
    } else {
      // Otherwise, the next time we're in a non-list item, we can close the list
      if (listHelper) {
        html += `</${listHelper}>`;
        listHelper = false;
      }
      const tag = createTag(block);
      const innerHTML = notionRichTextToHtml(block.richText);
      html += wrapInTag(tag, innerHTML);
    }
  }
  // If we're about to return but we have an unterminated list, terminate it
  if (listHelper) {
    html += `</${listHelper}>`;
    listHelper = false;
  }
  return html;
};

function createTag(block) {
  if (block.type === "paragraph") {
    return "p";
  } else if (block.type === "heading_1") {
    return "h1";
  } else if (block.type === "heading_2") {
    return "h2";
  } else if (block.type === "heading_3") {
    return "h3";
  } else if (block.type === "bulleted_list_item") {
    return "li";
  } else if (block.type === "numbered_list_item") {
    return "li";
  } else if (block.type === "divider") {
    return "hr";
  } else if (block.type === "code") {
    return "code";
  } else if (block.type === "quote") {
    return "blockquote";
  } else {
    return "";
  }
}

function wrapInTag(tag, content, attributes = []) {
  return `<${tag} ${attributes.join(" ")}>${content}</${tag}>`;
}

export async function fetchArticlesUsingCustomFilter(filter) {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${ARTICLES_DATABASE_ID}/query`,
    {
      method: "POST",
      // Don't include a body if there's no filter
      ...(filter && { body: JSON.stringify(filter) }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NOTION_SECRET}`,
        "Notion-Version": "2022-06-28",
      },
    }
  ).then((res) => res.json());

  const articles = response.results.map(async (article) => {
    if (!article.properties?.Name?.title?.[0]?.plain_text) {
      throw Error("Article has no title and needs one");
    } else if (!article.properties?.Slug?.rich_text?.[0]?.plain_text) {
      throw Error("Article has no slug and needs one");
    } else if (!article.properties?.["Published Date"]?.date?.start) {
      throw Error("Article has no published date and needs one");
    }
    const content = await fetchChildBlocksRecursively(article.id);
    const parsedContent = contentToHTML(content);
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
        equals: name,
      },
    },
  });
}

export async function fetchArticlesWithStatus(status) {
  return await fetchArticlesUsingCustomFilter({
    filter: {
      property: "Status",
      select: {
        equals: status,
      },
    },
  });
}
