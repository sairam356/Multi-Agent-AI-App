import { AzureOpenAI } from 'openai';

let _client: AzureOpenAI | null = null;

/**
 * Returns a singleton AzureOpenAI client.
 * The SDK automatically constructs the URL:
 *   {endpoint}/openai/deployments/{deployment}/chat/completions?api-version={apiVersion}
 */
export function getAzureClient(): AzureOpenAI {
  if (_client) return _client;

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2025-04-01-preview';

  if (!endpoint) throw new Error('AZURE_OPENAI_ENDPOINT is not set');
  if (!apiKey) throw new Error('AZURE_OPENAI_API_KEY is not set');

  _client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
  });

  return _client;
}

export function getDeploymentName(): string {
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  if (!deployment) throw new Error('AZURE_OPENAI_DEPLOYMENT_NAME is not set');
  return deployment;
}
