import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export const DesignShowcasePage = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-900/80 to-transparent backdrop-blur-md border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-500/50 text-blue-400 hover:border-blue-400 hover:bg-blue-500/10 transition"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-black text-white">AI-Generated Design System</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Intro Section */}
          <div className="mb-16 text-center">
            <h2 className="text-5xl font-black text-white mb-4">Modern & Sleek UI Components</h2>
            <p className="text-xl text-slate-300">Powered by advanced gradient algorithms and micro-interactions</p>
          </div>

          {/* Primary Buttons */}
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-8">Primary Action Buttons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Create Post', icon: '✏️' },
                { label: 'Get Started', icon: '🚀' },
                { label: 'Sign Up Now', icon: '✨' },
                { label: 'Join Club', icon: '🎯' }
              ].map((btn) => (
                <div key={btn.label} className="panel p-6 text-center">
                  <div className="text-4xl mb-4">{btn.icon}</div>
                  <button className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-400 hover:to-emerald-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/50">
                    {btn.label}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Secondary Buttons */}
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-8">Secondary Action Buttons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Learn More', icon: '📚' },
                { label: 'View Details', icon: '👀' },
                { label: 'Explore', icon: '🔍' },
                { label: 'Discover', icon: '💡' }
              ].map((btn) => (
                <div key={btn.label} className="panel p-6 text-center">
                  <div className="text-4xl mb-4">{btn.icon}</div>
                  <button className="w-full px-6 py-3 rounded-lg border-2 border-slate-500 text-white font-semibold hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transform hover:scale-105 transition-all duration-300">
                    {btn.label}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Icon Buttons */}
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-8">Icon Action Buttons</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {['❤️', '💬', '🔗', '📤', '📌', '⭐', '🎉', '🚀', '✏️', '🗑️', '🔔', '👤'].map((emoji) => (
                <button
                  key={emoji}
                  onMouseEnter={() => setHoveredButton(emoji)}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="aspect-square rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-2xl hover:from-slate-600 hover:to-slate-700 transform hover:scale-110 transition-all duration-300 border border-slate-600 hover:border-blue-400 shadow-lg hover:shadow-blue-500/30"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </section>

          {/* Input Fields */}
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-8">Modern Input Fields</h3>
            <div className="panel p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Email Address</label>
                  <input type="email" placeholder="your@email.com" className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:bg-slate-800/70 focus:shadow-lg focus:shadow-blue-500/30 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Post Title</label>
                  <input type="text" placeholder="Write something amazing..." className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder:text-slate-400 focus:border-green-400 focus:bg-slate-800/70 focus:shadow-lg focus:shadow-green-500/30 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Message</label>
                  <textarea rows="4" placeholder="Share your thoughts..." className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:bg-slate-800/70 focus:shadow-lg focus:shadow-blue-500/30 transition-all" />
                </div>
              </div>
            </div>
          </section>

          {/* Cards/Panels */}
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-8">Modern Card Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Fast Performance', desc: 'Optimized for speed and efficiency', color: 'blue' },
                { title: 'Beautiful Design', desc: 'Modern aesthetics with smooth animations', color: 'green' },
                { title: 'Easy to Use', desc: 'Intuitive interface for everyone', color: 'purple' }
              ].map((card) => (
                <div key={card.title} className="panel p-6 group hover:border-opacity-100 border-opacity-50 transition-all">
                  <div className={`text-4xl mb-4 transform group-hover:scale-110 transition-transform`}>
                    {card.color === 'blue' ? '⚡' : card.color === 'green' ? '🎨' : '✨'}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{card.title}</h4>
                  <p className="text-slate-300">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Gradient Text */}
          <section className="mb-16 text-center">
            <h3 className="text-5xl font-black mb-8">
              <span className="bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Gradient Text Effects
              </span>
            </h3>
            <p className="text-2xl text-slate-300">Perfect for headers and emphasis</p>
          </section>

          {/* Animation Showcase */}
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-8">Interactive Animations</h3>
            <div className="panel p-8">
              <div className="flex flex-wrap justify-center gap-8">
                {/* Pulse */}
                <div className="text-center">
                  <div className="mb-4 text-5xl animate-bounce">🎯</div>
                  <p className="text-slate-300">Bounce Animation</p>
                </div>

                {/* Scale */}
                <div className="text-center">
                  <button className="mb-4 text-5xl transform hover:scale-110 transition-transform duration-300">
                    🚀
                  </button>
                  <p className="text-slate-300">Scale on Hover</p>
                </div>

                {/* Rotate */}
                <div className="text-center">
                  <div className="mb-4 text-5xl inline-block transform hover:rotate-12 transition-transform duration-300">
                    ⚙️
                  </div>
                  <p className="text-slate-300">Rotate on Hover</p>
                </div>

                {/* Glow */}
                <div className="text-center">
                  <div className="mb-4 text-5xl inline-block filter hover:drop-shadow-lg hover:drop-shadow-green-500/50 transition-all duration-300">
                    ✨
                  </div>
                  <p className="text-slate-300">Glow Effect</p>
                </div>
              </div>
            </div>
          </section>

          {/* Color Palette */}
          <section className="mb-16">
            <h3 className="text-2xl font-black text-white mb-8">Color Palette</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { name: 'Green', hex: '#00D66A', bg: 'bg-green-500' },
                { name: 'Blue', hex: '#3B82F6', bg: 'bg-blue-500' },
                { name: 'Purple', hex: '#A855F7', bg: 'bg-purple-500' },
                { name: 'Slate', hex: '#64748B', bg: 'bg-slate-500' },
                { name: 'Emerald', hex: '#10B981', bg: 'bg-emerald-500' },
                { name: 'Indigo', hex: '#6366F1', bg: 'bg-indigo-500' }
              ].map((color) => (
                <div key={color.hex} className="text-center">
                  <div className={`${color.bg} h-24 rounded-lg mb-2 shadow-lg`} />
                  <p className="font-semibold text-white">{color.name}</p>
                  <p className="text-xs text-slate-400">{color.hex}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mb-8 text-center">
            <div className="panel p-12">
              <h3 className="text-3xl font-black text-white mb-6">Ready to Experience This Design?</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-400 hover:to-emerald-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/50">
                  Explore App →
                </button>
                <button className="px-8 py-3 rounded-lg border-2 border-blue-500/50 text-blue-400 hover:border-blue-400 hover:bg-blue-500/10 font-bold transform hover:scale-105 transition-all duration-300">
                  View Code
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
