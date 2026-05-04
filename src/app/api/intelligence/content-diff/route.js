import { withRequestContext } from '@/shared/context.js';
import { validateRequest } from '@/shared/schemas.js';
import { successResponse, ValidationError } from '@/shared/errors.js';

export const POST = withRequestContext(async (request) => {
  try {
    // Validate request
    const body = await request.json();
    const { originalContent, tailoredContent, sections = [] } = body;

    if (!originalContent || !tailoredContent) {
      throw new ValidationError('Both originalContent and tailoredContent are required');
    }

    // Generate diff
    const diff = generateDiff(originalContent, tailoredContent, sections);

    return successResponse({
      diff,
      metadata: {
        originalLength: originalContent.length,
        tailoredLength: tailoredContent.length,
        changeCount: diff.summary.totalChanges,
        sectionsModified: diff.summary.sectionsModified
      }
    }, {
      message: 'Content diff generated successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Content diff generation failed: ${error.message}`);
  }
});

// Simple diff generation (in production, use a proper diff library)
function generateDiff(original, tailored, sections) {
  const diff = {
    summary: {
      totalChanges: 0,
      additions: 0,
      removals: 0,
      modifications: 0,
      sectionsModified: 0
    },
    sections: []
  };

  if (sections.length > 0) {
    // Section-based diff
    sections.forEach(section => {
      const originalSection = section.originalContent || '';
      const tailoredSection = section.content || '';
      
      const sectionDiff = calculateSectionDiff(originalSection, tailoredSection, section);
      diff.sections.push(sectionDiff);
      
      // Update summary
      diff.summary.totalChanges += sectionDiff.changeCount;
      diff.summary.additions += sectionDiff.additions;
      diff.summary.removals += sectionDiff.removals;
      diff.summary.modifications += sectionDiff.modifications;
      if (sectionDiff.changeCount > 0) {
        diff.summary.sectionsModified++;
      }
    });
  } else {
    // Full content diff
    const fullDiff = calculateSectionDiff(original, tailored);
    diff.sections.push({
      id: 'full_content',
      type: 'full',
      title: 'Full Content',
      ...fullDiff
    });
    
    diff.summary.totalChanges = fullDiff.changeCount;
    diff.summary.additions = fullDiff.additions;
    diff.summary.removals = fullDiff.removals;
    diff.summary.modifications = fullDiff.modifications;
    diff.summary.sectionsModified = fullDiff.changeCount > 0 ? 1 : 0;
  }

  return diff;
}

function calculateSectionDiff(original, tailored, sectionInfo = null) {
  const changes = [];
  const originalLines = original.split('\n');
  const tailoredLines = tailored.split('\n');
  
  const maxLines = Math.max(originalLines.length, tailoredLines.length);
  let additions = 0;
  let removals = 0;
  let modifications = 0;

  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || '';
    const tailoredLine = tailoredLines[i] || '';

    if (originalLine === tailoredLine) {
      continue;
    } else if (!originalLine && tailoredLine) {
      changes.push({
        type: 'add',
        lineNumber: i + 1,
        content: tailoredLine,
        originalContent: null
      });
      additions++;
    } else if (originalLine && !tailoredLine) {
      changes.push({
        type: 'remove',
        lineNumber: i + 1,
        content: originalLine,
        originalContent: originalLine
      });
      removals++;
    } else {
      changes.push({
        type: 'modify',
        lineNumber: i + 1,
        content: tailoredLine,
        originalContent: originalLine
      });
      modifications++;
    }
  }

  return {
    ...(sectionInfo && { id: sectionInfo.id, type: sectionInfo.type, title: sectionInfo.title }),
    locked: sectionInfo?.locked || false,
    changes,
    changeCount: additions + removals + modifications,
    additions,
    removals,
    modifications,
    originalContent: original,
    tailoredContent: tailored
  };
}
