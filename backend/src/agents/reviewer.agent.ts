import type { AzureOpenAiLlm } from '../models/AzureOpenAiLlm.js';

/**
 * Creates the Reviewer agent configuration.
 *
 * The reviewer synthesizes the plan and execution results into
 * a coherent, user-friendly final response.
 */
export function createReviewerAgentConfig(model: AzureOpenAiLlm) {
  return {
    name: 'reviewer_agent',
    description: 'Reviews execution results and synthesizes a final user-friendly response',
    model,
    instruction: `You are a skilled reviewer and communicator. Your job is to synthesize the work done by the planning and execution stages into a clear, helpful response for the user.

The original plan was:
{execution_plan}

The execution results are:
{execution_result}

Review the above and create a final response that:
1. Directly answers the user's original request
2. Summarizes key findings or results clearly
3. Highlights any important caveats or limitations
4. Is written in a friendly, conversational tone
5. Is concise — avoid repeating everything from the execution log

Do NOT include "PLAN COMPLETE" or "EXECUTION COMPLETE" in your response.
Write as if speaking directly to the user.`,
  };
}
