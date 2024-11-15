import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiAlertCircle, FiCopy, FiCheck } from 'react-icons/fi';
import { MdDescription } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function ResultsDisplay({ data }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(data.parsed_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (data.error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center"
      >
        <FiAlertCircle className="text-red-500 text-xl mr-3" />
        <span className="text-red-300">Error: {data.error}</span>
      </motion.div>
    );
  }

  const { parsed_content, images } = data;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Custom components for ReactMarkdown
  const components = {
    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-gray-100 my-4" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-gray-200 my-3" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-gray-300 my-2" {...props} />,
    p: ({ node, ...props }) => <p className="text-gray-300 my-2" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-300 my-2" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-300 my-2" {...props} />,
    li: ({ node, ...props }) => <li className="ml-4 text-gray-300" {...props} />,
    a: ({ node, ...props }) => (
      <a 
        className="text-blue-400 hover:text-blue-300 underline" 
        target="_blank" 
        rel="noopener noreferrer" 
        {...props} 
      />
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          className="rounded-md my-2"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-700 rounded px-1 py-0.5 text-gray-200" {...props}>
          {children}
        </code>
      );
    },
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-gray-500 pl-4 my-2 italic text-gray-400" {...props} />
    ),
  };

  return (
    <motion.div 
      className="mt-8 space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Parsed Content Section */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MdDescription className="text-blue-400 text-xl mr-2" />
            <h2 className="text-xl font-semibold text-gray-200">Generated Content</h2>
          </div>
          <button
            onClick={handleCopyContent}
            className="flex items-center space-x-2 px-3 py-1 rounded-md bg-gray-700/50 hover:bg-gray-700/70 transition-colors"
          >
            {copied ? <FiCheck className="text-green-400" /> : <FiCopy />}
            <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-blue-400 to-yellow-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-gray-800/90 p-6 rounded-lg overflow-x-auto backdrop-blur-sm">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              components={components}
            >
              {parsed_content}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>

      {/* Images Section */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center">
          <FiImage className="text-blue-400 text-xl mr-2" />
          <h2 className="text-xl font-semibold text-gray-200">Relevant Images</h2>
        </div>
        
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={container}
        >
          {images.map((img, index) => (
            <motion.div
              key={index}
              variants={item}
              className="relative group"
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedImage(img)}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-blue-400 to-yellow-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <img
                src={`data:image/png;base64,${img}`}
                alt={`Relevant frame ${index + 1}`}
                className="relative rounded-lg w-full h-48 object-cover cursor-pointer hover:shadow-xl transition-all duration-300"
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Image Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            src={`data:image/png;base64,${selectedImage}`}
            alt="Selected frame"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          />
        </motion.div>
      )}
    </motion.div>
  );
}

export default ResultsDisplay;