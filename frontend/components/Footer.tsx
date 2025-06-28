import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-900 bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center space-y-4">
        <div className="text-zinc-500 text-sm text-center">
          &copy; {new Date().getFullYear()} SocialKart. All rights reserved.
        </div>
        <div className="flex items-center gap-1 text-zinc-600 text-sm font-medium">
          <span>Made with</span>
          <span className="text-red-500 animate-pulse">❤️</span>
          <span>by Aditya</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

