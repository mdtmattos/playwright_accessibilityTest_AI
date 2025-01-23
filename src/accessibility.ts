import { chromium } from 'playwright';
import { injectAxe } from 'axe-playwright';

export async function runAccessibilityTest(url: string): Promise<any[]> {  // Alterado para retornar um array de objetos
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navegar até o URL desejado
  await page.goto(url);

  // Injetar o Axe no contexto da página
  await injectAxe(page);

  // Executar a verificação de acessibilidade e capturar os resultados
  const results = await page.evaluate(async () => {
    // Usando o `axe` no contexto da página
    const axeResults = await (window as any).axe.run();
    return axeResults.violations; // Retorna as violações encontradas
  });

  await browser.close();

  return results;  // Agora retorna o array de violações
}
