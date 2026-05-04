import { withRequestContext, validateRequest } from '@/shared/context.js';
import { successResponse, ValidationError } from '@/shared/errors.js';
import { orchestrator } from '@/orchestration/orchestrator.js';
import { IntentSchema } from '@/orchestration/orchestrator.js';

export const POST = withRequestContext(async (request) => {
  try {
    // Validate request body
    const intentData = await validateRequest(IntentSchema)(request);
    
    // Submit intent to orchestrator
    const workflow = await orchestrator.submitIntent(intentData);
    
    return successResponse({
      workflowId: workflow.id,
      intent: intentData,
      strategy: workflow.strategy,
      state: workflow.state,
      estimatedDuration: workflow.metadata.strategy.estimatedDuration,
      estimatedCost: workflow.metadata.strategy.estimatedCost,
      taskCount: workflow.tasks.length,
      createdAt: workflow.createdAt
    }, {
      message: 'Intent submitted successfully',
      meta: {
        workflowId: workflow.id,
        correlationId: request.headers.get('x-correlation-id')
      }
    });
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to submit intent: ${error.message}`);
  }
});

export const GET = withRequestContext(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workflowId = searchParams.get('workflowId');
    
    if (workflowId) {
      // Get specific workflow
      const workflow = orchestrator.getWorkflow(workflowId);
      
      if (!workflow) {
        throw new ValidationError('Workflow not found');
      }
      
      // Verify user can access this workflow
      if (workflow.intent.userId !== userId && request.user?.id !== workflow.intent.userId) {
        throw new ValidationError('Access denied to this workflow');
      }
      
      return successResponse({
        workflow: {
          id: workflow.id,
          intent: workflow.intent,
          strategy: workflow.strategy,
          state: workflow.state,
          tasks: workflow.tasks,
          metadata: workflow.metadata,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          startedAt: workflow.startedAt,
          completedAt: workflow.completedAt,
          error: workflow.error
        }
      });
      
    } else if (userId) {
      // Get all workflows for user
      const workflows = orchestrator.getWorkflowsByUser(userId);
      
      return successResponse({
        workflows: workflows.map(workflow => ({
          id: workflow.id,
          intent: {
            type: workflow.intent.type,
            priority: workflow.intent.priority
          },
          strategy: workflow.strategy,
          state: workflow.state,
          taskCount: workflow.tasks.length,
          completedTasks: workflow.tasks.filter(t => t.status === 'completed').length,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          startedAt: workflow.startedAt,
          completedAt: workflow.completedAt,
          error: workflow.error
        }))
      });
      
    } else {
      throw new ValidationError('Either userId or workflowId parameter is required');
    }
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to get workflows: ${error.message}`);
  }
});

export const DELETE = withRequestContext(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const reason = searchParams.get('reason') || 'User cancelled';
    
    if (!workflowId) {
      throw new ValidationError('workflowId parameter is required');
    }
    
    // Cancel workflow
    const workflow = orchestrator.cancelWorkflow(workflowId, reason);
    
    // Verify user can cancel this workflow
    if (workflow.intent.userId !== request.user?.id) {
      throw new ValidationError('Access denied to this workflow');
    }
    
    return successResponse({
      workflow: {
        id: workflow.id,
        state: workflow.state,
        cancelledAt: workflow.updatedAt,
        reason
      }
    }, {
      message: 'Workflow cancelled successfully'
    });
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to cancel workflow: ${error.message}`);
  }
});
