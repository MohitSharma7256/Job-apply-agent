class MLPredictionService {
  constructor() {
    this.models = {
      jobMatch: null,
      applicationTimeline: null,
      careerTrajectory: null,
      salaryPrediction: null
    };
    
    this.benchmarks = {
      jobMatchBaseline: 0.75, // 75% accuracy baseline
      timelineBaseline: 14, // 14 days average application timeline
      careerBaseline: 0.65, // 65% career path accuracy
      salaryBaseline: 0.85 // 85% salary prediction accuracy
    };

    this.initializeModels();
  }

  // Initialize ML models (simplified for demo)
  async initializeModels() {
    // In production, these would be actual trained models
    // For now, we'll use rule-based and statistical approaches
    console.log('🤖 Initializing ML Prediction Models...');
  }

  // Predict job match probability with ML-style scoring
  async predictJobMatch(userProfile, jobDescription, historicalData = []) {
    try {
      // Feature extraction
      const features = this.extractJobMatchFeatures(userProfile, jobDescription);
      
      // ML-style prediction (simplified)
      const prediction = this.applyJobMatchModel(features, historicalData);
      
      // Calculate confidence intervals
      const confidence = this.calculateConfidence(prediction, features, historicalData);
      
      // Generate explanation
      const explanation = this.generateMatchExplanation(features, prediction);
      
      return {
        success: true,
        prediction: {
          matchProbability: prediction.probability,
          confidence: confidence.score,
          confidenceInterval: confidence.interval,
          features: features,
          explanation: explanation,
          benchmarkComparison: {
            baseline: this.benchmarks.jobMatchBaseline,
            improvement: prediction.probability - this.benchmarks.jobMatchBaseline,
            percentile: this.calculatePercentile(prediction.probability, historicalData)
          }
        }
      };

    } catch (error) {
      console.error('Job match prediction error:', error);
      return {
        success: false,
        error: 'Unable to predict job match'
      };
    }
  }

  // Predict application timeline (ETA-inspired)
  async predictApplicationTimeline(userProfile, jobDetails, marketData = {}) {
    try {
      // Extract timeline features
      const features = this.extractTimelineFeatures(userProfile, jobDetails, marketData);
      
      // Apply timeline prediction model
      const prediction = this.applyTimelineModel(features);
      
      // Calculate risk factors
      const riskFactors = this.calculateTimelineRisks(features);
      
      // Generate recommendations
      const recommendations = this.generateTimelineRecommendations(prediction, riskFactors);
      
      return {
        success: true,
        prediction: {
          estimatedDays: prediction.days,
          confidence: prediction.confidence,
          riskFactors: riskFactors,
          recommendations: recommendations,
          breakdown: {
            screening: prediction.phases.screening,
            technical: prediction.phases.technical,
            interview: prediction.phases.interview,
            offer: prediction.phases.offer
          },
          benchmarkComparison: {
            baseline: this.benchmarks.timelineBaseline,
            faster: prediction.days < this.benchmarks.timelineBaseline,
            marketAverage: marketData.averageDays || this.benchmarks.timelineBaseline
          }
        }
      };

    } catch (error) {
      console.error('Timeline prediction error:', error);
      return {
        success: false,
        error: 'Unable to predict timeline'
      };
    }
  }

  // Predict career trajectory (Crossing-inspired)
  async predictCareerTrajectory(userProfile, careerGoals, marketTrends = {}) {
    try {
      // Extract career features
      const features = this.extractCareerFeatures(userProfile, careerGoals, marketTrends);
      
      // Apply trajectory prediction model
      const trajectory = this.applyCareerModel(features);
      
      // Calculate path probabilities
      const paths = this.calculateCareerPaths(features, trajectory);
      
      // Generate skill recommendations
      const skillGaps = this.identifySkillGaps(features, paths);
      
      return {
        success: true,
        prediction: {
          currentTrajectory: trajectory.current,
          potentialPaths: paths,
          skillGaps: skillGaps,
          timeline: trajectory.timeline,
          confidence: trajectory.confidence,
          marketAlignment: trajectory.marketAlignment,
          benchmarkComparison: {
            baseline: this.benchmarks.careerBaseline,
            growthPotential: trajectory.growthPotential,
            marketDemand: trajectory.marketDemand
          }
        }
      };

    } catch (error) {
      console.error('Career trajectory prediction error:', error);
      return {
        success: false,
        error: 'Unable to predict career trajectory'
      };
    }
  }

  // Predict salary range
  async predictSalary(userProfile, jobDetails, locationData = {}) {
    try {
      // Extract salary features
      const features = this.extractSalaryFeatures(userProfile, jobDetails, locationData);
      
      // Apply salary prediction model
      const prediction = this.applySalaryModel(features);
      
      // Calculate negotiation range
      const negotiation = this.calculateNegotiationRange(prediction);
      
      return {
        success: true,
        prediction: {
          estimatedRange: prediction.range,
          confidence: prediction.confidence,
          negotiationRange: negotiation,
          marketComparison: prediction.marketComparison,
          factors: prediction.factors,
          benchmarkComparison: {
            baseline: this.benchmarks.salaryBaseline,
            marketRate: prediction.marketRate,
            negotiationPower: prediction.negotiationPower
          }
        }
      };

    } catch (error) {
      console.error('Salary prediction error:', error);
      return {
        success: false,
        error: 'Unable to predict salary'
      };
    }
  }

  // Feature extraction methods
  extractJobMatchFeatures(userProfile, jobDescription) {
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
    const jobSkills = this.extractSkillsFromJD(jobDescription).map(s => s.toLowerCase());
    
    // Calculate skill overlap
    const skillOverlap = userSkills.filter(skill => 
      jobSkills.some(jobSkill => skill.includes(jobSkill) || jobSkill.includes(skill))
    ).length / Math.max(userSkills.length, jobSkills.length);

    // Experience match
    const userExp = userProfile.experienceLevel || 'mid';
    const jobExp = this.extractExperienceLevel(jobDescription);
    const experienceMatch = this.calculateExperienceMatch(userExp, jobExp);

    // Location match
    const locationMatch = this.calculateLocationMatch(userProfile.location, jobDescription);

    // Industry match
    const industryMatch = this.calculateIndustryMatch(userProfile.industry, jobDescription);

    return {
      skillOverlap: skillOverlap,
      experienceMatch: experienceMatch,
      locationMatch: locationMatch,
      industryMatch: industryMatch,
      educationLevel: this.getEducationLevel(userProfile.education),
      companySize: this.extractCompanySize(jobDescription),
      remoteFriendly: this.isRemoteFriendly(jobDescription),
      salaryAlignment: this.calculateSalaryAlignment(userProfile.targetSalary, jobDescription)
    };
  }

  extractTimelineFeatures(userProfile, jobDetails, marketData) {
    return {
      applicantLevel: userProfile.experienceLevel || 'mid',
      companySize: jobDetails.companySize || 'medium',
      industry: jobDetails.industry || 'tech',
      location: jobDetails.location || 'remote',
      applicationCount: userProfile.applicationCount || 0,
      responseRate: userProfile.responseRate || 0.5,
      marketDemand: marketData.demandScore || 0.7,
      competitionLevel: marketData.competitionLevel || 'medium',
      seasonality: this.getSeasonalityFactor(),
      economicConditions: marketData.economicConditions || 'stable'
    };
  }

  extractCareerFeatures(userProfile, careerGoals, marketTrends) {
    return {
      currentSkills: userProfile.skills || [],
      experience: userProfile.experience || [],
      education: userProfile.education || [],
      targetRole: careerGoals.targetRole || '',
      targetIndustry: careerGoals.targetIndustry || '',
      timeHorizon: careerGoals.timeHorizon || '5years',
      skillTrends: marketTrends.skillTrends || {},
      industryGrowth: marketTrends.industryGrowth || {},
      automationRisk: marketTrends.automationRisk || {}
    };
  }

  extractSalaryFeatures(userProfile, jobDetails, locationData) {
    return {
      experience: userProfile.experienceLevel || 'mid',
      skills: userProfile.skills || [],
      education: userProfile.education || [],
      location: jobDetails.location || '',
      companySize: jobDetails.companySize || 'medium',
      industry: jobDetails.industry || 'tech',
      locationCostOfLiving: locationData.costOfLiving || 1.0,
      marketRate: locationData.marketRate || 1.0,
      remoteWork: jobDetails.remote || false
    };
  }

  // Model application methods (simplified ML logic)
  applyJobMatchModel(features, historicalData) {
    // Weighted feature combination
    const weights = {
      skillOverlap: 0.35,
      experienceMatch: 0.25,
      locationMatch: 0.15,
      industryMatch: 0.15,
      educationLevel: 0.05,
      salaryAlignment: 0.05
    };

    let score = 0;
    Object.keys(weights).forEach(feature => {
      score += features[feature] * weights[feature];
    });

    // Apply non-linear transformation (sigmoid-like)
    const probability = 1 / (1 + Math.exp(-5 * (score - 0.5)));

    return {
      probability: Math.min(0.95, Math.max(0.05, probability)),
      score: score
    };
  }

  applyTimelineModel(features) {
    // Base timeline by experience level
    const baseTimelines = {
      'entry': 21,
      'junior': 18,
      'mid': 14,
      'senior': 10,
      'lead': 8,
      'principal': 6
    };

    let days = baseTimelines[features.applicantLevel] || 14;

    // Adjust for factors
    if (features.companySize === 'large') days *= 1.3;
    if (features.companySize === 'small') days *= 0.8;
    if (features.remoteFriendly) days *= 0.9;
    if (features.marketDemand > 0.8) days *= 0.7;
    if (features.competitionLevel === 'high') days *= 1.4;

    // Phase breakdown
    const screening = Math.round(days * 0.3);
    const technical = Math.round(days * 0.2);
    const interview = Math.round(days * 0.3);
    const offer = Math.round(days * 0.2);

    return {
      days: Math.round(days),
      confidence: 0.75,
      phases: { screening, technical, interview, offer }
    };
  }

  applyCareerModel(features) {
    // Simplified career trajectory prediction
    const currentScore = this.calculateCareerScore(features);
    const growthPotential = this.calculateGrowthPotential(features);
    
    return {
      current: currentScore,
      confidence: 0.70,
      growthPotential: growthPotential,
      marketAlignment: this.calculateMarketAlignment(features),
      marketDemand: this.calculateMarketDemand(features),
      timeline: this.generateCareerTimeline(features)
    };
  }

  applySalaryModel(features) {
    // Base salary by experience
    const baseSalaries = {
      'entry': { min: 50000, max: 70000 },
      'junior': { min: 70000, max: 90000 },
      'mid': { min: 90000, max: 130000 },
      'senior': { min: 130000, max: 180000 },
      'lead': { min: 180000, max: 250000 },
      'principal': { min: 250000, max: 350000 }
    };

    const base = baseSalaries[features.experience] || baseSalaries.mid;
    
    // Adjust for factors
    let multiplier = 1.0;
    multiplier *= features.locationCostOfLiving;
    multiplier *= features.marketRate;
    
    if (features.remoteWork) multiplier *= 1.1;
    if (features.companySize === 'large') multiplier *= 1.2;
    if (features.industry === 'finance') multiplier *= 1.3;
    if (features.industry === 'tech') multiplier *= 1.15;

    const range = {
      min: Math.round(base.min * multiplier),
      max: Math.round(base.max * multiplier)
    };

    return {
      range,
      confidence: 0.80,
      marketRate: features.marketRate,
      negotiationPower: this.calculateNegotiationPower(features)
    };
  }

  // Helper methods
  calculateConfidence(prediction, features, historicalData) {
    // Confidence based on feature quality and historical data
    const featureQuality = Object.values(features).filter(f => f !== null && f !== undefined).length / Object.keys(features).length;
    const dataQuality = historicalData.length > 0 ? Math.min(1, historicalData.length / 100) : 0.5;
    
    const confidence = (featureQuality * 0.6 + dataQuality * 0.4);
    
    return {
      score: Math.round(confidence * 100),
      interval: [
        Math.max(0, prediction.probability - 0.1),
        Math.min(1, prediction.probability + 0.1)
      ]
    };
  }

  generateMatchExplanation(features, prediction) {
    const explanations = [];
    
    if (features.skillOverlap > 0.7) {
      explanations.push('Strong skill alignment with job requirements');
    }
    if (features.experienceMatch > 0.8) {
      explanations.push('Experience level matches job requirements perfectly');
    }
    if (features.locationMatch > 0.8) {
      explanations.push('Excellent location compatibility');
    }
    if (features.industryMatch > 0.7) {
      explanations.push('Relevant industry experience');
    }
    
    if (explanations.length === 0) {
      explanations.push('Moderate match - consider highlighting relevant experience');
    }
    
    return explanations;
  }

  calculateTimelineRisks(features) {
    const risks = [];
    
    if (features.competitionLevel === 'high') {
      risks.push('High competition may extend timeline');
    }
    if (features.marketDemand < 0.5) {
      risks.push('Low market demand may slow process');
    }
    if (features.applicantLevel === 'entry') {
      risks.push('Entry-level positions often have longer review processes');
    }
    
    return risks;
  }

  generateTimelineRecommendations(prediction, riskFactors) {
    const recommendations = [];
    
    if (prediction.days > 21) {
      recommendations.push('Consider following up after 2 weeks if no response');
    }
    if (riskFactors.includes('High competition')) {
      recommendations.push('Highlight unique skills to stand out');
    }
    if (prediction.phases.screening > 7) {
      recommendations.push('Ensure ATS optimization to pass initial screening');
    }
    
    return recommendations;
  }

  calculateCareerPaths(features, trajectory) {
    // Generate potential career paths based on current profile
    const paths = [
      {
        title: 'Technical Lead',
        probability: 0.35,
        timeline: '2-3 years',
        requirements: ['Advanced technical skills', 'Leadership experience']
      },
      {
        title: 'Engineering Manager',
        probability: 0.25,
        timeline: '3-4 years',
        requirements: ['People management', 'Project coordination']
      },
      {
        title: 'Staff Engineer',
        probability: 0.30,
        timeline: '1-2 years',
        requirements: ['Deep technical expertise', 'Mentoring']
      }
    ];
    
    return paths.sort((a, b) => b.probability - a.probability);
  }

  identifySkillGaps(features, paths) {
    const allRequirements = paths.flatMap(path => path.requirements);
    const currentSkills = features.currentSkills.map(s => s.toLowerCase());
    
    return allRequirements.filter(req => 
      !currentSkills.some(skill => skill.includes(req.toLowerCase()))
    );
  }

  // Additional helper methods
  extractSkillsFromJD(jobDescription) {
    const skillKeywords = ['javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'sql', 'git'];
    const found = skillKeywords.filter(skill => 
      jobDescription.toLowerCase().includes(skill)
    );
    return found;
  }

  extractExperienceLevel(jobDescription) {
    const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
    for (const level of levels) {
      if (jobDescription.toLowerCase().includes(level)) {
        return level;
      }
    }
    return 'mid';
  }

  calculateExperienceMatch(userLevel, jobLevel) {
    const levels = { 'entry': 0, 'junior': 1, 'mid': 2, 'senior': 3, 'lead': 4, 'principal': 5 };
    const userScore = levels[userLevel] || 2;
    const jobScore = levels[jobLevel] || 2;
    
    if (userScore === jobScore) return 1.0;
    if (Math.abs(userScore - jobScore) === 1) return 0.8;
    return Math.max(0, 1 - Math.abs(userScore - jobScore) * 0.2);
  }

  calculateLocationMatch(userLocation, jobDescription) {
    if (jobDescription.toLowerCase().includes('remote')) return 1.0;
    if (!userLocation) return 0.5;
    
    const userLoc = userLocation.toLowerCase();
    const jobLoc = jobDescription.toLowerCase();
    
    if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) return 1.0;
    return 0.3;
  }

  calculateIndustryMatch(userIndustry, jobDescription) {
    if (!userIndustry) return 0.5;
    return jobDescription.toLowerCase().includes(userIndustry.toLowerCase()) ? 1.0 : 0.3;
  }

  getEducationLevel(education) {
    if (!education || education.length === 0) return 0.5;
    const highest = education[0]; // Assuming first is highest
    if (highest.toLowerCase().includes('master')) return 0.9;
    if (highest.toLowerCase().includes('bachelor')) return 0.7;
    return 0.5;
  }

  extractCompanySize(jobDescription) {
    if (jobDescription.toLowerCase().includes('startup')) return 'small';
    if (jobDescription.toLowerCase().includes('enterprise')) return 'large';
    return 'medium';
  }

  isRemoteFriendly(jobDescription) {
    return jobDescription.toLowerCase().includes('remote') ? 1.0 : 0.3;
  }

  calculateSalaryAlignment(targetSalary, jobDescription) {
    const salaryMatch = jobDescription.match(/\$?(\d+(?:,\d+)*)[kK]?/);
    if (!salaryMatch || !targetSalary) return 0.5;
    
    const jobSalary = parseInt(salaryMatch[1].replace(',', ''));
    const target = parseInt(targetSalary.replace(/\D/g, ''));
    
    const ratio = target / jobSalary;
    if (ratio >= 0.9 && ratio <= 1.1) return 1.0;
    if (ratio >= 0.7 && ratio <= 1.3) return 0.7;
    return 0.3;
  }

  getSeasonalityFactor() {
    const month = new Date().getMonth();
    // Hiring seasons: Spring (Feb-Apr), Fall (Sep-Nov)
    if ((month >= 1 && month <= 3) || (month >= 8 && month <= 10)) return 1.2;
    return 1.0;
  }

  calculateCareerScore(features) {
    // Simplified career scoring
    const skillScore = Math.min(1, features.currentSkills.length / 10);
    const expScore = features.experience.length > 0 ? 0.8 : 0.4;
    const eduScore = features.education.length > 0 ? 0.7 : 0.3;
    
    return (skillScore * 0.4 + expScore * 0.4 + eduScore * 0.2);
  }

  calculateGrowthPotential(features) {
    // Based on market trends and skill alignment
    return 0.75; // Simplified
  }

  calculateMarketAlignment(features) {
    return 0.80; // Simplified
  }

  calculateMarketDemand(features) {
    return 0.85; // Simplified
  }

  generateCareerTimeline(features) {
    return {
      '1year': 'Senior Developer',
      '3years': 'Tech Lead',
      '5years': 'Engineering Manager'
    };
  }

  calculateNegotiationPower(features) {
    let power = 0.5;
    
    if (features.experience === 'senior' || features.experience === 'lead') power += 0.2;
    if (features.skills.length > 8) power += 0.1;
    if (features.education.some(e => e.toLowerCase().includes('master'))) power += 0.1;
    
    return Math.min(1.0, power);
  }

  calculateNegotiationRange(prediction) {
    const range = prediction.range;
    const mid = (range.min + range.max) / 2;
    
    return {
      conservative: Math.round(mid * 0.95),
      target: Math.round(mid),
      optimistic: Math.round(mid * 1.15)
    };
  }

  calculatePercentile(score, historicalData) {
    if (historicalData.length === 0) return 50;
    
    const better = historicalData.filter(d => d.score > score).length;
    return Math.round((1 - better / historicalData.length) * 100);
  }
}

export const mlPredictionService = new MLPredictionService();
