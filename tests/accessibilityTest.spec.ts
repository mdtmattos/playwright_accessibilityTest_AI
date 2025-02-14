import { test, expect } from '@playwright/test';
import axios from 'axios';
import { runAccessibilityTest } from '../src/accessibility';
import dotenv from 'dotenv';
dotenv.config();

// Function to format violations
function formatViolations(violations) {
  return violations.slice(0, 5).map(violation => {
    const affectedElements = violation.nodes.map(node => node.html).join(' | ');
    return `🔴 **Problem:** ${violation.description}\nℹ️ **Impact:** ${violation.impact}\n📌 **Affected Elements:** ${affectedElements}`;
  }).join('\n\n');
}

// Refined prompt
function generatePrompt(violations) {
  return `Below are some accessibility issues found on a website. Your task is to provide only practical and objective suggestions to fix each issue. Do not include long explanations, just direct and applicable solutions.

  Each issue follows the format:  
  🔴 **Problem:** [problem description]  
  ℹ️ **Impact:** [impact level]  
  📌 **Affected Elements:** [affected element code]  
  
  Now, provide direct correction suggestions for each of the issues listed below:  
  
  ${violations}
  
  ### Expected response structure:
  🔴 **Problem:** The \`role\` attribute must have an appropriate value for the element  
  ✅ **Solution:** Ensure the \`role\` attribute is correct for the element and replace it with an appropriate semantic value, such as \`combobox\` for interactive input fields.
  
  🔴 **Problem:** The document must have a main landmark  
  ✅ **Solution:** Add a \`<main>\` element to the document to define the main content of the page.
  
  🔴 **Problem:** Links must be distinguishable from surrounding text in a way that does not rely solely on color`;
}

// Function to get insights from Hugging Face
async function getAiInsightsFromHuggingFace(violations: any, retryCount = 0) {
  const formattedViolations = formatViolations(violations);
  const prompt = generatePrompt(formattedViolations);

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/EleutherAI/gpt-neox-20b',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const suggestions = response.data[0]?.generated_text.trim() || 'No suggestions available.';
    return validateSuggestions(suggestions);

  } catch (error: any) {
    if (error.response && error.response.status === 503) {
      const estimatedTime = error.response.data?.estimated_time || 10; // Estimated time or default of 10s
      console.warn(`Model is loading. Retrying in ${estimatedTime} seconds...`);
      
      if (retryCount < 5) {  // Limit of 5 attempts
        await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
        return getAiInsightsFromHuggingFace(violations, retryCount + 1);
      } else {
        console.error('Maximum retry limit reached.');
        return 'Error generating insights: model unavailable.';
      }
    } else {
      console.error('Error obtaining AI insights:', error);
      return 'Error generating insights.';
    }
  }
}

// Function to validate AI suggestions
function validateSuggestions(suggestions: any) {
  const validSuggestions = suggestions.split('\n\n').filter(suggestion => {
    return suggestion.includes('🔴 **Problem:**') && suggestion.includes('✅ **Solution:**');
  });
  return validSuggestions.join('\n\n') || 'No valid suggestions available.';
}

// Function to get insights from OpenAI
async function getAiInsightsFromOpenAi(violations) {
  const formattedViolations = formatViolations(violations);
  const prompt = generatePrompt(formattedViolations);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // or another compatible model
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const suggestions = response.data.choices?.[0]?.message?.content?.trim() || 'No suggestions available.';
    return validateSuggestions(suggestions);
  } catch (error) {
    console.error('Error obtaining AI insights:', error.response?.data || error.message);
    return 'Error generating insights.';
  }
}

// Function to get insights from Claude AI
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
          'x-api-key': process.env.CLAUDE_API_KEY, // Claude API Key
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.completion.trim() || 'No suggestions available.';
  } catch (error) {
    console.error('Error obtaining insights from Claude:', error);
    return 'Error generating insights.';
  }
}

// Accessibility test
test('Run accessibility test and obtain AI insights', async ({ page }) => {
  test.setTimeout(120000);
  const url = 'https://www.google.com/'; // URL to be tested
  await page.waitForTimeout(3000);
  const axeResults = await runAccessibilityTest(url);

  if (!Array.isArray(axeResults)) {
    throw new Error('Accessibility test results are not an array');
  }

  const aiInsights = await getAiInsightsFromHuggingFace(axeResults);

  console.log('🔍 **Accessibility Results and AI Insights**');
  console.log(aiInsights);

  expect(aiInsights).not.toBe('No suggestions available.');
});
