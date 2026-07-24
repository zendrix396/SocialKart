import React from 'react';
import { ShoppingBag, Menu, X, Github } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-none group-hover:border-green-500/50 transition-all duration-300">
               <div className="absolute inset-0 bg-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <ShoppingBag className="h-4 w-4 text-green-500 relative z-10" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-green-400 transition-colors">
              SocialKart
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              <button onClick={() => scrollToSection('features')} className="text-zinc-400 hover:text-green-500 hover:bg-green-500/10 px-4 py-2 rounded-none text-sm font-medium transition-all">Features</button>
              <button onClick={() => scrollToSection('about')} className="text-zinc-400 hover:text-green-500 hover:bg-green-500/10 px-4 py-2 rounded-none text-sm font-medium transition-all">About</button>
              <a href="https://github.com/zendrix396/SocialKart" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-green-400 hover:bg-green-500/10 px-4 py-2 rounded-none text-sm font-medium transition-all flex items-center gap-2">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-zinc-900 inline-flex items-center justify-center p-2 rounded-none text-zinc-400 hover:text-white hover:bg-zinc-800 focus:outline-none border border-zinc-800"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-black border-b border-zinc-800 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => scrollToSection('features')} className="text-zinc-300 hover:text-green-500 hover:bg-green-500/10 block w-full text-left px-3 py-4 rounded-none text-base font-medium border-l-2 border-transparent hover:border-green-500">Features</button>
            <button onClick={() => scrollToSection('about')} className="text-zinc-300 hover:text-green-500 hover:bg-green-500/10 block w-full text-left px-3 py-4 rounded-none text-base font-medium border-l-2 border-transparent hover:border-green-500">About</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

