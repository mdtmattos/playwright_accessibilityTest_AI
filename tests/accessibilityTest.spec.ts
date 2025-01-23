import { test, expect } from '@playwright/test';
import axios from 'axios';
import { runAccessibilityTest } from '../src/accessibility';
import dotenv from 'dotenv';
dotenv.config();

// Função para formatar as violações
function formatViolations(violations) {
  return violations.slice(0, 5).map(violation => {
    const affectedElements = violation.nodes.map(node => node.html).join(' | ');
    return `🔴 **Problema:** ${violation.description}\nℹ️ **Impacto:** ${violation.impact}\n📌 **Elementos afetados:** ${affectedElements}`;
  }).join('\n\n');
}

// Prompt refinado
function generatePrompt(violations) {
  return `Abaixo estão alguns problemas de acessibilidade encontrados em um site. Sua tarefa é fornecer apenas sugestões práticas e objetivas para corrigir cada problema. Não inclua explicações longas, apenas soluções diretas e aplicáveis.

Cada problema segue o seguinte formato:  
🔴 **Problema:** [descrição do problema]  
ℹ️ **Impacto:** [nível de impacto]  
📌 **Elementos afetados:** [código do elemento afetado]  

Agora, forneça sugestões diretas de correção para cada um dos problemas listados abaixo:  

${violations}

### Estrutura de respostas esperadas:
🔴 **Problema:** O atributo \`role\` deve ter um valor apropriado para o elemento  
✅ **Solução:** Verifique se o atributo \`role\` está correto para o elemento e substitua-o por um valor semântico apropriado, como \`combobox\` para campos de entrada interativos.

🔴 **Problema:** O documento deve ter um landmark principal  
✅ **Solução:** Adicione um elemento \`<main>\` ao documento para definir o conteúdo principal da página.

🔴 **Problema:** Links devem ser distinguidos do texto ao redor de uma forma que não dependa apenas da cor  
✅ **Solução:** Adicione um sublinhado ou outro estilo visual aos links para diferenciá-los do texto ao redor.`;
}

// Função para obter insights da HuggingFace
async function getAiInsightsFromHuggingFace(violations) {
  const formattedViolations = formatViolations(violations);
  const prompt = generatePrompt(formattedViolations);

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-2.7B',
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const suggestions = response.data[0]?.generated_text.trim() || 'Sem sugestões disponíveis.';
    return validateSuggestions(suggestions);
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error === 'Model too busy, unable to get response in less than 60 second(s)') {
      console.error('Modelo ocupado, tentando novamente...');
      // Tentar novamente após um pequeno atraso
      await new Promise(resolve => setTimeout(resolve, 5000));
      return getAiInsightsFromHuggingFace(violations);
    } else {
      console.error('Erro ao obter insights da IA:', error);
      return 'Erro ao gerar insights.';
    }
  }
}

// Função para validar as sugestões da IA
function validateSuggestions(suggestions) {
  const validSuggestions = suggestions.split('\n\n').filter(suggestion => {
    return suggestion.includes('🔴 **Problema:**') && suggestion.includes('✅ **Solução:**');
  });
  return validSuggestions.join('\n\n') || 'Sem sugestões válidas disponíveis.';
}

// Função para obter insights da OpenAI
async function getAiInsightsFromOpenAi(violations) {
  const formattedViolations = formatViolations(violations);
  const prompt = generatePrompt(formattedViolations);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/engines/davinci-codex/completions',
      {
        prompt: prompt,
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.7
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const suggestions = response.data.choices[0].text.trim() || 'Sem sugestões disponíveis.';
    return validateSuggestions(suggestions);
  } catch (error) {
    console.error('Erro ao obter insights da IA:', error);
    return 'Erro ao gerar insights.';
  }
}

// Função para obter insights da Claude AI
async function getAiInsightsFromClaude(violations: any[]): Promise<string> {
  const prompt = generatePrompt(violations);

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/complete',
      {
        model: 'claude-2',
        prompt,
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY, // API Key do Claude
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.completion.trim() || 'Sem sugestões disponíveis.';
  } catch (error) {
    console.error('Erro ao obter insights do Claude:', error);
    return 'Erro ao gerar insights.';
  }
}

// Teste de acessibilidade
test('executar teste de acessibilidade e obter insights da IA', async ({ page }) => {
  test.setTimeout(120000);
  const url = 'https://www.saucedemo.com/'; // URL a ser testado
  const axeResults = await runAccessibilityTest(url);

  if (!Array.isArray(axeResults)) {
    throw new Error('Os resultados do teste de acessibilidade não são um array');
  }

  const aiInsights = await getAiInsightsFromHuggingFace(axeResults);

  console.log('🔍 **Resultados da Acessibilidade e Insights da IA**');
  console.log(aiInsights);

  expect(aiInsights).not.toBe('Sem sugestões disponíveis.');
});
