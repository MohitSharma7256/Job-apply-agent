"use client";

import { useState } from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Hero />
      <Features />
      <HowItWorks />
      <GettingStarted />
    </main>
  );
}

function Hero() {
  return (
    <section className="px-6 py-20 text-center">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Job Apply Agent
          </span>
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          AI-powered job search automation. Find matching jobs, tailor your resume, 
          and apply automatically. Track everything in Google Sheets.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
          >
            Open Dashboard
          </a>
          <a
            href="#features"
            className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-gray-700 shadow transition-all hover:bg-gray-50"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "Multi-Platform Search",
      description: "Search Naukri, Apna, LinkedIn, Indeed, Internshala & company career pages",
      icon: "🔍",
    },
    {
      title: "AI Job Matching",
      description: "Score jobs 1-10 against your profile using AI",
      icon: "🤖",
    },
    {
      title: "Resume Tailoring",
      description: "Automatically customize your resume for each job",
      icon: "📄",
    },
    {
      title: "Auto Apply",
      description: "Apply to matched jobs automatically with daily limits",
      icon: "🚀",
    },
    {
      title: "Sheet Tracking",
      description: "Log every application with timestamp in Google Sheets",
      icon: "📊",
    },
    {
      title: "Email Alerts",
      description: "Get notified on successful applications",
      icon: "📧",
    },
  ];

  return (
    <section id="features" className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Features
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: "Configure Your Profile",
      description: "Add your skills, target roles, and preferences",
    },
    {
      step: 2,
      title: "Set Search Parameters",
      description: "Choose keywords, locations, and platforms",
    },
    {
      step: 3,
      title: "AI Finds & Scores Jobs",
      description: "Automatically search and match jobs to your profile",
    },
    {
      step: 4,
      title: "Resume Gets Tailored",
      description: "AI rewrites your resume for each matched job",
    },
    {
      step: 5,
      title: "Auto Apply",
      description: "Apply to jobs within your daily limit",
    },
    {
      step: 6,
      title: "Track in Sheets",
      description: "Every application logged with timestamp",
    },
  ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          How It Works
        </h2>
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {step.step}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GettingStarted() {
  return (
    <section className="px-6 py-20 bg-gray-900 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-3xl font-bold">Ready to Start?</h2>
        <p className="mb-8 text-lg text-gray-300">
          Set up your profile, configure your search, and let the agent do the work.
        </p>
        <a
          href="/dashboard"
          className="inline-block rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-500"
        >
          Launch Dashboard
        </a>
      </div>
    </section>
  );
}
