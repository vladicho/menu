# menu

Landing page e inventário vivo dos subdomínios de `lugarerrado.com`.

## Como funciona

- `index.html`: mapa, busca, filtros e linha do tempo.
- `data/subdomains.json`: hosts, descrições e histórico exibidos na página.
- `scripts/sync-subdomains.mjs`: lê os registros DNS da zona Cloudflare.
- `.github/workflows/sync-subdomains.yml`: sincronização diária e manual.

## Ativar a descoberta automática

No repositório do GitHub, crie estes Actions secrets:

- `CLOUDFLARE_API_TOKEN`: token com permissão **Zone → DNS → Read** apenas para `lugarerrado.com`.
- `CLOUDFLARE_ZONE_ID`: ID da zona `lugarerrado.com`, visível no painel Overview do Cloudflare.

O workflow roda diariamente e também pode ser executado em **Actions → Sync subdomains → Run workflow**. Subdomínios novos entram como “A confirmar”; descrições e funções continuam sendo documentadas manualmente no JSON.

## Limite importante

O DNS consegue dizer que um subdomínio existe, mas não sabe explicar o que ele faz. Por isso novos hosts são descobertos automaticamente, enquanto a descrição começa como “A confirmar”.
