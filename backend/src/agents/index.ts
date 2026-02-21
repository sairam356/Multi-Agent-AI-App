/**
 * Agent composition — wires the three-agent pipeline using Google ADK TypeScript.
 *
 * All API calls use the real ADK interface discovered by inspecting v0.3.0:
 *   - Runner.runAsync({ userId, sessionId, newMessage })
 *   - sessionService.getSession({ appName, userId, sessionId })
 *   - sessionService.createSession({ appName, userId, sessionId, state })
 *   - FunctionTool({ name, description, execute })
 *   - SequentialAgent({ name, description, subAgents })
 */

import {
  LlmAgent,
  SequentialAgent,
  FunctionTool,
  Runner,
  InMemorySessionService,
} from '@google/adk';

import { AzureOpenAiLlm } from '../models/AzureOpenAiLlm.js';
import { createPlannerAgentConfig } from './planner.agent.js';
import { createExecutorAgentConfig } from './executor.agent.js';
import { createReviewerAgentConfig } from './reviewer.agent.js';
import { fetchDataToolConfig, calculateToolConfig } from './tools/fetch-data.tool.js';

// ─── Shared model instance (lazy) ─────────────────────────────────────────────
let _azureLlm: AzureOpenAiLlm | null = null;

function getAzureLlm(): AzureOpenAiLlm {
  if (!_azureLlm) _azureLlm = new AzureOpenAiLlm();
  return _azureLlm;
}

// ─── Tool construction ─────────────────────────────────────────────────────────
function buildTools(): FunctionTool[] {
  return [
    new FunctionTool(fetchDataToolConfig),
    new FunctionTool(calculateToolConfig),
  ];
}

// ─── Agent pipeline ────────────────────────────────────────────────────────────
export function buildAgentPipeline(): SequentialAgent {
  const llm = getAzureLlm();
  const tools = buildTools();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plannerAgent = new LlmAgent(createPlannerAgentConfig(llm) as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executorAgent = new LlmAgent(createExecutorAgentConfig(llm, tools) as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviewerAgent = new LlmAgent(createReviewerAgentConfig(llm) as any);

  console.log('[Agents] Pipeline: planner → executor → reviewer via SequentialAgent');

  return new SequentialAgent({
    name: 'multi_agent_pipeline',
    description: 'Sequential multi-agent pipeline: planner → executor → reviewer',
    subAgents: [plannerAgent, executorAgent, reviewerAgent],
  });
}

// ─── Singletons ────────────────────────────────────────────────────────────────

let _sessionService: InMemorySessionService | null = null;
let _runner: Runner | null = null;
let _rootAgent: SequentialAgent | null = null;

export function getSessionService(): InMemorySessionService {
  if (!_sessionService) _sessionService = new InMemorySessionService();
  return _sessionService;
}

export function getRootAgent(): SequentialAgent {
  if (!_rootAgent) _rootAgent = buildAgentPipeline();
  return _rootAgent;
}

export function getRunner(): Runner {
  if (!_runner) {
    _runner = new Runner({
      appName: 'my-multi-agent-app',
      agent: getRootAgent(),
      sessionService: getSessionService(),
    });
  }
  return _runner;
}
