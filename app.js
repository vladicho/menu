const cards = document.querySelector('#cards');
const timeline = document.querySelector('#timeline');
let filter = 'all';
let inventory = { hosts: [], events: [] };

function render() {
  const query = document.querySelector('#search').value.toLowerCase();
  const activeHosts = inventory.hosts.filter(host => host.active !== false);
  const shown = activeHosts.filter(host => {
    const matchesFilter = filter === 'all' || host.category === filter || (filter === 'online' && host.online === true);
    return matchesFilter && `${host.host} ${host.category} ${host.description}`.toLowerCase().includes(query);
  });
  cards.innerHTML = shown.map(host => {
    const state = host.online === true ? 'respondendo' : host.online === false ? '404 / atenção' : 'DNS detectado';
    return `<article class="card"><div class="card-top"><span class="tag">${host.categoryLabel}</span><span class="status ${host.online === true ? '' : 'off'}">${state}</span></div><h3>${host.host}</h3><p>${host.description}</p><div class="card-foot"><span>visto ${host.lastSeen || '—'}</span><a href="https://${host.host}.lugarerrado.com" target="_blank" rel="noreferrer">abrir ↗</a></div></article>`;
  }).join('');
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

fetch('./data/subdomains.json').then(response => response.json()).then(data => { inventory = data; render(); }).catch(() => render());
