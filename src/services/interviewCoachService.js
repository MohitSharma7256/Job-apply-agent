class InterviewCoachService {
  constructor() {
    this.systemDesignCases = [
      'url-shortener',
      'real-time-chat', 
      'news-feed',
      'video-streaming',
      'ride-sharing',
      'photo-sharing',
      'search-autocomplete',
      'distributed-cache',
      'rate-limiter',
      'ecommerce',
      'payment-processing',
      'notification-system',
      'file-storage'
    ];

    this.difficultyLevels = {
      easy: 'Junior/Entry level',
      medium: 'Mid-level (2-5 years)',
      hard: 'Senior/Staff level',
      expert: 'Principal/Lead level'
    };

    this.questionCategories = {
      behavioral: 'Behavioral Questions',
      technical: 'Technical Questions', 
      system_design: 'System Design',
      coding: 'Coding Problems',
      cultural: 'Cultural Fit'
    };
  }

  // Start interview session
  async startInterviewSession(options) {
    try {
      const {
        company,
        role,
        difficulty = 'medium',
        type = 'technical',
        focus = 'general'
      } = options;

      // Generate tailored questions
      const questions = await this.generateInterviewQuestions({
        company,
        role,
        difficulty,
        type,
        focus
      });

      // Create session
      const session = {
        id: this.generateSessionId(),
        company,
        role,
        difficulty,
        type,
        focus,
        questions,
        currentQuestionIndex: 0,
        responses: [],
        startTime: new Date().toISOString(),
        status: 'active'
      };

      return {
        success: true,
        session,
        currentQuestion: questions[0],
        instructions: this.getInterviewInstructions(type, difficulty)
      };

    } catch (error) {
      console.error('Interview session error:', error);
      return {
        success: false,
        error: 'Unable to start interview session'
      };
    }
  }

  // Continue interview session
  async continueInterviewSession(session, userResponse) {
    try {
      // Evaluate current response
      const evaluation = await this.evaluateResponse(
        session.questions[session.currentQuestionIndex],
        userResponse,
        session
      );

      // Add to responses
      session.responses.push({
        question: session.questions[session.currentQuestionIndex],
        userResponse,
        evaluation,
        timestamp: new Date().toISOString()
      });

      // Move to next question
      session.currentQuestionIndex++;

      // Check if session is complete
      const isComplete = session.currentQuestionIndex >= session.questions.length;
      
      if (isComplete) {
        session.status = 'completed';
        session.endTime = new Date().toISOString();
        
        // Generate final feedback
        const finalFeedback = await this.generateFinalFeedback(session);
        
        return {
          success: true,
          session,
          isComplete: true,
          finalFeedback,
          recommendations: this.generateRecommendations(session)
        };
      } else {
        return {
          success: true,
          session,
          isComplete: false,
          currentQuestion: session.questions[session.currentQuestionIndex],
          evaluation
        };
      }

    } catch (error) {
      console.error('Continue session error:', error);
      return {
        success: false,
        error: 'Unable to continue interview session'
      };
    }
  }

  // Get interview feedback
  async getInterviewFeedback(session) {
    try {
      if (session.responses.length === 0) {
        return {
          success: false,
          error: 'No responses to evaluate'
        };
      }

      const feedback = {
        overallScore: 0,
        categoryScores: {},
        strengths: [],
        improvements: [],
        detailedFeedback: []
      };

      // Calculate scores by category
      const categoryScores = {};
      session.responses.forEach(response => {
        const category = response.question.category || 'general';
        if (!categoryScores[category]) {
          categoryScores[category] = [];
        }
        categoryScores[category].push(response.evaluation.score);
      });

      // Average scores by category
      Object.keys(categoryScores).forEach(category => {
        const scores = categoryScores[category];
        feedback.categoryScores[category] = 
          Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      });

      // Overall score
      const allScores = session.responses.map(r => r.evaluation.score);
      feedback.overallScore = Math.round(
        allScores.reduce((a, b) => a + b, 0) / allScores.length
      );

      // Identify strengths and improvements
      session.responses.forEach(response => {
        if (response.evaluation.score >= 80) {
          feedback.strengths.push({
            question: response.question.question,
            reason: response.evaluation.strengths?.[0] || 'Strong response'
          });
        } else if (response.evaluation.score < 60) {
          feedback.improvements.push({
            question: response.question.question,
            suggestion: response.evaluation.improvements?.[0] || 'Needs improvement'
          });
        }
      });

      // Generate detailed feedback
      feedback.detailedFeedback = session.responses.map(response => ({
        question: response.question.question,
        userResponse: response.userResponse,
        score: response.evaluation.score,
        feedback: response.evaluation.feedback,
        modelAnswer: response.question.modelAnswer
      }));

      return {
        success: true,
        feedback,
        grade: this.getGrade(feedback.overallScore),
        nextSteps: this.getNextSteps(feedback)
      };

    } catch (error) {
      console.error('Feedback error:', error);
      return {
        success: false,
        error: 'Unable to generate feedback'
      };
    }
  }

  // List interview cases
  listInterviewCases() {
    return {
      systemDesign: this.systemDesignCases.map(caseName => ({
        name: caseName,
        description: this.getCaseDescription(caseName),
        difficulty: 'medium',
        duration: '45-60 minutes',
        components: ['requirements', 'architecture', 'scaling', 'trade-offs']
      })),
      coding: [
        { name: 'array-manipulation', difficulty: 'easy', duration: '30 minutes' },
        { name: 'string-algorithms', difficulty: 'medium', duration: '45 minutes' },
        { name: 'tree-traversal', difficulty: 'medium', duration: '45 minutes' },
        { name: 'dynamic-programming', difficulty: 'hard', duration: '60 minutes' }
      ],
      behavioral: [
        { name: 'conflict-resolution', difficulty: 'easy', duration: '15 minutes' },
        { name: 'leadership-experience', difficulty: 'medium', duration: '20 minutes' },
        { name: 'project-failure', difficulty: 'medium', duration: '20 minutes' }
      ]
    };
  }

  // Start system design interview
  async startSystemDesign(caseName, difficulty = 'medium') {
    try {
      const caseDetails = this.getSystemDesignCase(caseName);
      const questions = await this.generateSystemDesignQuestions(caseName, difficulty);

      return {
        success: true,
        case: caseDetails,
        questions,
        instructions: this.getSystemDesignInstructions(),
        estimatedDuration: caseDetails.duration
      };

    } catch (error) {
      console.error('System design error:', error);
      return {
        success: false,
        error: 'Unable to start system design interview'
      };
    }
  }

  // Get behavioral questions
  async getBehavioralQuestions(role, company) {
    try {
      const prompt = `
        Generate 5 behavioral interview questions for a ${role} position at ${company}.
        
        Guidelines:
        - Use STAR method format
        - Focus on relevant competencies
        - Include situational questions
        - Make them company-specific if possible
        
        Return as JSON array with question, category, and evaluation criteria.
      `;

      const questions = await aiService.analyzeJobDescription(prompt);
      
      return {
        success: true,
        questions: JSON.parse(questions),
        tips: this.getBehavioralQuestionTips()
      };

    } catch (error) {
      console.error('Behavioral questions error:', error);
      return {
        success: false,
        error: 'Unable to generate behavioral questions'
      };
    }
  }

  // Save story to bank
  async saveStoryToBank(story, category, tags = []) {
    try {
      const storyEntry = {
        id: this.generateStoryId(),
        story,
        category,
        tags,
        createdAt: new Date().toISOString(),
        usage: 0
      };

      // In a real implementation, this would save to database
      // For now, return success
      return {
        success: true,
        storyEntry,
        message: 'Story saved to interview bank'
      };

    } catch (error) {
      console.error('Save story error:', error);
      return {
        success: false,
        error: 'Unable to save story'
      };
    }
  }

  // Get interview questions
  async getInterviewQuestions(options) {
    try {
      const { company, role, difficulty, type, focus } = options;
      
      const prompt = `
        Generate 5 interview questions for ${role} at ${company}.
        
        Type: ${type}
        Difficulty: ${difficulty}
        Focus: ${focus}
        
        For each question provide:
        - The question
        - Category
        - Expected answer length
        - Key evaluation points
        - Model answer
        
        Return as JSON array.
      `;

      const questions = await aiService.analyzeJobDescription(prompt);
      
      return {
        success: true,
        questions: JSON.parse(questions)
      };

    } catch (error) {
      console.error('Get questions error:', error);
      return {
        success: false,
        error: 'Unable to generate questions'
      };
    }
  }

  // Helper methods
  async generateInterviewQuestions(options) {
    const { company, role, difficulty, type, focus } = options;
    
    const prompt = `
      Generate 5 tailored interview questions for:
      Company: ${company}
      Role: ${role}
      Difficulty: ${difficulty}
      Type: ${type}
      Focus: ${focus}
      
      For each question include:
      - question: The actual question
      - category: behavioral/technical/system_design/coding
      - evaluationCriteria: What to look for
      - modelAnswer: Example of a great answer
      - timeLimit: Suggested time to answer
      
      Return as JSON array.
    `;

    try {
      const response = await aiService.analyzeJobDescription(prompt);
      return JSON.parse(response);
    } catch (error) {
      // Fallback questions
      return this.getFallbackQuestions(type, role);
    }
  }

  async evaluateResponse(question, userResponse, session) {
    try {
      const prompt = `
        Evaluate this interview response:
        
        Question: ${question.question}
        Category: ${question.category}
        User Response: ${userResponse}
        
        Evaluation Criteria: ${question.evaluationCriteria}
        Model Answer: ${question.modelAnswer}
        
        Provide evaluation as JSON with:
        - score (0-100)
        - strengths (array)
        - improvements (array)
        - feedback (detailed feedback)
        - completeness (0-100)
        - clarity (0-100)
        - relevance (0-100)
      `;

      const evaluation = await aiService.analyzeJobDescription(prompt);
      return JSON.parse(evaluation);

    } catch (error) {
      // Fallback evaluation
      return {
        score: 70,
        strengths: ['Attempted the question'],
        improvements: ['Could be more detailed'],
        feedback: 'Response received but needs improvement',
        completeness: 60,
        clarity: 70,
        relevance: 80
      };
    }
  }

  async generateFinalFeedback(session) {
    const totalScore = session.responses.reduce((sum, r) => sum + r.evaluation.score, 0) / session.responses.length;
    
    return {
      overallScore: Math.round(totalScore),
      grade: this.getGrade(totalScore),
      strengths: this.identifyOverallStrengths(session),
      improvements: this.identifyOverallImprovements(session),
      readiness: this.assessInterviewReadiness(session),
      nextSteps: this.getNextSteps({ overallScore: totalScore })
    };
  }

  getFallbackQuestions(type, role) {
    const fallbacks = {
      technical: [
        {
          question: `Tell me about your most challenging ${role} project`,
          category: 'technical',
          evaluationCriteria: 'Technical depth, problem-solving',
          modelAnswer: 'Describes complex problem with technical solution',
          timeLimit: '5 minutes'
        }
      ],
      behavioral: [
        {
          question: 'Tell me about a time you had to deal with a difficult team member',
          category: 'behavioral',
          evaluationCriteria: 'Conflict resolution, communication',
          modelAnswer: 'Uses STAR method, shows professional approach',
          timeLimit: '3 minutes'
        }
      ]
    };

    return fallbacks[type] || fallbacks.behavioral;
  }

  getInterviewInstructions(type, difficulty) {
    const baseInstructions = [
      'Answer each question thoughtfully',
      'Use the STAR method for behavioral questions',
      'Be specific and provide examples',
      'Ask for clarification if needed'
    ];

    const typeSpecific = {
      technical: [
        'Focus on technical details',
        'Explain your thought process',
        'Discuss trade-offs and alternatives'
      ],
      behavioral: [
        'Use specific examples from your experience',
        'Focus on your role and actions',
        'Highlight the outcome and learning'
      ],
      system_design: [
        'Think aloud during the design process',
        'Consider scalability and reliability',
        'Discuss trade-offs openly'
      ]
    };

    return [
      ...baseInstructions,
      ...(typeSpecific[type] || []),
      `Difficulty: ${this.difficultyLevels[difficulty]}`
    ];
  }

  getSystemDesignInstructions() {
    return [
      'Think aloud during your design process',
      'Start with requirements clarification',
      'Consider constraints and assumptions',
      'Design for scale and reliability',
      'Discuss trade-offs and alternatives',
      'Consider edge cases and failure scenarios'
    ];
  }

  getBehavioralQuestionTips() {
    return [
      'Use the STAR method: Situation, Task, Action, Result',
      'Be specific and quantify your impact',
      'Focus on your individual contributions',
      'Show learning and growth',
      'Keep answers concise (2-3 minutes)'
    ];
  }

  getGrade(score) {
    if (score >= 90) return 'A+ (Excellent)';
    if (score >= 80) return 'A (Strong)';
    if (score >= 70) return 'B (Good)';
    if (score >= 60) return 'C (Fair)';
    return 'D (Needs Improvement)';
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateStoryId() {
    return 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getCaseDescription(caseName) {
    const descriptions = {
      'url-shortener': 'Design a URL shortening service like bit.ly',
      'real-time-chat': 'Design a real-time messaging application',
      'news-feed': 'Design a social media news feed system',
      'video-streaming': 'Design a video streaming platform',
      'ride-sharing': 'Design a ride-sharing application like Uber',
      'photo-sharing': 'Design a photo sharing service like Instagram'
    };

    return descriptions[caseName] || 'Design a scalable system';
  }

  getSystemDesignCase(caseName) {
    return {
      name: caseName,
      description: this.getCaseDescription(caseName),
      requirements: this.getCaseRequirements(caseName),
      constraints: this.getCaseConstraints(caseName),
      duration: '45-60 minutes'
    };
  }

  getCaseRequirements(caseName) {
    const requirements = {
      'url-shortener': [
        'Generate short URLs from long URLs',
        'Redirect short URLs to original URLs',
        'Handle high request volume',
        'Custom short URLs option'
      ],
      'real-time-chat': [
        'Real-time message delivery',
        'Message history',
        'Online status indicators',
        'Group conversations'
      ]
    };

    return requirements[caseName] || ['Basic functionality', 'Scalability', 'Reliability'];
  }

  getCaseConstraints(caseName) {
    return [
      'Low latency (<100ms)',
      'High availability (99.9%)',
      'Handle millions of users',
      'Cost efficiency'
    ];
  }

  async generateSystemDesignQuestions(caseName, difficulty) {
    return [
      {
        question: `What are the key requirements for a ${caseName} system?`,
        category: 'requirements',
        timeLimit: '5 minutes'
      },
      {
        question: 'How would you design the API endpoints?',
        category: 'api-design',
        timeLimit: '10 minutes'
      },
      {
        question: 'What database would you choose and why?',
        category: 'data-storage',
        timeLimit: '10 minutes'
      },
      {
        question: 'How would you handle scalability?',
        category: 'scalability',
        timeLimit: '15 minutes'
      },
      {
        question: 'What are the potential failure points?',
        category: 'reliability',
        timeLimit: '10 minutes'
      }
    ];
  }

  identifyOverallStrengths(session) {
    const strengths = [];
    const highScoringResponses = session.responses.filter(r => r.evaluation.score >= 80);
    
    if (highScoringResponses.length >= 3) {
      strengths.push('Consistently strong responses');
    }
    
    const categories = {};
    highScoringResponses.forEach(r => {
      const category = r.question.category;
      categories[category] = (categories[category] || 0) + 1;
    });
    
    Object.keys(categories).forEach(category => {
      if (categories[category] >= 2) {
        strengths.push(`Strong in ${category} questions`);
      }
    });
    
    return strengths;
  }

  identifyOverallImprovements(session) {
    const improvements = [];
    const lowScoringResponses = session.responses.filter(r => r.evaluation.score < 60);
    
    if (lowScoringResponses.length >= 2) {
      improvements.push('Work on providing more detailed responses');
    }
    
    const categories = {};
    lowScoringResponses.forEach(r => {
      const category = r.question.category;
      categories[category] = (categories[category] || 0) + 1;
    });
    
    Object.keys(categories).forEach(category => {
      if (categories[category] >= 2) {
        improvements.push(`Focus on ${category} questions`);
      }
    });
    
    return improvements;
  }

  assessInterviewReadiness(session) {
    const avgScore = session.responses.reduce((sum, r) => sum + r.evaluation.score, 0) / session.responses.length;
    
    if (avgScore >= 85) return 'Ready for senior-level interviews';
    if (avgScore >= 75) return 'Ready for mid-level interviews';
    if (avgScore >= 65) return 'Ready for junior-level interviews';
    return 'Needs more practice before interviews';
  }

  getNextSteps(feedback) {
    const steps = [];
    
    if (feedback.overallScore < 70) {
      steps.push('Practice more questions in weak areas');
      steps.push('Study model answers for improvement');
    }
    
    if (feedback.overallScore >= 70 && feedback.overallScore < 85) {
      steps.push('Focus on advanced topics');
      steps.push('Practice with time constraints');
    }
    
    if (feedback.overallScore >= 85) {
      steps.push('Ready for real interviews');
      steps.push('Consider mock interviews with peers');
    }
    
    return steps;
  }

  generateRecommendations(session) {
    const recommendations = [];
    const avgScore = session.responses.reduce((sum, r) => sum + r.evaluation.score, 0) / session.responses.length;
    
    if (avgScore < 70) {
      recommendations.push('Practice STAR method for behavioral questions');
      recommendations.push('Study fundamental concepts for technical questions');
    }
    
    if (session.company && session.role) {
      recommendations.push(`Research ${session.company} interview process`);
      recommendations.push(`Prepare ${session.role}-specific questions`);
    }
    
    recommendations.push('Practice with time constraints');
    recommendations.push('Record yourself to improve delivery');
    
    return recommendations;
  }
}

export const interviewCoachService = new InterviewCoachService();
