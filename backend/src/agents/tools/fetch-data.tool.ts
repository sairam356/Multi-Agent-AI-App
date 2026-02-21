/**
 * Tools for the executor agent.
 * Each config object is passed directly to ADK's FunctionTool constructor:
 *   new FunctionTool({ name, description, execute })
 */

async function fetchData(args: { query: string; source?: string }): Promise<Record<string, unknown>> {
  const { query, source = 'default' } = args;
  console.log(`[FetchData] query="${query}", source="${source}"`);

  await new Promise((resolve) => setTimeout(resolve, 80));

  return {
    query,
    source,
    results: [
      { id: 1, title: `Top result for "${query}"`, relevance: 0.95, summary: `Primary information about ${query}.` },
      { id: 2, title: `Secondary result for "${query}"`, relevance: 0.82, summary: `Additional context for ${query} from ${source}.` },
    ],
    retrievedAt: new Date().toISOString(),
    totalCount: 2,
  };
}

async function calculate(args: { expression: string }): Promise<Record<string, unknown>> {
  const { expression } = args;
  console.log(`[Calculate] expression="${expression}"`);

  try {
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (sanitized.trim() !== expression.trim()) {
      return { expression, error: 'Only basic arithmetic is allowed', computed: false };
    }
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)() as number;
    return { expression, result, computed: true };
  } catch {
    return { expression, error: 'Could not evaluate expression', computed: false };
  }
}

// ADK FunctionTool expects: { name?, description, execute, parameters? }
// parameters must be explicit JSON Schema — ADK cannot infer it from TS types at runtime.
export const fetchDataToolConfig = {
  name: 'fetch_data',
  description: 'Fetches relevant data or information based on a search query.',
  execute: fetchData,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to fetch data for',
      },
      source: {
        type: 'string',
        description: 'The data source to query (optional, defaults to "default")',
      },
    },
    required: ['query'],
  },
};

export const calculateToolConfig = {
  name: 'calculate',
  description: 'Evaluates a simple arithmetic expression (+, -, *, /).',
  execute: calculate,
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The arithmetic expression to evaluate (e.g. "2 + 3 * 4")',
      },
    },
    required: ['expression'],
  },
};
