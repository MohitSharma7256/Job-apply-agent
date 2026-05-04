import { NextResponse } from 'next/server';
import { jobScoringService } from '../../../../services/jobScoringService';

export async function POST(request) {
  try {
    const { keywords, locations, platforms, maxResults, profile } = await request.json();

    // Enhanced mock search results with more details
    const mockJobs = [
      {
        id: '1',
        title: 'Senior Frontend Developer',
        company: 'Tech Corp',
        location: 'Remote',
        platform: 'linkedin',
        description: 'Looking for experienced frontend developer with React and TypeScript skills...',
        skills: ['React', 'TypeScript', 'CSS', 'Node.js'],
        experienceLevel: 'senior',
        salary: '$120k - $150k',
        companySize: 'medium',
        postedDate: new Date().toISOString(),
        applied: false
      },
      {
        id: '2',
        title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        location: 'Bangalore',
        platform: 'naukri',
        description: 'Join our team as a full stack engineer working with modern tech stack...',
        skills: ['JavaScript', 'Python', 'Docker', 'AWS'],
        experienceLevel: 'mid',
        salary: '$80k - $100k',
        companySize: 'small',
        postedDate: new Date(Date.now() - 86400000).toISOString(),
        applied: false
      },
      {
        id: '3',
        title: 'React Developer',
        company: 'Enterprise Inc',
        location: 'Hybrid',
        platform: 'indeed',
        description: 'Seeking talented React developer for enterprise applications...',
        skills: ['React', 'Redux', 'GraphQL', 'Jest'],
        experienceLevel: 'mid',
        salary: '$100k - $130k',
        companySize: 'large',
        postedDate: new Date(Date.now() - 172800000).toISOString(),
        applied: false
      }
    ];

    // Score all jobs using AIHawk-inspired scoring system
    const scoredJobs = await jobScoringService.scoreMultipleJobs(mockJobs, profile);

    // Filter by minimum suitability score
    const qualifiedJobs = jobScoringService.filterJobsByScore(scoredJobs);

    // Apply application limits
    const limitedJobs = qualifiedJobs.slice(0, maxResults || 10);

    return NextResponse.json({
      success: true,
      jobs: limitedJobs,
      matchedCount: qualifiedJobs.length,
      qualifiedCount: qualifiedJobs.length,
      scoringStats: {
        averageScore: qualifiedJobs.reduce((sum, job) => sum + job.score, 0) / qualifiedJobs.length || 0,
        highMatchCount: qualifiedJobs.filter(job => job.score >= 8).length,
        mediumMatchCount: qualifiedJobs.filter(job => job.score >= 6 && job.score < 8).length
      }
    });
  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
