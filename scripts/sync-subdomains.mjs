import { readFile, writeFile } from 'node:fs/promises';
const zone = 'lugarerrado.com';
const owner = 'vladicho';
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim();
const githubToken = process.env.GITHUB_TOKEN?.trim();
if (!token || !zoneId || !githubToken) throw new Error('CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID e GITHUB_TOKEN são obrigatórios.');
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const githubHeaders = { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

async function getDnsRecords() {
  const records = [];
  for (let page = 1, pages = 1; page <= pages; page += 1) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100&page=${page}&order=name`, { headers });
    const body = await response.json();
    if (!body.success) throw new Error(JSON.stringify(body.errors));
    records.push(...body.result); pages = body.result_info.total_pages;
  }
  return [...new Set(records.filter(record => ['A', 'AAAA', 'CNAME'].includes(record.type) && record.name !== zone).map(record => record.name.replace(`.${zone}`, '')))].sort();
}

async function getRepositories() {
  const repos = [];
  for (let page = 1, pages = 1; page <= pages; page += 1) {
    const response = await fetch(`https://api.github.com/users/${owner}/repos?per_page=100&page=${page}&sort=updated`, { headers: githubHeaders });
    const body = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(body));
    repos.push(...body); pages = body.length < 100 ? page : page + 1;
  }
  return repos.filter(repo => repo.name !== 'menu');
}

function summarizeReadme(markdown) {
  const lines = markdown.replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean);
  const paragraph = lines.find(line => !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('[![') && !line.startsWith('```') && !line.startsWith('- '));
  return paragraph?.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').replace(/[`*_]/g, '').slice(0, 240);
}

const repos = await getRepositories();
const repoMap = new Map();
for (const repo of repos) {
  let summary = '';
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo.name}/readme`, { headers: { ...githubHeaders, Accept: 'application/vnd.github.raw+json' } });
  if (response.ok) summary = summarizeReadme(await response.text()) || '';
  repoMap.set(repo.name.toLowerCase(), { url: repo.html_url, description: summary || repo.description || '' });
}

const today = new Date().toISOString().slice(0, 10);
const current = JSON.parse(await readFile('data/subdomains.json', 'utf8'));
const previous = new Map(current.hosts.map(host => [host.host, host]));
const names = await getDnsRecords();
for (const host of names) {
  const old = previous.get(host);
  const repo = repoMap.get(host.toLowerCase());
  previous.set(host, { host, category: old?.category || (repo ? 'known' : 'attention'), categoryLabel: old?.categoryLabel || (repo ? 'Projeto GitHub' : 'A confirmar'), description: repo?.description || old?.description || 'Subdomínio detectado no DNS; função ainda não documentada.', online: old?.online ?? null, active: true, lastSeen: today, repoUrl: repo?.url || old?.repoUrl || null });
}
for (const old of previous.values()) if (!names.includes(old.host)) previous.set(old.host, { ...old, active: false });
const newNames = names.filter(name => !current.hosts.some(host => host.host === name));
const events = [...(current.events || [])];
for (const host of newNames) events.unshift({ date: today, host, title: 'Novo subdomínio detectado', description: 'O DNS do Cloudflare passou a registrar este host. A função será descrita a partir do README do repositório correspondente.' });
await writeFile('data/subdomains.json', `${JSON.stringify({ updatedAt: today, hosts: [...previous.values()].sort((a, b) => a.host.localeCompare(b.host)), events: events.slice(0, 100) }, null, 2)}\n`);
console.log(`Inventário atualizado: ${names.length} DNS ativos; ${repos.length} repos analisados.`);
