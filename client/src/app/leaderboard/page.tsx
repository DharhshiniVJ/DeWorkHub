'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Award, ShieldCheck, Database, ArrowRight } from 'lucide-react';

const Leaderboard = () => {
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
              Trustless Leaderboard
            </h1>
            <p className="text-lg text-[#A3A39C] max-w-2xl leading-relaxed">
              Find the top-performing freelancers and employers based entirely on completed contract metrics. No manual rating edits, no fake accounts, and no paid review boosts—just pure on-chain records.
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-white font-medium mb-2">Verified Reviews</h3>
            <p className="text-sm text-[#8E8E87] leading-relaxed">
              Every rank and star rating is calculated directly from your wallet's Reputation NFTs. There are no fake profiles or bought ratings like in Web2.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group"
          >
            <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880] mb-4 group-hover:border-[#C5A880] transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-white font-medium mb-2">Earnings Leaderboard</h3>
            <p className="text-sm text-[#8E8E87] leading-relaxed">
              Freelancers are ranked by actual escrow volume successfully completed on-chain, proving real work experience and successful projects.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group"
          >
            <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880] mb-4 group-hover:border-[#C5A880] transition-colors">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-white font-medium mb-2">Transparent Metrics</h3>
            <p className="text-sm text-[#8E8E87] leading-relaxed">
              Our leaderboard records are open and stored on the blockchain, so anyone can inspect the smart contract data directly.
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
          <span>Under active development. Powered by ReputationNFT smart contracts.</span>
          <a
            href="/profile"
            className="text-[#C5A880] hover:text-white transition-colors inline-flex items-center gap-1.5 font-mono uppercase tracking-wider"
          >
            View Your Profile
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;