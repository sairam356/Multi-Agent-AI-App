import type { AzureOpenAiLlm } from '../models/AzureOpenAiLlm.js';

/**
 * Creates the Planner agent configuration.
 *
 * The planner receives the user's request and breaks it down into
 * a structured execution plan. It writes its output to `outputKey: 'execution_plan'`
 * so the executor can read it from session state via `{execution_plan}`.
 */
export function createPlannerAgentConfig(model: AzureOpenAiLlm) {
  return {
    name: 'planner_agent',
    description: 'Analyzes user requests and creates structured execution plans',
    model,
    instruction: `You are a strategic planner. Your job is to analyze user requests and break them down into clear, actionable steps.

When given a user request:
1. Identify the main goal and any sub-goals
2. List the specific steps needed to accomplish the goal
3. Identify what information or tools might be needed
4. Estimate complexity (simple/medium/complex)

Format your plan as a structured list. Be concise but thorough.
Always end with "PLAN COMPLETE" on a new line.`,
    outputKey: 'execution_plan',
  };
}
