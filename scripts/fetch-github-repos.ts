/**
 * Fetch GitHub repositories and save to src/content/projects.json
 *
 * Usage:
 *   GITHUB_TOKEN=xxx npx tsx scripts/fetch-github-repos.ts
 *
 * Environment variables:
 *   GITHUB_TOKEN - GitHub personal access token (optional, for higher rate limits)
 *   GITHUB_USERNAME - GitHub username (required)
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

if (!GITHUB_USERNAME) {
  console.error('Error: GITHUB_USERNAME environment variable is required');
  process.exit(1);
}

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  homepage: string | null;
  fork: boolean;
  archived: boolean;
}

interface Project {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string | null;
  homepage: string | null;
}

async function fetchRepos(): Promise<Project[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'personal-website',
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }

  const allRepos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=stars&direction=desc`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos: GitHubRepo[] = await response.json();
    if (repos.length === 0) break;

    allRepos.push(...repos);
    page++;

    // Safety limit
    if (page > 10) break;
  }

  return allRepos
    .filter((repo) => !repo.fork && !repo.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .map((repo) => ({
      name: repo.name,
      description: repo.description || '',
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language,
      homepage: repo.homepage || null,
    }));
}

async function main() {
  console.log(`Fetching repos for GitHub user: ${GITHUB_USERNAME}`);

  const projects = await fetchRepos();
  console.log(`Found ${projects.length} repositories`);

  const outputPath = join(process.cwd(), 'src/content/projects.json');
  writeFileSync(outputPath, JSON.stringify(projects, null, 2));
  console.log(`Saved to ${outputPath}`);
}

main().catch((error) => {
  console.error('Failed to fetch repos:', error);
  process.exit(1);
});
