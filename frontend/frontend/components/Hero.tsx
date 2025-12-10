import React from 'react';
import ListingGenerator from './ListingGenerator';
import { Terminal, ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center overflow-hidden">
      
      {/* Decorative background elements specific to Hero */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Alert Banner - Squarish */}
      <div className="mb-10 inline-flex items-center gap-3 px-4 py-2 bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-mono uppercase tracking-wide rounded-none backdrop-blur-sm">
        <span className="w-2 h-2 bg-red-500 animate-pulse"></span>
        Service Disrupted: Local Mode Active
      </div>

      <div className="text-center max-w-4xl mx-auto mb-16 space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
          Turn Social Content into <br />
          <span className="text-green-500 italic">E-Commerce Gold</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto font-light">
          Stop manually copy-pasting. Our AI analyzes your Instagram posts and generates <span className="text-white font-medium">Amazon-ready listings</span> in seconds.
        </p>
      </div>

      {/* Generator Section with decorative borders */}
      <div className="w-full relative z-10">
        {/* Decorative corner markers */}
        <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-green-500/30 hidden md:block"></div>
        <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-green-500/30 hidden md:block"></div>
        
        <ListingGenerator />

        <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-green-500/30 hidden md:block"></div>
        <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-green-500/30 hidden md:block"></div>
      </div>
    </section>
  );
};

export default Hero;