import React from 'react';
import { Instagram, Zap, ShoppingBag, ArrowRight, ShieldAlert, Check } from 'lucide-react';

const FeatureCard: React.FC<{ icon: React.ElementType, title: string, items: string[], description: string, delay: number }> = ({ 
  icon: Icon, 
  title, 
  items, 
  description,
  delay
}) => {
  return (
    <div 
      className="group relative bg-zinc-900/20 backdrop-blur-sm border border-zinc-800/60 p-8 hover:bg-zinc-900/40 hover:border-green-500/30 transition-all duration-500 overflow-hidden flex flex-col h-full"
    >
      {/* Permanent top subtle gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Background Glow Effect on Hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      <div className="absolute top-6 right-6 p-2 rounded-full border border-white/5 bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
        <ArrowRight className="w-4 h-4 text-green-400" />
      </div>
      
      {/* Icon with permanent green styling */}
      <div className="w-14 h-14 bg-zinc-950 border border-green-900/30 flex items-center justify-center mb-8 shadow-[0_0_15px_-3px_rgba(34,197,94,0.1)] group-hover:shadow-[0_0_20px_-3px_rgba(34,197,94,0.2)] transition-shadow duration-300 relative">
        <div className="absolute inset-0 bg-green-500/5"></div>
        <Icon className="w-6 h-6 text-green-500" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-4 tracking-tight group-hover:text-green-50 transition-colors">{title}</h3>
      <p className="text-zinc-400 text-base mb-8 leading-relaxed">
        {description}
      </p>
      
      <div className="mt-auto">
        <div className="h-px w-full bg-gradient-to-r from-zinc-800 to-transparent mb-6"></div>
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300 group-hover:text-white transition-colors">
              <div className="mt-0.5 w-4 h-4 rounded-sm bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-green-500" />
              </div>
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: Instagram,
      title: "Social Media Integration",
      description: "Directly parse Instagram content. We handle the complex extraction of captions, hashtags, and media so you don't have to.",
      items: [
        "Instant Post Import",
        "Context Analysis",
        "Metadata Scraping"
      ]
    },
    {
      icon: Zap,
      title: "Smart Transformation",
      description: "Our AI Engine converts casual social language into high-converting, keyword-rich e-commerce descriptions.",
      items: [
        "Sales-Oriented Copy",
        "Feature Extraction",
        "Keyword Optimization"
      ]
    },
    {
      icon: ShoppingBag,
      title: "Marketplace Ready",
      description: "Get structured JSON or CSV data formatted specifically for Amazon, Shopify, and other major platforms.",
      items: [
        "Platform Compliant",
        "Bulk Export (Soon)",
        "Price Simulation"
      ]
    }
  ];

  return (
    <div className="flex flex-col relative">
        <section id="features" className="py-32 bg-black relative overflow-hidden">
          {/* Section Background Effects */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          
          {/* Subtle Green Glow Blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-900/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                <span className="inline-block py-1 px-3 rounded-full bg-green-500/5 border border-green-500/10 text-green-500 text-xs font-bold tracking-wider uppercase mb-6">
                  Workflow Engine
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                  Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">Speed</span>
                </h2>
                <p className="text-zinc-400 text-lg leading-relaxed">
                    Dropshipping automation that actually works. From social feed to product listing in seconds, stripped of the complexity.
                </p>
              </div>
              
              {/* Grid with gap for separation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                    <FeatureCard key={idx} {...feature} delay={idx * 100} />
                ))}
              </div>
          </div>
        </section>

        {/* About / System Status Section */}
        <section id="about" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-900/20 to-transparent"></div>
            
            <div className="max-w-4xl mx-auto px-4 space-y-12">
                <div className="text-center">
                   <h2 className="text-3xl font-bold text-white mb-4">System Status</h2>
                   <div className="h-1 w-20 bg-green-500 mx-auto rounded-full"></div>
                </div>

                <div className="bg-black border border-zinc-800 p-1 rounded-sm shadow-2xl">
                    <div className="bg-zinc-950 p-6 md:p-8 border border-zinc-900/50 rounded-sm font-mono text-sm text-zinc-400 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                           <ShieldAlert className="w-6 h-6 text-zinc-700" />
                        </div>
                        
                        <div className="flex items-center gap-2 text-green-500 border-b border-zinc-900 pb-4 mb-4">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                           <span>server_status.log</span>
                        </div>

                        <p>
                            <span className="text-purple-400">root@socialkart</span>:<span className="text-blue-400">~</span>$ tail -f /var/log/system
                        </p>
                        <div className="pl-4 border-l border-zinc-800 space-y-2 text-zinc-500">
                            <p>[INFO] Initializing heuristics engine...</p>
                            <p>[WARN] <span className="text-yellow-500">Cloud API connectivity limited</span> (Burner account deprecated)</p>
                            <p>[INFO] Switching to local simulation mode...</p>
                            <p>[SUCCESS] <span className="text-green-500">Local environment active. Ready for input.</span></p>
                        </div>
                        <p className="pt-4 text-zinc-300">
                             For full deployment capabilities, please refer to the <a href="https://github.com" className="text-green-500 hover:underline">GitHub repository</a>. 
                             The current live demo utilizes a simulated response engine to demonstrate UI flows and data structuring capabilities without active backend scraping.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    </div>
  );
};

export default Features;