'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { MessageSquare, Lock, Compass, ArrowRight } from 'lucide-react';

const Chat = () => {
  return (
    <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4] font-sans selection:bg-[#E2A93E] selection:text-black">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-24 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        {/* Main Section */}
        <div className="border-b border-[#1F1F1D] pb-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs uppercase tracking-[0.2em] text-[#C5A880] font-mono font-bold block mb-4">
              Coming Soon
            </span>
            <h1 className="text-5xl md:text-6xl font-serif text-white font-medium tracking-tight leading-none mb-6">
              Secure Freelance Chat
            </h1>
            <p className="text-lg text-[#A3A39C] max-w-2xl leading-relaxed">
              Direct wallet-to-wallet chat between freelancers and clients. Safely negotiate milestones, send proposals, and arrange payments directly.
            </p>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group"
          >
            <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880] mb-4 group-hover:border-[#C5A880] transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-white font-medium mb-2">Cryptographic Privacy</h3>
            <p className="text-sm text-[#8E8E87] leading-relaxed">
              Messages are encrypted locally using your private keys. Unlike Web2 apps, no central database can read, log, or scan your chats.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group"
          >
            <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880] mb-4 group-hover:border-[#C5A880] transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-white font-medium mb-2">Contract Context</h3>
            <p className="text-sm text-[#8E8E87] leading-relaxed">
              Manage work progress, sign off on deliverables, and handle escrow disputes directly inside your chat logs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group"
          >
            <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880] mb-4 group-hover:border-[#C5A880] transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-white font-medium mb-2">No Censorship</h3>
            <p className="text-sm text-[#8E8E87] leading-relaxed">
              Our communication protocol runs wallet-to-wallet. There is no platform company that can suspend your communication lines.
            </p>
          </motion.div>
        </div>

        {/* Footer info link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 pt-8 border-t border-[#1F1F1D] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A7A72] gap-4"
        >
          <span>Communication privacy is non-negotiable. Powered by XMTP routing.</span>
          <a
            href="/hire"
            className="text-[#C5A880] hover:text-white transition-colors inline-flex items-center gap-1.5 font-mono uppercase tracking-wider"
          >
            View Active Jobs
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;