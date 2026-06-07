'use client';
 
 import React, { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { toast } from 'sonner';
 import Navbar from '@/components/Navbar';
 import { web3Service } from '@/lib/web3';
 import axios from 'axios';
 import { Award, Star, BookOpen, Shield, ShieldAlert, ExternalLink, Loader2 } from 'lucide-react';
 
 interface User {
   _id: string;
   name: string;
   email: string;
   role: 'Freelancer' | 'Company';
   walletAddress?: string;
   rating: number;
 }
 
 interface ReputationNFT {
   tokenId: string;
   tokenURI: string;
   metadata?: any;
 }
 
 const getAttribute = (attributes: any[] | undefined, traitType: string): any => {
   if (!attributes || !Array.isArray(attributes)) return null;
   const attr = attributes.find(a => a.trait_type === traitType);
   return attr ? attr.value : null;
 };
 
 const ReputationDashboard = () => {
   const [user, setUser] = useState<User | null>(null);
   const [walletAddress, setWalletAddress] = useState<string | null>(null);
   const [isWalletConnected, setIsWalletConnected] = useState(false);
   const [nfts, setNfts] = useState<ReputationNFT[]>([]);
   const [loading, setLoading] = useState(true);
   const [walletLoading, setWalletLoading] = useState(false);
 
   useEffect(() => {
     fetchUserData();
   }, []);
 
   const fetchUserData = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         setLoading(false);
         return;
       }
 
       const res = await axios.get('/api/auth/user', {
         headers: { Authorization: `Bearer ${token}` }
       });
 
       setUser(res.data.user);
 
       if (res.data.user.walletAddress) {
         setWalletAddress(res.data.user.walletAddress);
         setIsWalletConnected(true);
         await web3Service.connectWallet();
         await fetchNFTsFromContract(res.data.user.walletAddress);
       }
     } catch (error) {
       console.error('Error fetching user data:', error);
       toast.error('Failed to load profile details');
     } finally {
       setLoading(false);
     }
   };
 
   const connectWallet = async () => {
     setWalletLoading(true);
     try {
       const address = await web3Service.connectWallet();
       if (address) {
         setWalletAddress(address);
         setIsWalletConnected(true);
 
         const token = localStorage.getItem('token');
         if (token) {
           await axios.put('/api/auth/user', 
             { walletAddress: address },
             { headers: { Authorization: `Bearer ${token}` } }
           );
         }
 
         await fetchNFTsFromContract(address);
         toast.success('Wallet connected successfully!');
       } else {
         toast.error('Failed to connect wallet');
       }
     } catch (error) {
       console.error('Error connecting wallet:', error);
       toast.error('Failed to connect wallet');
     } finally {
       setWalletLoading(false);
     }
   };
 
   const fetchNFTsFromContract = async (address: string) => {
     try {
       const fetchedNfts = await web3Service.getReputationNFTs(address);
       
       const nftDataList = await Promise.all(
         fetchedNfts.map(async (nft) => {
           try {
             const metaRes = await axios.get(nft.tokenURI);
             return {
               ...nft,
               metadata: metaRes.data
             };
           } catch (err) {
             console.error(`Failed to fetch metadata for token #${nft.tokenId} from ${nft.tokenURI}:`, err);
             return {
               ...nft,
               metadata: null
             };
           }
         })
       );
 
       setNfts(nftDataList);
     } catch (error) {
       console.error('Error loading Reputation NFTs:', error);
       toast.error('Could not load reputation tokens from smart contract');
     }
   };
 
   if (loading) {
     return (
       <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4] font-sans">
         <Navbar />
         <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)]">
           <Loader2 className="h-10 w-10 text-[#C5A880] animate-spin mb-4" />
           <p className="text-xs font-mono uppercase tracking-widest text-[#8E8E87]">Loading Reputation Dashboard...</p>
         </div>
       </div>
     );
   }
 
   if (!user) {
     return (
       <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4] font-sans">
         <Navbar />
         <div className="flex justify-center items-center h-[calc(100vh-64px)] p-6">
           <div className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-8 max-w-md w-full text-center shadow-xs">
             <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
             <h2 className="text-xl font-serif font-medium text-white mb-2">Access Denied</h2>
             <p className="text-sm text-[#8E8E87] mb-6">Please log in to view your Reputation NFT Dashboard.</p>
           </div>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4] font-sans selection:bg-[#E2A93E] selection:text-black">
       <Navbar />
 
       <div className="max-w-6xl mx-auto p-6">
         <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
           className="mb-8"
         >
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
               <h1 className="text-3xl font-serif text-white font-medium">
                 Reputation Dashboard
               </h1>
               <p className="text-xs text-[#8E8E87] mt-1 font-mono uppercase tracking-wider">
                 Manage and showcase your trust tokens earned from completing contracts.
               </p>
             </div>
 
             {!isWalletConnected ? (
               <motion.button
                 onClick={connectWallet}
                 disabled={walletLoading}
                 className="bg-[#C5A880] text-black font-semibold py-2.5 px-6 rounded text-sm hover:bg-[#E2A93E] flex items-center justify-center transition-all disabled:opacity-50"
                 whileTap={{ scale: 0.98 }}
               >
                 {walletLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                 Connect Web3 Wallet
               </motion.button>
             ) : (
               <div className="bg-[#0F0F0E] border border-[#1F1F1D] p-3 rounded flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-xs font-mono text-gray-300">
                   {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                 </span>
               </div>
             )}
           </div>
         </motion.div>
 
         {isWalletConnected ? (
           <div className="space-y-8">
             {/* Stats Section */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-[#0F0F0E] border border-[#1F1F1D] p-6 rounded flex items-center justify-between shadow-xs"
               >
                 <div>
                   <p className="text-[#8E8E87] text-xs font-mono uppercase tracking-wider">Reputation Score</p>
                   <h3 className="text-3xl font-serif font-medium mt-1.5 text-white">{nfts.length}</h3>
                   <p className="text-[10px] text-[#8E8E87] mt-1 font-mono">Based on contract balances</p>
                 </div>
                 <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880]">
                   <Award className="w-5 h-5" />
                 </div>
               </motion.div>
 
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.05 }}
                 className="bg-[#0F0F0E] border border-[#1F1F1D] p-6 rounded flex items-center justify-between shadow-xs"
               >
                 <div>
                   <p className="text-[#8E8E87] text-xs font-mono uppercase tracking-wider">Average Rating</p>
                   <h3 className="text-3xl font-serif font-medium mt-1.5 text-white">
                     {user.rating > 0 ? user.rating.toFixed(1) : 'N/A'}
                   </h3>
                   <p className="text-[10px] text-[#8E8E87] mt-1 font-mono">Feedback from employers</p>
                 </div>
                 <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880]">
                   <Star className="w-5 h-5 fill-[#C5A880]/20" />
                 </div>
               </motion.div>
 
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="bg-[#0F0F0E] border border-[#1F1F1D] p-6 rounded flex items-center justify-between shadow-xs"
               >
                 <div>
                   <p className="text-[#8E8E87] text-xs font-mono uppercase tracking-wider">Verified status</p>
                   <h3 className="text-3xl font-serif font-medium mt-1.5 text-white">100%</h3>
                   <p className="text-[10px] text-[#8E8E87] mt-1 font-mono">On-chain cryptographically secure</p>
                 </div>
                 <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center text-[#C5A880]">
                   <BookOpen className="w-5 h-5" />
                 </div>
               </motion.div>
             </div>
 
             {/* NFTs Grid */}
             <div className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-8">
               <h2 className="text-xl font-serif font-medium mb-6 text-white flex items-center gap-2">
                 <Award className="text-[#C5A880]" />
                 Your Work Certificates
               </h2>
 
               {nfts.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {nfts.map((nft, index) => {
                     const metadata = nft.metadata;
                     
                     const title = getAttribute(metadata?.attributes, "Job Title") || "Work Certificate";
                     const company = getAttribute(metadata?.attributes, "Company") || "Unknown Company";
                     const stars = Number(getAttribute(metadata?.attributes, "Stars")) || 5;
                     const budget = getAttribute(metadata?.attributes, "Escrow Budget") || "N/A";
                     const feedback = getAttribute(metadata?.attributes, "Employer Feedback") || "Work completed successfully.";
                     
                     let cardClass = "border-[#1F1F1D] bg-[#0A0A09]";
                     let badgeText = "Bronze Certificate";
                     let badgeColor = "text-amber-600 bg-amber-950/10 border-amber-900/25";
                     let starColor = "text-amber-500";
                     
                     if (stars === 5) {
                       cardClass = "border-[#C5A880]/30 bg-[#0A0A09] shadow-xs";
                       badgeText = "Gold Certificate";
                       badgeColor = "text-[#C5A880] bg-[#C5A880]/5 border-[#C5A880]/20";
                       starColor = "text-[#C5A880]";
                     } else if (stars === 4) {
                       cardClass = "border-gray-500/20 bg-[#0A0A09] shadow-xs";
                       badgeText = "Silver Certificate";
                       badgeColor = "text-gray-300 bg-gray-400/5 border-gray-400/20";
                       starColor = "text-gray-300";
                     }
 
                     return (
                       <motion.div
                         key={nft.tokenId}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: index * 0.04 }}
                         whileHover={{ y: -2 }}
                         className={`border rounded p-6 flex flex-col justify-between transition-all duration-200 ${cardClass}`}
                       >
                         <div>
                           {/* Certificate Header */}
                           <div className="flex justify-between items-center mb-4">
                             <span className="text-[10px] font-mono text-[#8E8E87]">TOKEN ID: #{nft.tokenId}</span>
                             <span className={`text-[10px] font-mono uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                               {badgeText}
                             </span>
                           </div>
 
                           {/* Certificate Title */}
                           <h4 className="font-serif font-medium text-white text-base leading-snug truncate" title={title}>{title}</h4>
                           <p className="text-xs text-[#8E8E87] mt-1.5 truncate">Issued by: <span className="text-white font-semibold">{company}</span></p>
 
                           {/* Star Rating Render */}
                           <div className="flex items-center gap-0.5 mt-3 mb-4">
                             {Array.from({ length: 5 }).map((_, i) => (
                               <Star
                                 key={i}
                                 className={`w-3.5 h-3.5 ${i < stars ? `${starColor} fill-current` : 'text-[#1F1F1D]'}`}
                               />
                             ))}
                           </div>
 
                           {/* Employer Review Comment */}
                           <div className="bg-[#121211] p-3.5 rounded border border-[#1F1F1D] mb-4 h-24 overflow-y-auto">
                             <p className="text-[9px] text-[#8E8E87] uppercase tracking-wider font-mono font-bold mb-1">Employer Review</p>
                             <p className="text-xs text-[#A3A39C] italic leading-relaxed">
                               &quot;{feedback}&quot;
                             </p>
                           </div>
                         </div>
 
                         {/* Footer Info */}
                         <div className="border-t border-[#1F1F1D] pt-3 mt-auto flex items-center justify-between text-xs text-[#8E8E87]">
                           <div>
                             <span className="block text-[#8E8E87] text-[9px] uppercase font-mono tracking-wider">Escrow Budget</span>
                             <span className="font-mono font-bold text-white mt-0.5 block">{budget}</span>
                           </div>
                           <a
                             href={nft.tokenURI}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-[#C5A880] hover:text-[#E2A93E] font-mono text-[10px] uppercase tracking-wider font-semibold inline-flex items-center gap-1"
                           >
                             Metadata
                             <ExternalLink className="w-3 h-3" />
                           </a>
                         </div>
                       </motion.div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="text-center py-12 bg-[#0A0A09] rounded border border-[#1F1F1D]">
                   <Award className="w-10 h-10 text-[#1F1F1D] mx-auto mb-4" />
                   <h3 className="font-serif text-lg text-white mb-1">No reputation tokens</h3>
                   <p className="text-xs text-[#8E8E87] max-w-xs mx-auto leading-relaxed">
                     Complete contract assignments with Web3 escrow to start earning FRP Reputation NFTs.
                   </p>
                 </div>
               )}
             </div>
           </div>
         ) : (
           <div className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-12 text-center shadow-xs max-w-2xl mx-auto">
             <Shield className="w-12 h-12 text-[#C5A880]/70 mx-auto mb-4" />
             <h3 className="text-xl font-serif font-medium text-white mb-2">Wallet Disconnected</h3>
             <p className="text-sm text-[#8E8E87] max-w-md mx-auto mb-6 leading-relaxed">
               Please connect your MetaMask wallet containing your registered profile address to query your reputation certificates.
             </p>
             <motion.button
               onClick={connectWallet}
               disabled={walletLoading}
               className="bg-[#C5A880] text-black font-semibold py-2.5 px-6 rounded text-sm hover:bg-[#E2A93E] flex items-center justify-center mx-auto transition-all"
               whileTap={{ scale: 0.98 }}
             >
               {walletLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
               Connect Wallet
             </motion.button>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default ReputationDashboard;
