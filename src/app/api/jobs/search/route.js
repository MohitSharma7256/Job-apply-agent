import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { keywords, locations, platforms, maxResults, profile } = await request.json();

    // Mock search results for now
    const mockJobs = [
      {
        id: '1',
        title: 'Senior Frontend Developer',
        company: 'Tech Corp',
        location: 'Remote',
        platform: 'linkedin',
        description: 'Looking for experienced frontend developer...',
        skills: ['React', 'TypeScript', 'CSS'],
        matchScore: 8.5,
        postedDate: new Date().toISOString(),
        applied: false
      }
    ];

    return NextResponse.json({
      success: true,
      jobs: mockJobs,
      matchedCount: mockJobs.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
