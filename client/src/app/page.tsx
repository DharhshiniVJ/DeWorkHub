'use client';
 
 import Link from 'next/link';
 import React, { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { Shield, Coins, Scale, FileCheck, Users, Wallet, ArrowRight, ArrowUpRight } from 'lucide-react';
 
 const Home = () => {
   const [scrollY, setScrollY] = useState(0);
 
   useEffect(() => {
     const handleScroll = () => {
       setScrollY(window.scrollY);
     };
     
     window.addEventListener('scroll', handleScroll);
     return () => window.removeEventListener('scroll', handleScroll);
   }, []);
 
   return (
     <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4] font-sans selection:bg-[#E2A93E] selection:text-black overflow-x-hidden">
       {/* Minimalist Top Border */}
       <div className="h-1 bg-[#C5A880]/30 w-full" />
 
       {/* Navbar */}
       <nav className={`sticky top-0 z-50 backdrop-blur-md ${scrollY > 50 ? 'bg-[#0A0A09]/95 border-b border-[#1F1F1D]' : 'bg-transparent'} transition-all duration-300`}>
         <div className="max-w-6xl mx-auto flex justify-between items-center p-6">
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex items-center space-x-2"
           >
             <div className="h-8 w-8 border border-[#C5A880]/40 bg-[#121211] rounded flex items-center justify-center">
               <span className="text-[#C5A880] font-serif font-bold">D</span>
             </div>
             <span className="text-xl font-serif font-medium tracking-tight text-[#F5F5F4]">DeWorkHub</span>
           </motion.div>
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="flex gap-4"
           >
             <Link href="/login">
               <button className="px-4 py-2 border border-[#1F1F1D] rounded text-sm text-[#A3A39C] hover:text-[#F5F5F4] hover:border-[#C5A880]/30 transition-all">
                 Login
               </button>
             </Link>
             <Link href="/register">
               <button className="px-4 py-2 bg-[#C5A880] text-black rounded text-sm font-medium hover:bg-[#E2A93E] transition-all">
                 Register
               </button>
             </Link>
           </motion.div>
         </div>
       </nav>
       
       {/* Hero Section */}
       <section className="max-w-4xl mx-auto px-6 py-28 text-center relative">
         <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
         >
           <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-mono font-bold block mb-6">
             Decentralized Freelance Platform
           </span>
           <h1 className="text-5xl md:text-6xl font-serif text-white font-medium tracking-tight leading-[1.1] max-w-3xl mx-auto mb-8">
             Trust the game, not the player.
           </h1>
           <p className="text-lg text-[#A3A39C] max-w-2xl mx-auto leading-relaxed mb-12">
             A simple freelance platform where contracts are secured by smart escrows. Clients deposit budget, builders deliver work, and blockchain code guarantees fair payouts. No middleman can freeze your account or take your earnings.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
             <Link href="/register">
               <button className="w-full sm:w-auto px-8 py-3.5 bg-[#C5A880] text-black rounded font-medium hover:bg-[#E2A93E] transition-all flex items-center justify-center gap-2">
                 Get Started
                 <ArrowRight className="w-4 h-4" />
               </button>
             </Link>
             <Link href="/login">
               <button className="w-full sm:w-auto px-8 py-3.5 border border-[#1F1F1D] hover:border-[#C5A880]/30 rounded text-[#A3A39C] hover:text-white transition-all flex items-center justify-center gap-2 bg-[#0F0F0E]">
                 Enter Platform
                 <ArrowUpRight className="w-4 h-4 text-[#A3A39C]" />
               </button>
             </Link>
           </div>
         </motion.div>
       </section>
 
       {/* Stats Section */}
       <section className="border-y border-[#1F1F1D] bg-[#0F0F0E]/40 py-12">
         <div className="max-w-6xl mx-auto px-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {[
               { value: "100%", label: "Trustless Smart Escrows" },
               { value: "0%", label: "Custodian Payout Risks" },
               { value: "Direct", label: "Wallet-to-Wallet Pay" },
               { value: "2.0%", label: "Flat Platform Fee" }
             ].map((stat, index) => (
               <motion.div 
                 key={index} 
                 initial={{ opacity: 0, y: 10 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: index * 0.1 }}
                 className="text-center md:text-left"
               >
                 <span className="block font-serif text-3xl font-medium text-white mb-1">{stat.value}</span>
                 <span className="text-xs uppercase tracking-[0.1em] text-[#8E8E87] font-mono">{stat.label}</span>
               </motion.div>
             ))}
           </div>
         </div>
       </section>
 
       {/* Features Section - Web2 vs Web3 Security */}
       <section className="max-w-6xl mx-auto px-6 py-24">
         <div className="text-center mb-16">
           <span className="text-xs uppercase tracking-[0.2em] text-[#C5A880] font-mono font-bold block mb-4">
             Security Standards
           </span>
           <h2 className="text-3xl md:text-4xl font-serif text-white font-medium mb-4">
             Why DeWorkHub is more secure than Web2 platforms
           </h2>
           <p className="text-sm md:text-base text-[#A3A39C] max-w-xl mx-auto">
             Traditional freelance websites operate on centralized control. DeWorkHub removes the middleman, putting security directly into your Web3 wallet.
           </p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[ 
             { 
               title: "Zero Payout Lockups", 
               description: "In Web2, platforms hold your money in their bank accounts and can freeze your profile or delay payouts. On DeWorkHub, milestone funds are locked in transparent smart contracts. Payment is guaranteed and released instantly when deliverables are complete.", 
               icon: Coins 
             },
             { 
               title: "You Own Your Reputation", 
               description: "Web2 reviews are locked on their servers—if your account is suspended, you lose your work history. On DeWorkHub, completed contracts mint non-transferable Reputation NFTs to your wallet. You own your reviews forever.", 
               icon: Shield 
             },
             { 
               title: "Unbiased DAO disputes", 
               description: "Instead of corporate customer support teams choosing sides behind closed doors, disputes are escalated to on-chain DAO governance. Independent community voters verify code deliverables and vote on-chain to resolve payouts fairly.", 
               icon: Scale 
             }
           ].map((feature, index) => {
             const Icon = feature.icon;
             return (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, y: 15 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: index * 0.1 }}
                 className="p-8 bg-[#0F0F0E] rounded border border-[#1F1F1D] hover:border-[#C5A880]/30 transition-all group"
               >
                 <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880] mb-6 group-hover:border-[#C5A880]/40 transition-all">
                   <Icon className="w-5 h-5" />
                 </div>
                 <h3 className="font-serif text-xl text-white font-medium mb-3">{feature.title}</h3>
                 <p className="text-sm text-[#8E8E87] leading-relaxed">{feature.description}</p>
               </motion.div>
             );
           })}
         </div>
       </section>
 
       {/* How It Works Section */}
       <section className="border-t border-[#1F1F1D] bg-[#0F0F0E]/20 py-24">
         <div className="max-w-6xl mx-auto px-6">
           <div className="text-center mb-16">
             <span className="text-xs uppercase tracking-[0.2em] text-[#C5A880] font-mono font-bold block mb-4">
               Simple Flow
             </span>
             <h2 className="text-3xl md:text-4xl font-serif text-white font-medium mb-4">
               How the trustless platform works
             </h2>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             {[
               { step: "01", title: "Connect Wallet", description: "Log in and link your Web3 wallet address. Your wallet is your identity.", icon: Wallet },
               { step: "02", title: "Post or Apply", description: "Employers post jobs with fixed budgets. Freelancers apply with their cover letters.", icon: FileCheck },
               { step: "03", title: "Lock Escrow", description: "The employer deposits the contract funds into the smart contract escrow to start the job safely.", icon: Coins },
               { step: "04", title: "Release & Earn", description: "Once the job is done, the client releases the payment. You get paid instantly and receive a Reputation NFT.", icon: Users }
             ].map((item, index) => {
               const Icon = item.icon;
               return (
                 <motion.div
                   key={index}
                   initial={{ opacity: 0, y: 15 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: index * 0.1 }}
                   className="p-6 bg-[#0F0F0E] rounded border border-[#1F1F1D] relative"
                 >
                   <div className="flex justify-between items-center mb-6">
                     <span className="font-mono text-xs text-[#C5A880] tracking-wider font-bold">{item.step}</span>
                     <Icon className="w-4 h-4 text-[#8E8E87]" />
                   </div>
                   <h3 className="font-serif text-lg text-white font-medium mb-2">{item.title}</h3>
                   <p className="text-xs text-[#8E8E87] leading-relaxed">{item.description}</p>
                 </motion.div>
               );
             })}
           </div>
         </div>
       </section>
 
       {/* Testimonials */}
       <section className="max-w-6xl mx-auto px-6 py-24">
         <div className="text-center mb-16">
           <h2 className="text-3xl font-serif text-white font-medium mb-4">
             Endorsed by builders.
           </h2>
         </div>
 
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { name: "Alex Chen", role: "Protocol Engineer", quote: "No payment disputes, no intermediate gatekeeping. DeWorkHub escrow guarantees contract compliance directly on-chain." },
             { name: "Elena Rostova", role: "UI Designer", quote: "Completing milestones automatically issues reputation NFTs. My portfolio trust score is built cryptographically." },
             { name: "Marcus Vane", role: "Core Lead, Arca", quote: "We hired three frontend engineers through the platform. Escrows kept milestones structured and payouts immediate." },
           ].map((testimonial, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0, y: 15 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.1 }}
               className="p-8 bg-[#0F0F0E] rounded border border-[#1F1F1D] flex flex-col justify-between"
             >
               <p className="text-sm text-[#A3A39C] italic leading-relaxed mb-6">
                 &quot;{testimonial.quote}&quot;
               </p>
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#121211] border border-[#1F1F1D] flex items-center justify-center font-serif text-xs text-[#C5A880] font-bold">
                   {testimonial.name.charAt(0)}
                 </div>
                 <div>
                   <h4 className="font-serif text-sm text-white font-medium">{testimonial.name}</h4>
                   <p className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E87]">{testimonial.role}</p>
                 </div>
               </div>
             </motion.div>
           ))}
         </div>
       </section>
 
       {/* CTA Section */}
       <section className="max-w-5xl mx-auto px-6 pb-28">
         <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="p-12 bg-[#0F0F0E] rounded border border-[#1F1F1D] text-center"
         >
           <h2 className="text-3xl font-serif text-white font-medium mb-4">Start your trustless journey today.</h2>
           <p className="text-sm text-[#8E8E87] max-w-md mx-auto mb-8">Set up your profile, bind your Web3 wallet address, and begin secure contract terms.</p>
           <div className="flex justify-center">
             <Link href="/register">
               <button className="px-8 py-3 bg-[#C5A880] text-black rounded font-medium hover:bg-[#E2A93E] transition-all">
                 Register Profile
               </button>
             </Link>
           </div>
         </motion.div>
       </section>
 
       {/* Footer */}
       <footer className="border-t border-[#1F1F1D] bg-[#0A0A09] py-12 text-center text-xs text-[#7A7A72]">
         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center space-x-2">
             <div className="h-6 w-6 border border-[#C5A880]/30 bg-[#121211] rounded flex items-center justify-center">
               <span className="text-[#C5A880] font-serif font-bold text-xs">D</span>
             </div>
             <span className="font-serif text-[#F5F5F4]">DeWorkHub</span>
           </div>
           <div>&copy; {new Date().getFullYear()} DeWorkHub. Verified Escrow and Reputation Layer.</div>
         </div>
       </footer>
     </div>
   );
 };
 
 export default Home;