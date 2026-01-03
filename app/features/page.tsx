"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  BarChart3,
  Wand2,
  TrendingUp,
  FileCheck,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/src/components/Navbar";
import { Footer } from "@/src/components/Footer";

const features = [
  {
    icon: Target,
    title: "ATS Score Analysis",
    description:
      "Get comprehensive ATS compatibility scores with detailed breakdowns of keyword matching and requirement coverage.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Wand2,
    title: "AI-Powered Modifications",
    description:
      "Receive intelligent suggestions to improve your resume with context-aware recommendations powered by advanced AI.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Restructuring Recommendations",
    description:
      "Get actionable advice on reorganizing your resume sections for better ATS parsing and human readability.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Detailed Breakdown",
    description:
      "See requirement-level analysis with matched and missing skills, weighted importance, and evidence tracking.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: FileCheck,
    title: "Keyword Optimization",
    description:
      "Identify present and missing keywords from job descriptions to maximize your resume's ATS compatibility.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description:
      "Instantly see how your resume changes affect your ATS score with live preview and updates.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your resume data is processed securely. No data is stored permanently, ensuring complete privacy.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Clock,
    title: "Fast Analysis",
    description:
      "Get comprehensive resume analysis in seconds, not minutes. Powered by efficient AI processing.",
    color: "from-violet-500 to-purple-500",
  },
];

const benefits = [
  "Increase your resume's ATS compatibility by up to 40%",
  "Identify missing keywords and skills from job descriptions",
  "Get AI-powered suggestions for better phrasing and structure",
  "Understand which requirements you match and which you're missing",
  "Optimize your resume for specific job postings",
  "Save time with automated analysis and recommendations",
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Powerful Features</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold bg-linear-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent mb-6">
            Everything You Need to
            <br />
            <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Optimize Your Resume
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Leverage AI-powered analysis to make your resume ATS-friendly and
            stand out to recruiters.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative border border-zinc-800/50 rounded-2xl p-6 bg-linear-to-br from-zinc-900/60 to-zinc-950/60 backdrop-blur-sm hover:border-zinc-700/50 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                />
                <div className="relative">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-linear-to-br ${feature.color} bg-opacity-20 border border-opacity-30 mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border border-zinc-800/50 rounded-3xl p-8 lg:p-12 bg-linear-to-br from-zinc-900/60 to-zinc-950/60 backdrop-blur-sm mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white">
              Key Benefits
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-zinc-300 leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="border border-zinc-800/50 rounded-3xl p-12 bg-linear-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Optimize Your Resume?
            </h2>
            <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
              Start analyzing your resume now and get AI-powered recommendations
              to improve your ATS score.
            </p>
            <Link
              href="/#analyzer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-200 text-lg font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
