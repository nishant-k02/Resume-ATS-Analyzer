"use client";

import { FileText, Github, Sparkles, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 group-hover:border-indigo-500/50 transition-colors">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  ResumeLens
                </span>
                <span className="text-xs text-zinc-500">
                  AI-Powered Optimization
                </span>
              </div>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              Optimize your resume with AI-powered ATS analysis and intelligent
              suggestions. Get detailed insights to improve your job application
              success rate.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#analyzer"
                  className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span>Analyzer</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span>Features</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/#analyzer"
                  className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Get Started</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Connect</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/nishant-k02"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="https://nishant-khandhar-portfolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span>Portfolio</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/nishant-khandhar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © {currentYear} ResumeLens. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Built with Next.js & AI</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
