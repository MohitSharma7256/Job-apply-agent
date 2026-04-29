import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock data for applications - replace with actual database logic
    const mockApplications = [
      {
        id: 1,
        company: "Tech Corp",
        position: "Senior Frontend Developer",
        platform: "LinkedIn",
        status: "applied",
        appliedAt: new Date().toISOString(),
        matchScore: 8.5,
        location: "Remote",
        salary: "$120k - $150k"
      },
      {
        id: 2,
        company: "StartupXYZ",
        position: "React Developer",
        platform: "Naukri",
        status: "interview",
        appliedAt: new Date(Date.now() - 86400000).toISOString(),
        matchScore: 7.8,
        location: "Bangalore",
        salary: "$80k - $100k"
      },
      {
        id: 3,
        company: "Enterprise Inc",
        position: "Full Stack Engineer",
        platform: "Indeed",
        status: "pending",
        appliedAt: new Date(Date.now() - 172800000).toISOString(),
        matchScore: 9.2,
        location: "Hybrid",
        salary: "$130k - $160k"
      }
    ];

    const filter = 'all'; // Default filter

    let filteredApplications = mockApplications;
    
    if (filter !== 'all') {
      filteredApplications = mockApplications.filter(app => app.status === filter);
    }

    return NextResponse.json({
      success: true,
      applications: filteredApplications,
      total: mockApplications.length
    });

  } catch (error) {
    console.error('Sheet API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load applications'
    }, { status: 500 });
  }
}
