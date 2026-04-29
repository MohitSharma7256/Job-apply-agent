import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock stats data - replace with actual database logic
    const mockStats = {
      totalApplications: 156,
      todayApplications: 12,
      weeklyApplications: 45,
      monthlyApplications: 156,
      interviewScheduled: 8,
      offersReceived: 3,
      successRate: 87.5,
      platforms: {
        linkedin: 45,
        naukri: 38,
        indeed: 29,
        apna: 22,
        internshala: 15,
        greenhouse: 7
      },
      statusBreakdown: {
        applied: 89,
        interview: 34,
        offer: 8,
        rejected: 25
      },
      topSkills: [
        { skill: "React", count: 45 },
        { skill: "Node.js", count: 38 },
        { skill: "TypeScript", count: 32 },
        { skill: "Python", count: 28 },
        { skill: "AWS", count: 22 }
      ]
    };

    return NextResponse.json({
      success: true,
      stats: mockStats
    });

  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load stats'
    }, { status: 500 });
  }
}
