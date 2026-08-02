import { readFile, writeFile } from 'node:fs/promises';
const zone = 'lugarerrado.com';
const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
if (!token || !zoneId) throw new Error('CLOUDFLARE_API_TOKEN e CLOUDFLARE_ZONE_ID são obrigatórios.');
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const records = [];
for (let page = 1, pages = 1; page <= pages; page += 1) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100&page=${page}&order=name`, { headers });
  const body = await response.json();
  if (!body.success) throw new Error(JSON.stringify(body.errors));
  records.push(...body.result); pages = body.result_info.total_pages;
}
const today = new Date().toISOString().slice(0, 10);
const current = JSON.parse(await readFile('data/subdomains.json', 'utf8'));
const previous = new Map(current.hosts.map(host => [host.host, host]));
const names = [...new Set(records.filter(record => ['A', 'AAAA', 'CNAME'].includes(record.type) && record.name !== zone).map(record => record.name.replace(`.${zone}`, '')))].sort();
for (const host of names) {
  const old = previous.get(host);
  previous.set(host, { host, category: old?.category || 'attention', categoryLabel: old?.categoryLabel || 'A confirmar', description: old?.description || 'Subdomínio detectado no DNS; função ainda não documentada.', online: old?.online ?? null, active: true, lastSeen: today });
}
for (const old of previous.values()) if (!names.includes(old.host)) previous.set(old.host, { ...old, active: false });
const newNames = names.filter(name => !current.hosts.some(host => host.host === name));
const events = [...(current.events || [])];
for (const host of newNames) events.unshift({ date: today, host, title: 'Novo subdomínio detectado', description: 'O DNS do Cloudflare passou a registrar este host. A função ainda precisa ser documentada.' });
await writeFile('data/subdomains.json', `${JSON.stringify({ updatedAt: today, hosts: [...previous.values()].sort((a, b) => a.host.localeCompare(b.host)), events: events.slice(0, 100) }, null, 2)}\n`);
console.log(`Inventário atualizado: ${names.length} ativos; ${newNames.length} novos.`);
