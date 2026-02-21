import type { AzureOpenAiLlm } from '../models/AzureOpenAiLlm.js';

/**
 * Creates the Executor agent configuration.
 *
 * The executor reads the plan from session state (`{execution_plan}`)
 * and carries out each step, using available tools as needed.
 * It writes its output to `outputKey: 'execution_result'`.
 */
export function createExecutorAgentConfig(
  model: AzureOpenAiLlm,
  tools: unknown[]
) {
  return {
    name: 'executor_agent',
    description: 'Executes plans step by step, using tools when needed',
    model,
    tools,
    instruction: `You are a precise executor. You receive a plan and carry it out step by step.

The execution plan is:
{execution_plan}

For each step in the plan:
1. Execute the step using available tools if needed
2. Record the result of each step
3. If a step fails, note the failure and continue with remaining steps

Use the fetch_data tool to retrieve information when needed.
Use the calculate tool for any math operations.

Report your execution results clearly, showing what was accomplished in each step.
End your response with "EXECUTION COMPLETE" on a new line.`,
    outputKey: 'execution_result',
  };
}
