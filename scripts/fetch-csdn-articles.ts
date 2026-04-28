/**
 * Fetch CSDN articles via RSS and save as Markdown files
 *
 * Usage:
 *   CSDN_USERNAME=xxx npx tsx scripts/fetch-csdn-articles.ts
 *
 * Environment variables:
 *   CSDN_USERNAME - CSDN blog username (required)
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const CSDN_USERNAME = process.env.CSDN_USERNAME || '';

if (!CSDN_USERNAME) {
  console.error('Error: CSDN_USERNAME environment variable is required');
  process.exit(1);
}

interface Article {
  title: string;
  description: string;
  pubDate: string;
  originalUrl: string;
  category: string;
  content: string;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[|\]\]>/g, '');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

function parseRss(xml: string): Article[] {
  const articles: Article[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const categoryMatch = item.match(/<category>([\s\S]*?)<\/category>/);
    const descriptionMatch = item.match(/<description>([\s\S]*?)<\/description>/);

    if (!titleMatch || !linkMatch) continue;

    const title = decodeHtmlEntities(titleMatch[1].trim());
    const link = linkMatch[1].trim();
    const pubDate = pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : new Date().toISOString();
    const category = categoryMatch ? decodeHtmlEntities(categoryMatch[1].trim()) : '未分类';
    const rawDescription = descriptionMatch ? decodeHtmlEntities(descriptionMatch[1].trim()) : '';
    const description = truncate(stripHtml(rawDescription), 200);

    articles.push({
      title,
      description,
      pubDate,
      originalUrl: link,
      category,
      content: rawDescription,
    });
  }

  return articles;
}

function toFrontmatter(article: Article): string {
  const date = article.pubDate.split('T')[0];
  return `---
title: "${article.title.replace(/"/g, '\\"')}"
description: "${article.description.replace(/"/g, '\\"')}"
pubDate: ${date}
originalUrl: "${article.originalUrl}"
category: "${article.category}"
---

${stripHtml(article.content)}
`;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function main() {
  console.log(`Fetching CSDN articles for user: ${CSDN_USERNAME}`);

  const rssUrl = `https://blog.csdn.net/${CSDN_USERNAME}/rss/list`;
  const response = await fetch(rssUrl, {
    headers: { 'User-Agent': 'personal-website' },
  });

  if (!response.ok) {
    throw new Error(`CSDN RSS fetch failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const articles = parseRss(xml);
  console.log(`Found ${articles.length} articles`);

  const outputDir = join(process.cwd(), 'src/content/articles');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Clean existing files
  const existingFiles = readdirSync(outputDir).filter((f) => f.endsWith('.md'));
  for (const file of existingFiles) {
    unlinkSync(join(outputDir, file));
  }

  // Write new files
  for (const article of articles) {
    const slug = slugify(article.title);
    const filename = `${slug}.md`;
    const content = toFrontmatter(article);
    writeFileSync(join(outputDir, filename), content);
    console.log(`  - ${filename}`);
  }

  console.log(`Saved ${articles.length} articles to ${outputDir}`);
}

main().catch((error) => {
  console.error('Failed to fetch CSDN articles:', error);
  process.exit(1);
});
