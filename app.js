const cards = document.querySelector('#cards');
const timeline = document.querySelector('#timeline');
let filter = 'all';
let inventory = { hosts: [], events: [] };

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function formatDate(value) {
  if (!value) return 'atualização pendente';
  const date = new Date(`${value}T12:00:00Z`);
  return `atualizado em ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)}`;
}

function render() {
  const query = document.querySelector('#search').value.toLowerCase();
  const activeHosts = inventory.hosts.filter(host => host.active !== false);
  const shown = activeHosts.filter(host => {
    const matchesFilter = filter === 'all' || host.category === filter || (filter === 'online' && host.online === true);
    return matchesFilter && `${host.host} ${host.category} ${host.description}`.toLowerCase().includes(query);
  });
  cards.innerHTML = shown.map(host => {
    const state = host.online === true ? 'respondendo' : host.online === false ? '404 / atenção' : 'DNS detectado';
    const repoLink = host.repoUrl ? ` · <a href="${host.repoUrl}" target="_blank" rel="noreferrer">repo ↗</a>` : '';
    const hostName = escapeHtml(host.host);
    const siteUrl = `https://${encodeURIComponent(host.host)}.lugarerrado.com`;
    const previewVersion = encodeURIComponent(inventory.previewsUpdatedAt || inventory.updatedAt || 'latest');
    return `<article class="card"><a class="card-preview" href="${siteUrl}" target="_blank" rel="noreferrer" aria-label="Abrir ${hostName}.lugarerrado.com"><span class="preview-fallback"><b>/${hostName}</b><small>prévia indisponível</small></span><img src="./previews/${encodeURIComponent(host.host)}.jpg?v=${previewVersion}" alt="Miniatura de ${hostName}.lugarerrado.com" loading="lazy" decoding="async"></a><div class="card-body"><div class="card-top"><span class="tag">${escapeHtml(host.categoryLabel)}</span><span class="status ${host.online === true ? '' : 'off'}">${state}</span></div><h3>${hostName}</h3><p>${escapeHtml(host.description)}</p><div class="card-foot"><span>visto ${escapeHtml(host.lastSeen || '—')}</span><span><a href="${siteUrl}" target="_blank" rel="noreferrer">abrir ↗</a>${repoLink}</span></div></div></article>`;
  }).join('');
  cards.querySelectorAll('.card-preview img').forEach(image => {
    const showFallback = () => image.closest('.card-preview').classList.add('missing');
    image.addEventListener('error', showFallback, { once: true });
    if (image.complete && image.naturalWidth === 0) showFallback();
  });
  document.querySelector('#empty').hidden = shown.length > 0;
  document.querySelector('#total-count').textContent = activeHosts.length;
  document.querySelector('#online-count').textContent = activeHosts.filter(host => host.online === true).length;
  document.querySelector('#known-count').textContent = activeHosts.filter(host => host.category === 'known').length;
  timeline.innerHTML = (inventory.events || []).map(event => `<div class="event"><span class="event-date">${event.date}</span><p><strong>${event.title}</strong><br>${event.description}</p><span class="event-host">${event.host}</span></div>`).join('');
}

document.querySelector('#search').addEventListener('input', render);
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  filter = button.dataset.filter;
  render();
}));

fetch('./data/subdomains.json').then(response => response.json()).then(data => {
  inventory = data;
  document.querySelector('#updated-label').textContent = formatDate(data.previewsUpdatedAt || data.updatedAt);
  render();
}).catch(() => render());
