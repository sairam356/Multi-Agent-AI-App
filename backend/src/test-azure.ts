/**
 * Quick connectivity test for Azure OpenAI.
 * Run with: npm run test:azure (from packages/backend)
 *
 * This verifies your Azure credentials before wiring into ADK.
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from packages/backend/ (one level up from src/)
config({ path: join(__dirname, '../.env') });
import { getAzureClient, getDeploymentName } from './config/azure-openai.js';

async function testAzureConnection() {
  console.log('Testing Azure OpenAI connection...');
  console.log(`Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);
  console.log(`Deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`);
  console.log(`API Version: ${process.env.AZURE_OPENAI_API_VERSION}`);
  console.log('');

  try {
    const client = getAzureClient();
    const deployment = getDeploymentName();

    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: 'user', content: 'Say "Azure connection successful!" and nothing else.' },
      ],
      max_completion_tokens: 50,
    });

    const text = response.choices[0]?.message?.content ?? '';
    console.log('✓ Azure OpenAI response:', text);
    console.log(`  Tokens used: ${response.usage?.total_tokens ?? 'unknown'}`);
    console.log('');
    console.log('Azure OpenAI connection test PASSED');
  } catch (error) {
    console.error('✗ Azure OpenAI connection test FAILED');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testAzureConnection();
