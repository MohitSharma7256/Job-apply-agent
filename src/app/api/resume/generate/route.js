import { NextResponse } from 'next/server';
import { resumeBuilderService } from '@/services/resumeBuilderService';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { userProfile, jobDescription, template = 'modern' } = await request.json();

    if (!userProfile || !jobDescription) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile and job description are required' 
      }, { status: 400 });
    }

    // Generate tailored resume
    const resumeResult = await resumeBuilderService.generateTailoredResume(
      userProfile, 
      jobDescription, 
      template
    );

    if (!resumeResult.success) {
      return NextResponse.json({
        success: false,
        error: resumeResult.error
      }, { status: 500 });
    }

    // Generate cover letter as well
    const coverLetterResult = await resumeBuilderService.generateCoverLetter(
      userProfile,
      jobDescription,
      resumeResult.analysis
    );

    return NextResponse.json({
      success: true,
      resume: resumeResult.resume,
      coverLetter: coverLetterResult.success ? coverLetterResult.content : null,
      analysis: resumeResult.analysis,
      templates: ['modern', 'technical', 'executive']
    });

  } catch (error) {
    console.error('Resume generation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Return available templates and options
    const templates = {
      modern: {
        name: 'Modern Clean',
        description: 'Clean, chronological format suitable for most roles',
        sections: ['personal', 'summary', 'experience', 'education', 'skills', 'projects']
      },
      technical: {
        name: 'Technical Skills-First',
        description: 'Skills-focused format for technical positions',
        sections: ['personal', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications']
      },
      executive: {
        name: 'Executive Professional',
        description: 'Achievement-focused format for senior positions',
        sections: ['personal', 'executive_summary', 'experience', 'achievements', 'education', 'leadership']
      }
    };

    return NextResponse.json({
      success: true,
      templates,
      features: [
        'AI-powered content tailoring',
        'Multiple template options',
        'Skills matching and highlighting',
        'Experience relevance scoring',
        'Cover letter generation',
        'Export to multiple formats (JSON, Markdown, HTML)'
      ]
    });

  } catch (error) {
    console.error('Resume options error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
