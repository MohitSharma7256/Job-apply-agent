import { aiService } from './aiService.js';

class ResumeBuilderService {
  constructor() {
    this.templates = {
      modern: {
        sections: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
        style: 'clean',
        format: 'chronological'
      },
      technical: {
        sections: ['personal', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
        style: 'technical',
        format: 'skills-first'
      },
      executive: {
        sections: ['personal', 'executive_summary', 'experience', 'achievements', 'education', 'leadership'],
        style: 'professional',
        format: 'achievement-focused'
      }
    };
  }

  // Generate tailored resume based on job description
  async generateTailoredResume(userProfile, jobDescription, template = 'modern') {
    try {
      const selectedTemplate = this.templates[template] || this.templates.modern;
      
      // Analyze job requirements
      const jobAnalysis = await this.analyzeJobRequirements(jobDescription);
      
      // Generate tailored content for each section
      const tailoredSections = {};
      
      for (const section of selectedTemplate.sections) {
        tailoredSections[section] = await this.generateSectionContent(
          section, 
          userProfile, 
          jobAnalysis,
          jobDescription
        );
      }

      // Structure the complete resume
      const resume = {
        template: template,
        sections: tailoredSections,
        metadata: {
          jobTitle: jobAnalysis.title,
          targetCompany: jobAnalysis.company,
          matchScore: jobAnalysis.matchScore,
          generatedAt: new Date().toISOString(),
          keywords: jobAnalysis.keywords
        }
      };

      return {
        success: true,
        resume,
        analysis: jobAnalysis
      };

    } catch (error) {
      console.error('Resume generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analyze job requirements using AI
  async analyzeJobRequirements(jobDescription) {
    const analysisPrompt = `
      Analyze this job description and extract:
      1. Job title and level
      2. Required skills (technical and soft)
      3. Experience requirements
      4. Key responsibilities
      5. Company culture indicators
      6. Must-have vs nice-to-have qualifications
      
      Job Description: ${jobDescription}
      
      Return as JSON with these fields:
      {
        "title": "",
        "level": "",
        "skills": {"required": [], "preferred": []},
        "experience": "",
        "responsibilities": [],
        "culture": [],
        "keywords": []
      }
    `;

    try {
      const response = await aiService.analyzeJobDescription(analysisPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Job analysis error:', error);
      return this.fallbackJobAnalysis(jobDescription);
    }
  }

  // Fallback job analysis
  fallbackJobAnalysis(jobDescription) {
    return {
      title: 'Position',
      level: 'Mid',
      skills: { required: [], preferred: [] },
      experience: '3+ years',
      responsibilities: [],
      culture: [],
      keywords: []
    };
  }

  // Generate content for specific resume section
  async generateSectionContent(section, userProfile, jobAnalysis, jobDescription) {
    switch (section) {
      case 'personal':
        return this.formatPersonalInfo(userProfile);
      
      case 'summary':
      case 'executive_summary':
        return await this.generateSummary(userProfile, jobAnalysis, jobDescription);
      
      case 'experience':
        return await this.tailorExperience(userProfile.experience || [], jobAnalysis);
      
      case 'education':
        return this.formatEducation(userProfile.education || []);
      
      case 'skills':
        return await this.tailorSkills(userProfile.skills || [], jobAnalysis);
      
      case 'projects':
        return await this.tailorProjects(userProfile.projects || [], jobAnalysis);
      
      case 'certifications':
        return this.formatCertifications(userProfile.certifications || []);
      
      case 'achievements':
        return await this.extractAchievements(userProfile.experience || [], jobAnalysis);
      
      case 'leadership':
        return await this.extractLeadershipExperience(userProfile.experience || [], jobAnalysis);
      
      default:
        return {};
    }
  }

  // Format personal information
  formatPersonalInfo(userProfile) {
    return {
      name: userProfile.name || '',
      email: userProfile.email || '',
      phone: userProfile.phone || '',
      location: userProfile.location || '',
      linkedin: userProfile.linkedin || '',
      github: userProfile.github || '',
      portfolio: userProfile.portfolio || ''
    };
  }

  // Generate AI-powered summary
  async generateSummary(userProfile, jobAnalysis, jobDescription) {
    const prompt = `
      Write a compelling professional summary that highlights the candidate's qualifications for this specific role.
      
      Candidate Profile:
      ${JSON.stringify(userProfile)}
      
      Job Requirements:
      ${JSON.stringify(jobAnalysis)}
      
      Job Description:
      ${jobDescription}
      
      Guidelines:
      - Start with a strong opening statement
      - Highlight 3-4 key qualifications that match the job
      - Include relevant achievements with metrics
      - Keep it concise (3-4 sentences max)
      - Use professional, confident tone
      - Incorporate keywords from the job description
      
      Return only the summary text.
    `;

    try {
      const summary = await aiService.tailorResume(
        userProfile.resumeText || '',
        jobDescription
      );
      return { content: summary };
    } catch (error) {
      return { content: 'Experienced professional with relevant skills and expertise.' };
    }
  }

  // Tailor experience section
  async tailorExperience(experience, jobAnalysis) {
    const tailoredExperience = [];
    for (const exp of experience) {
      const tailoredDescription = await this.tailorExperienceDescription(exp, jobAnalysis);
      tailoredExperience.push({
        ...exp,
        description: tailoredDescription,
        highlighted: this.isRelevantExperience(exp, jobAnalysis)
      });
    }
    return tailoredExperience;
  }

  // Tailor individual experience description
  async tailorExperienceDescription(exp, jobAnalysis) {
    const prompt = `
      Rewrite this job description to emphasize skills and achievements relevant to the target role.
      
      Original Experience:
      ${JSON.stringify(exp)}
      
      Target Job Requirements:
      ${JSON.stringify(jobAnalysis)}
      
      Guidelines:
      - Emphasize achievements with metrics
      - Highlight skills that match the job requirements
      - Use action verbs
      - Keep it concise and impactful
      - Incorporate relevant keywords
      
      Return the rewritten description.
    `;

    try {
      const tailored = await aiService.tailorResume(exp.description || '', JSON.stringify(jobAnalysis));
      return tailored;
    } catch (error) {
      return exp.description || '';
    }
  }

  // Check if experience is relevant
  isRelevantExperience(exp, jobAnalysis) {
    const expSkills = (exp.skills || []).map(s => s.toLowerCase());
    const requiredSkills = (jobAnalysis.skills?.required || []).map(s => s.toLowerCase());
    
    const matches = expSkills.filter(skill => 
      requiredSkills.some(req => skill.includes(req) || req.includes(skill))
    );
    
    return matches.length >= 2;
  }

  // Format education section
  formatEducation(education) {
    return education.map(edu => ({
      ...edu,
        gpa: edu.gpa || null,
        honors: edu.honors || []
    }));
  }

  // Tailor skills section
  async tailorSkills(userSkills, jobAnalysis) {
    const requiredSkills = jobAnalysis.skills?.required || [];
    const preferredSkills = jobAnalysis.skills?.preferred || [];
    
    // Categorize skills by relevance
    const categorized = {
      required: [],
      preferred: [],
      additional: []
    };

    userSkills.forEach(skill => {
      const skillName = typeof skill === 'string' ? skill : skill.name;
      
      if (requiredSkills.some(req => skillName.toLowerCase().includes(req.toLowerCase()))) {
        categorized.required.push(skill);
      } else if (preferredSkills.some(pref => skillName.toLowerCase().includes(pref.toLowerCase()))) {
        categorized.preferred.push(skill);
      } else {
        categorized.additional.push(skill);
      }
    });

    return categorized;
  }

  // Tailor projects section
  async tailorProjects(projects, jobAnalysis) {
    const tailoredProjects = [];
    for (const project of projects) {
      const tailoredDescription = await this.tailorProjectDescription(project, jobAnalysis);
      tailoredProjects.push({
        ...project,
        relevance: this.calculateProjectRelevance(project, jobAnalysis),
        description: tailoredDescription
      });
    }
    return tailoredProjects;
  }

  // Calculate project relevance score
  calculateProjectRelevance(project, jobAnalysis) {
    const projectSkills = (project.technologies || []).map(t => t.toLowerCase());
    const requiredSkills = (jobAnalysis.skills?.required || []).map(s => s.toLowerCase());
    
    const matches = projectSkills.filter(skill => 
      requiredSkills.some(req => skill.includes(req) || req.includes(skill))
    );
    
    return matches.length / Math.max(requiredSkills.length, 1);
  }

  // Tailor project description
  async tailorProjectDescription(project, jobAnalysis) {
    const prompt = `
      Rewrite this project description to highlight technologies and achievements relevant to the target role.
      
      Project: ${JSON.stringify(project)}
      Job Requirements: ${JSON.stringify(jobAnalysis)}
      
      Return the improved description.
    `;

    try {
      const tailored = await aiService.tailorResume(project.description || '', JSON.stringify(jobAnalysis));
      return tailored;
    } catch (error) {
      return project.description || '';
    }
  }

  // Format certifications
  formatCertifications(certifications) {
    return certifications.map(cert => ({
      ...cert,
      expiry: cert.expiry || null,
      verified: cert.verified || false
    }));
  }

  // Extract achievements from experience
  async extractAchievements(experience, jobAnalysis) {
    const achievements = [];
    
    for (const exp of experience) {
      if (exp.achievements) {
        achievements.push(...exp.achievements.map(ach => ({
          ...ach,
          company: exp.company,
          period: exp.period,
          relevance: this.calculateAchievementRelevance(ach, jobAnalysis)
        })));
      }
    }
    
    return achievements.sort((a, b) => b.relevance - a.relevance);
  }

  // Calculate achievement relevance
  calculateAchievementRelevance(achievement, jobAnalysis) {
    const text = (achievement.description || '').toLowerCase();
    const keywords = jobAnalysis.keywords || [];
    
    const matches = keywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    return matches.length / Math.max(keywords.length, 1);
  }

  // Extract leadership experience
  async extractLeadershipExperience(experience, jobAnalysis) {
    const leadershipExperiences = experience.filter(exp => 
      exp.leadership || 
      exp.management || 
      exp.title.toLowerCase().includes('lead') ||
      exp.title.toLowerCase().includes('manager') ||
      exp.title.toLowerCase().includes('director')
    );
    
    const tailoredLeadership = [];
    for (const exp of leadershipExperiences) {
      const highlights = await this.extractLeadershipHighlights(exp, jobAnalysis);
      tailoredLeadership.push({
        ...exp,
        leadershipHighlights: highlights
      });
    }
    return tailoredLeadership;
  }

  // Extract leadership highlights
  async extractLeadershipHighlights(exp, jobAnalysis) {
    const prompt = `
      Extract 2-3 key leadership achievements from this experience relevant to the target role.
      
      Experience: ${JSON.stringify(exp)}
      Job Requirements: ${JSON.stringify(jobAnalysis)}
      
      Return as a JSON array of achievement descriptions.
    `;

    try {
      const response = await aiService.tailorResume(JSON.stringify(exp), JSON.stringify(jobAnalysis));
      return JSON.parse(response);
    } catch (error) {
      return [];
    }
  }

  // Generate cover letter
  async generateCoverLetter(userProfile, jobDescription, jobAnalysis) {
    try {
      const prompt = `
        Write a compelling cover letter for this job application.
        
        Candidate Profile: ${JSON.stringify(userProfile)}
        Job Description: ${jobDescription}
        Job Analysis: ${JSON.stringify(jobAnalysis)}
        
        Guidelines:
        - Address the hiring manager directly
        - Start with a strong opening that shows enthusiasm
        - Connect 2-3 key qualifications to the job requirements
        - Include a specific achievement with metrics
        - Show knowledge of the company
        - End with a clear call to action
        - Keep it professional yet conversational
        - Maximum 250 words
        
        Return the complete cover letter.
      `;

      const coverLetter = await aiService.generateCoverLetter(
        userProfile.resumeText || '',
        jobDescription
      );

      return {
        success: true,
        content: coverLetter,
        metadata: {
          targetCompany: jobAnalysis.company,
          targetTitle: jobAnalysis.title,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Cover letter generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Export resume to different formats
  async exportResume(resume, format = 'json') {
    switch (format) {
      case 'json':
        return resume;
      
      case 'markdown':
        return this.convertToMarkdown(resume);
      
      case 'html':
        return this.convertToHTML(resume);
      
      case 'pdf':
        // This would require a PDF generation library
        return { success: false, error: 'PDF export not implemented yet' };
      
      default:
        return resume;
    }
  }

  // Convert resume to markdown
  convertToMarkdown(resume) {
    let markdown = `# ${resume.sections.personal?.name || 'Resume'}\n\n`;
    
    // Contact info
    if (resume.sections.personal) {
      const { name, email, phone, location, linkedin, github } = resume.sections.personal;
      markdown += `${email} | ${phone} | ${location}\n`;
      if (linkedin) markdown += `LinkedIn: ${linkedin}\n`;
      if (github) markdown += `GitHub: ${github}\n`;
      markdown += '\n';
    }

    // Summary
    if (resume.sections.summary) {
      markdown += `## Summary\n${resume.sections.summary.content}\n\n`;
    }

    // Experience
    if (resume.sections.experience) {
      markdown += '## Experience\n\n';
      resume.sections.experience.forEach(exp => {
        markdown += `**${exp.title}** at ${exp.company} (${exp.period})\n`;
        markdown += `${exp.description}\n\n`;
      });
    }

    // Education
    if (resume.sections.education) {
      markdown += '## Education\n\n';
      resume.sections.education.forEach(edu => {
        markdown += `**${edu.degree}** from ${edu.institution} (${edu.year})\n`;
        if (edu.gpa) markdown += `GPA: ${edu.gpa}\n`;
        markdown += '\n';
      });
    }

    // Skills
    if (resume.sections.skills) {
      markdown += '## Skills\n\n';
      const { required, preferred, additional } = resume.sections.skills;
      
      if (required.length > 0) {
        markdown += '**Required Skills:** ' + required.join(', ') + '\n';
      }
      if (preferred.length > 0) {
        markdown += '**Preferred Skills:** ' + preferred.join(', ') + '\n';
      }
      if (additional.length > 0) {
        markdown += '**Additional Skills:** ' + additional.join(', ') + '\n';
      }
      markdown += '\n';
    }

    return markdown;
  }

  // Convert resume to HTML
  convertToHTML(resume) {
    // Basic HTML conversion - could be enhanced with CSS
    let html = '<div class="resume">\n';
    
    // Personal info
    if (resume.sections.personal) {
      const { name, email, phone, location } = resume.sections.personal;
      html += `<header>\n<h1>${name}</h1>\n<p>${email} | ${phone} | ${location}</p>\n</header>\n`;
    }

    // Summary
    if (resume.sections.summary) {
      html += `<section>\n<h2>Summary</h2>\n<p>${resume.sections.summary.content}</p>\n</section>\n`;
    }

    // Experience
    if (resume.sections.experience) {
      html += '<section>\n<h2>Experience</h2>\n';
      resume.sections.experience.forEach(exp => {
        html += `<div class="experience">\n<h3>${exp.title}</h3>\n<p><strong>${exp.company}</strong> (${exp.period})</p>\n<p>${exp.description}</p>\n</div>\n`;
      });
      html += '</section>\n';
    }

    html += '</div>';
    return html;
  }
}

export const resumeBuilderService = new ResumeBuilderService();
