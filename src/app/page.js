import Link from 'next/link';
import { ArrowRight, Zap, Shield, Target } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Zap className="h-12 w-12 text-white" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-6">
              Job Apply Agent Pro
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              AI-powered job application automation that finds, tailors, applies, and tracks jobs across multiple platforms - saving you hours every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Powerful Features for Job Seekers
          </h2>
          <p className="text-slate-300 text-lg">
            Everything you need to automate your job search and land your dream job faster.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
              <Target className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Smart Job Matching
            </h3>
            <p className="text-slate-300">
              AI-powered job matching across LinkedIn, Indeed, Naukri, and more platforms with intelligent scoring based on your profile.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Automated Applications
            </h3>
            <p className="text-slate-300">
              One-click batch applications with AI-tailored resumes and cover letters for each job description.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Application Tracking
            </h3>
            <p className="text-slate-300">
              Real-time tracking of all your applications with status updates, interview scheduling, and response management.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-slate-300">Job Platforms</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">1000+</div>
              <div className="text-slate-300">Applications/day</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-slate-300">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-slate-300">Automation</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Supercharge Your Job Search?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Join thousands of job seekers who've landed their dream jobs with AI automation.
          </p>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all"
          >
            Start Your Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
