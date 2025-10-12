"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";

// Import the CSS file
import "@/styles/animations.css";

function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Icons */}
      <div className="floating-icon absolute top-20 left-10 text-2xl opacity-30">📚</div>
      <div className="floating-icon absolute top-40 right-20 text-2xl opacity-30">🧠</div>
      <div className="floating-icon absolute top-60 left-1/4 text-xl opacity-30">🌐</div>
      <div className="floating-icon absolute bottom-40 right-10 text-2xl opacity-30">🎓</div>
      <div className="floating-icon absolute bottom-60 left-20 text-xl opacity-30">⚡</div>
      
      {/* Particle effects */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${8 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
  );
}

function CounterAnimation({ end, label, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setHasAnimated(true);
            let start = 0;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                setCount(end);
                clearInterval(timer);
              } else {
                setCount(Math.floor(start));
              }
            }, 16);
          }
        },
        { threshold: 0.1 }
      );

      const element = document.getElementById(`counter-${label}`);
      if (element) observer.observe(element);

      return () => observer.disconnect();
    }
  }, [end, duration, hasAnimated, label]);

  return (
    <div id={`counter-${label}`} className="text-center group">
      <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
        {count.toLocaleString()}+
      </div>
      <div className="text-gray-600 dark:text-gray-400 font-medium">{label}</div>
    </div>
  );
}

function HomeContent() {
  const { theme } = useTheme();
  
  return (
    <main className={`min-h-screen transition-all duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50/30 to-green-50'
    }`}>
      {/* Navigation */}
      <nav className={`w-full backdrop-blur-md shadow-sm border-b transition-all duration-300 px-6 py-4 sticky top-0 z-50 ${
        theme === 'dark'
          ? 'bg-gray-900/80 border-gray-700/50'
          : 'bg-white/80 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-3xl animate-pulse">🎓</div>
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Teachers<span className="gradient-text">Connect</span>
            </span>
          </div>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className={`w-[350px] p-6 transition-colors duration-300 ${
                    theme === 'dark' ? 'glass-card-dark' : 'glass-card'
                  }`}>
                    <NavigationMenuLink asChild>
                      <Link href="#ai-continuity" className={`block p-4 rounded-xl transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-700/50 text-gray-200' 
                          : 'hover:bg-blue-50/50 text-gray-700'
                      }`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">🧠</span>
                          <span className="font-semibold">AI Learning Continuity</span>
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Auto-generate lessons when teachers are absent</div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#offline-support" className={`block p-4 rounded-xl transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-700/50 text-gray-200' 
                          : 'hover:bg-blue-50/50 text-gray-700'
                      }`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">🌐</span>
                          <span className="font-semibold">Offline Support</span>
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Works even in low-connectivity areas</div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#resource-sharing" className={`block p-4 rounded-xl transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-700/50 text-gray-200' 
                          : 'hover:bg-blue-50/50 text-gray-700'
                      }`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">🗂️</span>
                          <span className="font-semibold">Resource Sharing</span>
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Collaborate and share teaching materials</div>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/about" className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'text-gray-200 hover:text-white hover:bg-gray-800/50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}>
                    About
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/contact" className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'text-gray-200 hover:text-white hover:bg-gray-800/50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}>
                    Contact
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm" className={`transition-all duration-300 rounded-full ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-6 transition-all duration-300 hover:scale-105">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <FloatingElements />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <h1 className={`text-6xl md:text-7xl lg:text-8xl font-black mb-8 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Empowering
              <br />
              <span className="gradient-text">Rural Education</span>
              <br />
              <span className="gradient-text-green">Through AI</span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed transition-colors duration-500 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Bridge the rural-urban teaching gap with AI-powered tools, collaborative resources, 
              and innovative technology designed specifically for underserved educational communities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 hover:from-blue-700 hover:via-purple-700 hover:to-teal-700 text-white px-10 py-6 text-xl rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl"
              >
                🚀 Get Started Free
              </Button>
            </Link>
          </div>

          {/* Impact Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20">
            <CounterAnimation end={15000} label="Teachers Empowered" />
            <CounterAnimation end={75000} label="Students Reached" />
            <CounterAnimation end={95} label="% Offline Availability" />
          </div>
        </div>
      </section>

      {/* Feature Showcase with Glassmorphism */}
      <section className={`py-24 transition-all duration-500 ${
        theme === 'dark' ? 'bg-gray-800/30' : 'bg-white/30'
      }`} id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className={`text-5xl md:text-6xl font-bold mb-6 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Revolutionary <span className="gradient-text">Features</span>
            </h2>
            <p className={`text-xl md:text-2xl max-w-3xl mx-auto transition-colors duration-500 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Cutting-edge technology designed specifically for rural education challenges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Learning Continuity */}
            <div className={`group card-hover p-8 rounded-3xl backdrop-blur-lg transition-all duration-500 ${
              theme === 'dark'
                ? 'glass-card-dark border-blue-500/20 hover:border-blue-400/40'
                : 'glass-card border-blue-200/30 hover:border-blue-300/50'
            }`} id="ai-continuity">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🧠</div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>AI Learning Continuity</h3>
              <p className={`mb-6 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                When teachers are absent, our AI automatically generates lesson notes and provides 
                an intelligent Q&A assistant to help students continue learning seamlessly.
              </p>
              <ul className={`text-sm space-y-3 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Auto-generated lessons from curriculum data</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>RAG-powered Q&A assistance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                  <span>Speech synthesis for audio lessons</span>
                </li>
              </ul>
              <Link href="/features/ai" className="inline-block mt-6 text-blue-500 hover:text-blue-600 font-medium transition-colors">
                Learn More →
              </Link>
            </div>

            {/* Offline Support */}
            <div className={`group card-hover p-8 rounded-3xl backdrop-blur-lg transition-all duration-500 ${
              theme === 'dark'
                ? 'glass-card-dark border-green-500/20 hover:border-green-400/40'
                : 'glass-card border-green-200/30 hover:border-green-300/50'
            }`} id="offline-support">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🌐</div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Offline & Low-Connectivity</h3>
              <p className={`mb-6 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Progressive Web App technology ensures full functionality even in areas with 
                poor internet connectivity. Sync when online, work when offline.
              </p>
              <ul className={`text-sm space-y-3 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>PWA with service workers</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Local caching with IndexedDB</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Background sync capabilities</span>
                </li>
              </ul>
              <Link href="/features/offline" className="inline-block mt-6 text-green-500 hover:text-green-600 font-medium transition-colors">
                Learn More →
              </Link>
            </div>

            {/* Resource Sharing */}
            <div className={`group card-hover p-8 rounded-3xl backdrop-blur-lg transition-all duration-500 ${
              theme === 'dark'
                ? 'glass-card-dark border-purple-500/20 hover:border-purple-400/40'
                : 'glass-card border-purple-200/30 hover:border-purple-300/50'
            }`} id="resource-sharing">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🗂️</div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Resource Sharing Hub</h3>
              <p className={`mb-6 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Upload, share, and discover high-quality teaching materials. 
                Connect with fellow educators through discussion forums and real-time collaboration.
              </p>
              <ul className={`text-sm space-y-3 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Collaborative lesson libraries</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  <span>Real-time teacher chat</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Community-driven content rating</span>
                </li>
              </ul>
              <Link href="/features/sharing" className="inline-block mt-6 text-purple-500 hover:text-purple-600 font-medium transition-colors">
                Learn More →
              </Link>
            </div>

            {/* Multilingual Support */}
            <div className={`group card-hover p-8 rounded-3xl backdrop-blur-lg transition-all duration-500 ${
              theme === 'dark'
                ? 'glass-card-dark border-orange-500/20 hover:border-orange-400/40'
                : 'glass-card border-orange-200/30 hover:border-orange-300/50'
            }`}>
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🌍</div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Multilingual Adaptation</h3>
              <p className={`mb-6 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Automatically translate content into local languages with speech-to-text 
                and text-to-speech support for maximum accessibility and inclusion.
              </p>
              <ul className={`text-sm space-y-3 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Google Translate API integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Whisper speech recognition</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Regional language support</span>
                </li>
              </ul>
              <Link href="/features/multilingual" className="inline-block mt-6 text-orange-500 hover:text-orange-600 font-medium transition-colors">
                Learn More →
              </Link>
            </div>

            {/* Teacher Dashboard */}
            <div className={`group card-hover p-8 rounded-3xl backdrop-blur-lg transition-all duration-500 ${
              theme === 'dark'
                ? 'glass-card-dark border-teal-500/20 hover:border-teal-400/40'
                : 'glass-card border-teal-200/30 hover:border-teal-300/50'
            }`}>
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🧑‍🏫</div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Smart Teacher Dashboard</h3>
              <p className={`mb-6 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Personalized workspace to manage lessons, track student engagement, 
                and access AI-suggested teaching materials with advanced analytics.
              </p>
              <ul className={`text-sm space-y-3 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                  <span>Lesson management system</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                  <span>Student engagement analytics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  <span>AI-powered content suggestions</span>
                </li>
              </ul>
              <Link href="/features/dashboard" className="inline-block mt-6 text-teal-500 hover:text-teal-600 font-medium transition-colors">
                Learn More →
              </Link>
            </div>

            {/* Technology Stack */}
            <div className={`group card-hover p-8 rounded-3xl backdrop-blur-lg transition-all duration-500 ${
              theme === 'dark'
                ? 'glass-card-dark border-gray-500/20 hover:border-gray-400/40'
                : 'glass-card border-gray-200/30 hover:border-gray-300/50'
            }`}>
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Cutting-Edge Technology</h3>
              <p className={`mb-6 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Built with modern AI models, efficient databases, and scalable cloud infrastructure 
                for reliable performance and future-proof scalability.
              </p>
              <ul className={`text-sm space-y-3 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                  <span>Llama 3 / Mistral AI models</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span>FAISS vector database</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                  <span>MongoDB & cloud storage</span>
                </li>
              </ul>
              <Link href="/features/technology" className="inline-block mt-6 text-gray-500 hover:text-gray-600 font-medium transition-colors">
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Impact Section */}
      <section className={`py-24 transition-all duration-500 ${
        theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50/50'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Trusted by <span className="gradient-text">Educators Worldwide</span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto transition-colors duration-500 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Join thousands of teachers who are already transforming rural education with our platform
            </p>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <div className={`p-8 rounded-2xl card-hover transition-all duration-500 ${
              theme === 'dark' ? 'glass-card-dark' : 'glass-card'
            }`}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div className="ml-4">
                  <h4 className={`font-semibold transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Sarah M.</h4>
                  <p className={`text-sm transition-colors duration-500 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Rural Primary Teacher, Kenya</p>
                </div>
              </div>
              <p className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                &quot;Teachers Connect has been a game-changer for our remote school. The AI-generated lessons 
                kept my students learning even when I was sick for a week. Amazing platform!&quot;
              </p>
              <div className="flex text-yellow-400 mt-4">
                {"★".repeat(5)}
              </div>
            </div>

            <div className={`p-8 rounded-2xl card-hover transition-all duration-500 ${
              theme === 'dark' ? 'glass-card-dark' : 'glass-card'
            }`}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  R
                </div>
                <div className="ml-4">
                  <h4 className={`font-semibold transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Raj P.</h4>
                  <p className={`text-sm transition-colors duration-500 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Secondary Teacher, Rural India</p>
                </div>
              </div>
              <p className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                &quot;The offline capability is incredible! Our internet is unreliable, but I can still 
                access all teaching materials and share resources with other teachers nearby.&quot;
              </p>
              <div className="flex text-yellow-400 mt-4">
                {"★".repeat(5)}
              </div>
            </div>

            <div className={`p-8 rounded-2xl card-hover transition-all duration-500 ${
              theme === 'dark' ? 'glass-card-dark' : 'glass-card'
            }`}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <h4 className={`font-semibold transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Maria L.</h4>
                  <p className={`text-sm transition-colors duration-500 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Elementary Teacher, Rural Brazil</p>
                </div>
              </div>
              <p className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                &quot;The multilingual support helped me translate lessons into Portuguese effortlessly. 
                My students now have access to quality content in their native language.&quot;
              </p>
              <div className="flex text-yellow-400 mt-4">
                {"★".repeat(5)}
              </div>
            </div>
          </div>

          {/* Partner Logos */}
          <div className="text-center">
            <p className={`text-lg mb-8 transition-colors duration-500 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Supported by leading educational organizations
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
              <div className="text-2xl font-bold">UNESCO</div>
              <div className="text-2xl font-bold">UNICEF</div>
              <div className="text-2xl font-bold">World Bank</div>
              <div className="text-2xl font-bold">Gates Foundation</div>
              <div className="text-2xl font-bold">Khan Academy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Call to Action Section */}
      <section className="relative py-24 overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-500 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-purple-900 via-blue-900 to-teal-900'
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600'
        }`}></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-64 h-64 bg-white rounded-full mix-blend-overlay"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${6 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Ready to Transform 
            <br />
            <span className="text-yellow-300">Rural Education?</span>
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Join thousands of teachers already making a difference in their communities. 
            Start your journey towards educational equity today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 px-12 py-6 text-xl rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl"
              >
                🚀 Join as Teacher
              </Button>
            </Link>
            <Link href="/teachersign">
              <Button 
                variant="outline" 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 px-12 py-6 text-xl rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl"
              >
                🧑‍💻 Join as student
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-2">🆓</div>
              <div className="text-white font-semibold">Free to Start</div>
              <div className="text-blue-200 text-sm">No credit card required</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-white font-semibold">Setup in Minutes</div>
              <div className="text-blue-200 text-sm">Quick onboarding process</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🤝</div>
              <div className="text-white font-semibold">24/7 Support</div>
              <div className="text-blue-200 text-sm">We&apos;re here to help</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className={`py-16 transition-all duration-500 ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-3xl">🎓</div>
                <span className="text-2xl font-bold">
                  Teachers<span className="gradient-text">Connect</span>
                </span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Empowering rural education through AI-powered teaching tools, collaborative 
                platforms, and innovative technology designed for underserved communities.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Platform</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Support</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link href="/training" className="hover:text-white transition-colors">Training</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/press" className="hover:text-white transition-colors">Press</Link></li>
                <li><Link href="/partners" className="hover:text-white transition-colors">Partners</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2025 Teachers Connect. All rights reserved. Built with ❤️ for rural educators.
              </p>
              <div className="flex space-x-6 text-gray-400">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  );
}
