import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const inventoryPath = 'data/subdomains.json';
const previewDirectory = 'previews';
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
const activeHosts = inventory.hosts.filter(host => host.active !== false);
const today = new Date().toISOString().slice(0, 10);

await mkdir(previewDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 960, height: 600 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'reduce',
  locale: 'pt-BR',
});

let captured = 0;
let failed = 0;
let inconclusive = 0;

for (const host of activeHosts) {
  const page = await context.newPage();
  const url = `https://${host.host}.lugarerrado.com`;
  const finalPath = `${previewDirectory}/${host.host}.jpg`;
  const temporaryPath = `${finalPath}.tmp`;
  let responseStatus = null;

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    responseStatus = response?.status() || null;
    if (!response || responseStatus >= 400) throw new Error(`HTTP ${responseStatus || 'sem resposta'}`);
    await page.waitForLoadState('networkidle', { timeout: 6_000 }).catch(() => {});
    await page.waitForTimeout(1_200);
    await page.screenshot({ path: temporaryPath, type: 'jpeg', quality: 62, animations: 'disabled' });
    await rename(temporaryPath, finalPath);
    host.online = true;
    host.lastSeen = today;
    captured += 1;
    console.log(`✓ ${host.host}`);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    if ([404, 410].includes(responseStatus)) {
      host.online = false;
      host.lastSeen = today;
    } else {
      inconclusive += 1;
    }
    failed += 1;
    console.warn(`× ${host.host}: ${error.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
if (captured > 0) inventory.previewsUpdatedAt = today;
await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(`Miniaturas atualizadas: ${captured}; falhas: ${failed}; inconclusivas: ${inconclusive}.`);

