import { test, expect } from '@playwright/test';
import axios from 'axios';
import { runAccessibilityTest } from '../src/accessibility';
import dotenv from 'dotenv';
dotenv.config();

// Função para obter insights da IA
async function getAiInsights(violations: any[]): Promise<string> {
  const limitedViolations = violations.slice(0, 5).map(violation => {
    const affectedElements = violation.nodes.map(node => node.html).join(' | ');
    return `🔴 **Problema:** ${violation.description}\nℹ️ **Impacto:** ${violation.impact}\n📌 **Elementos afetados:** ${affectedElements}`;
  }).join('\n\n');

  const prompt = `Aqui estão alguns problemas de acessibilidade encontrados em um site. Para cada um, forneça uma sugestão prática para correção. Não forneça explicações longas, apenas a correção sugerida:

${limitedViolations}

Sugestões práticas para melhorar a acessibilidade de cada um dos problemas acima.`;

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-2.7B',
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    return response.data[0]?.generated_text || 'Sem sugestões disponíveis.';
  } catch (error) {
    console.error('Erro ao obter insights da IA:', error);
    return 'Erro ao gerar insights.';
  }
}

// Teste de acessibilidade
test('executar teste de acessibilidade e obter insights da IA', async ({ page }) => {
  test.setTimeout(60000);

  const url = 'https://www.google.com/'; // URL a ser testado
  const axeResults = await runAccessibilityTest(url); // Coletando os resultados do Axe

  // Certifique-se de que axeResults seja um array
  if (!Array.isArray(axeResults)) {
    throw new Error('Os resultados do teste de acessibilidade não são um array');
  }

  // Obter insights da IA para os resultados formatados
  const aiInsights = await getAiInsights(axeResults);

  console.log('🔍 **Resultados da Acessibilidade e Insights da IA**');
  console.log(aiInsights);

  // Verifique se os insights da IA contêm sugestões de melhorias
  expect(aiInsights).not.toBe('Sem sugestões disponíveis.');
});
