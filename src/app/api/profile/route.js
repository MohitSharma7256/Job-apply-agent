import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock profile data - replace with actual database logic
    const mockProfile = {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+91 9876543210",
      location: "Bangalore, India",
      resumeUrl: "",
      resumeText: "",
      skills: ["React", "Node.js", "TypeScript", "Python"],
      experience: 5,
      education: "Bachelor of Engineering",
      targetRoles: ["Senior Developer", "Tech Lead"],
      targetLocations: ["Bangalore", "Remote"],
      targetSalary: 1500000,
      experienceLevel: "mid",
      preferredJobTypes: ["full-time"]
    };

    return NextResponse.json({
      success: true,
      profile: mockProfile
    });

  } catch (error) {
    console.error('Profile API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load profile'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const profileData = await request.json();
    
    // Mock save logic - replace with actual database save
    console.log('Saving profile:', profileData);

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully'
    });

  } catch (error) {
    console.error('Profile Save Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save profile'
    }, { status: 500 });
  }
}
