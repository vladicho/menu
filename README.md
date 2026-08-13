# menu

Landing page e inventário vivo dos subdomínios de `lugarerrado.com`.

## Fonte dos dados

O workflow cruza os registros DNS da zona Cloudflare com os repositórios públicos do usuário `vladicho`. Por convenção, um repo chamado `training` documenta `training.lugarerrado.com`. A descrição exibida vem do primeiro parágrafo do `README.md` desse repo; quando não há README, usa a descrição do GitHub ou “A confirmar”.

## Arquivos

- `index.html`: mapa, busca, filtros e linha do tempo.
- `data/subdomains.json`: hosts, descrições e histórico exibidos.
- `scripts/sync-subdomains.mjs`: lê DNS e READMEs do GitHub.
- `.github/workflows/sync-subdomains.yml`: sincronização diária e manual.

## Secrets necessários

Em `Settings → Secrets and variables → Actions`, crie:

- `CLOUDFLARE_API_TOKEN`: token com **Zone → DNS → Read** apenas para `lugarerrado.com`.
- `CLOUDFLARE_ZONE_ID`: ID da zona `lugarerrado.com` no Cloudflare.

`GITHUB_TOKEN` já é fornecido automaticamente pelo GitHub Actions. O workflow roda diariamente e também pode ser executado em `Actions → Sync subdomains → Run workflow`.

## Miniaturas dos sites

Na mesma execução, o Playwright abre cada site ativo e salva uma miniatura atualizada em
`previews/`. Se um site estiver indisponível, o menu exibe uma capa de fallback no lugar da
imagem. Para atualizar localmente, execute `npm install` e `npm run capture-previews`.
