'use client';
 
 import React, { useState, useEffect } from 'react';
 import { motion } from 'framer-motion';
 import { toast } from 'sonner';
 import { web3Service } from '@/lib/web3';
 import axios from 'axios';
 import { AlertTriangle, ShieldCheck, Star } from 'lucide-react';
 
 interface Web3JobIntegrationProps {
   jobId?: string;
   budget?: number;
   freelancerAddress?: string;
   onSuccess?: (data?: { rating?: number; metadataURI?: string }) => void;
   mode: 'post' | 'hire' | 'complete';
   jobDetails?: any;
   userRole?: 'Freelancer' | 'Company';
   profileWalletAddress?: string;
 }
 
 const Web3JobIntegration: React.FC<Web3JobIntegrationProps> = ({
   jobId,
   budget,
   freelancerAddress,
   onSuccess,
   mode,
   jobDetails,
   profileWalletAddress
 }) => {
   const [isWalletConnected, setIsWalletConnected] = useState(false);
   const [walletAddress, setWalletAddress] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [rating, setRating] = useState(5);
   const [metadataURI, setMetadataURI] = useState('');
 
   useEffect(() => {
     checkWalletConnection();
 
     if (typeof window !== 'undefined' && window.ethereum) {
       const handleAccountsChanged = async (accounts: string[]) => {
         if (accounts.length > 0) {
           const address = await web3Service.connectWallet();
           if (address) {
             setWalletAddress(address);
             setIsWalletConnected(true);
           }
         } else {
           setWalletAddress(null);
           setIsWalletConnected(false);
         }
       };
 
       window.ethereum.on('accountsChanged', handleAccountsChanged);
       return () => {
         if (window.ethereum && window.ethereum.removeListener) {
           window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
         }
       };
     }
   }, []);
 
   const checkWalletConnection = async () => {
     try {
       if (typeof window !== 'undefined' && window.ethereum) {
         const accounts = await window.ethereum.request({
           method: "eth_accounts",
         });
 
         if (accounts.length > 0) {
           const address = await web3Service.connectWallet();
           if (address) {
             setWalletAddress(address);
             setIsWalletConnected(true);
           }
         }
       }
     } catch (error) {
       console.error('Error checking wallet connection:', error);
     }
   };
 
   const connectWallet = async () => {
     setLoading(true);
     try {
       const address = await web3Service.connectWallet();
       if (address) {
         setWalletAddress(address);
         setIsWalletConnected(true);
         toast.success('Wallet connected successfully!');
       } else {
         toast.error('Failed to connect wallet');
       }
     } catch (error) {
       console.error('Error connecting wallet:', error);
       toast.error('Failed to connect wallet');
     } finally {
       setLoading(false);
     }
   };
 
   const reconnectWallet = async () => {
     setLoading(true);
     try {
       if (typeof window !== 'undefined' && window.ethereum) {
         await window.ethereum.request({
           method: 'wallet_requestPermissions',
           params: [{ eth_accounts: {} }],
         });
         const address = await web3Service.connectWallet();
         if (address) {
           setWalletAddress(address);
           setIsWalletConnected(true);
           toast.success('Wallet switched and connected successfully!');
         }
       } else {
         toast.error('MetaMask not found');
       }
     } catch (error) {
       console.error('Error switching wallet account:', error);
       toast.error('Failed to switch wallet account');
     } finally {
       setLoading(false);
     }
   };
 
   const postJobOnBlockchain = async () => {
     if (!isWalletConnected) {
       toast.error('Please connect your wallet first');
       return;
     }
 
     setLoading(true);
     try {
       const blockchainJobId = await web3Service.postJob();
       if (blockchainJobId !== null) {
         const token = localStorage.getItem('token');
         if (token && jobId) {
           await axios.put('/api/jobs', 
             { jobId, blockchainJobId },
             { headers: { Authorization: `Bearer ${token}` } }
           );
         }
         toast.success(`Job posted on blockchain successfully! ID: ${blockchainJobId}`);
         onSuccess?.();
       } else {
         toast.error('Failed to post job on blockchain');
       }
     } catch (error) {
       console.error('Error posting job:', error);
       toast.error('Failed to post job on blockchain');
     } finally {
       setLoading(false);
     }
   };
 
   const hireFreelancerOnBlockchain = async () => {
     if (!isWalletConnected) {
       toast.error('Please connect your wallet first');
       return;
     }
 
     if (!jobId || !budget || !freelancerAddress) {
       toast.error('Missing required information');
       return;
     }
 
     setLoading(true);
     try {
       const success = await web3Service.hireFreelancer(
         parseInt(jobId),
         freelancerAddress,
         budget.toString()
       );
       if (success) {
         toast.success('Freelancer hired on blockchain successfully!');
         onSuccess?.();
       } else {
         toast.error('Failed to hire freelancer on blockchain');
       }
     } catch (error) {
       console.error('Error hiring freelancer:', error);
       toast.error('Failed to hire freelancer on blockchain');
     } finally {
       setLoading(false);
     }
   };
 
   const completeJobOnBlockchain = async () => {
     if (!isWalletConnected) {
       toast.error('Please connect your wallet first');
       return;
     }
 
     if (!jobId) {
       toast.error('Missing job ID');
       return;
     }
 
     setLoading(true);
     try {
       const generatedMetadataURI = `${window.location.origin}/api/reputation/metadata/${jobId}`;
       const success = await web3Service.completeJob(
         parseInt(jobId),
         rating,
         generatedMetadataURI
       );
       if (success) {
         toast.success('Job completed on blockchain successfully!');
         onSuccess?.({ rating, metadataURI: generatedMetadataURI });
       } else {
         toast.error('Failed to complete job on blockchain');
       }
     } catch (error) {
       console.error('Error completing job:', error);
       toast.error('Failed to complete job on blockchain');
     } finally {
       setLoading(false);
     }
   };
 
   const handleAction = () => {
     switch (mode) {
       case 'post':
         postJobOnBlockchain();
         break;
       case 'hire':
         hireFreelancerOnBlockchain();
         break;
       case 'complete':
         completeJobOnBlockchain();
         break;
     }
   };
 
   const getActionButtonText = () => {
     switch (mode) {
       case 'post':
         return 'Post Job on Blockchain';
       case 'hire':
         return 'Hire on Blockchain';
       case 'complete':
         return 'Complete on Blockchain';
     }
   };
 
   const getActionDescription = () => {
     switch (mode) {
       case 'post':
         return 'Post this job on the blockchain to make it immutable and trustless';
       case 'hire':
         return 'Hire the freelancer on the blockchain and lock the payment in escrow';
       case 'complete':
         return 'Complete the job on the blockchain and release payment to freelancer';
     }
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 15 }}
       animate={{ opacity: 1, y: 0 }}
       className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-6 text-[#F5F5F4]"
     >
       <div className="flex items-center mb-4">
         <div className="w-8 h-8 border border-[#C5A880]/30 bg-[#121211] rounded flex items-center justify-center mr-3 text-[#C5A880]">
           <ShieldCheck className="w-4 h-4" />
         </div>
         <h3 className="text-base font-serif font-medium text-white">Web3 Escrow Ledger</h3>
       </div>
 
       <p className="text-xs text-[#8E8E87] mb-4 leading-relaxed">{getActionDescription()}</p>
 
       {jobDetails && (
         <div className="mb-4 p-4 bg-[#121211] border border-[#1F1F1D] rounded">
           <h4 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Job Details</h4>
           <div className="space-y-1.5 text-xs text-[#A3A39C]">
             <div className="flex justify-between">
               <span>Title:</span>
               <span className="font-semibold text-white">{jobDetails.title}</span>
             </div>
             <div className="flex justify-between">
               <span>Budget:</span>
               <span className="font-mono text-[#C5A880]">${jobDetails.budget}</span>
             </div>
             {jobDetails.companyName && (
               <div className="flex justify-between">
                 <span>Company:</span>
                 <span className="text-white">{jobDetails.companyName}</span>
               </div>
             )}
             {freelancerAddress && (
               <div className="flex justify-between">
                 <span>Freelancer:</span>
                 <span className="font-mono text-[10px] text-white">{freelancerAddress.slice(0, 6)}...{freelancerAddress.slice(-4)}</span>
               </div>
             )}
           </div>
         </div>
       )}
 
       {!isWalletConnected ? (
         <div className="space-y-4">
           <div className="bg-yellow-950/10 border border-yellow-800 text-yellow-250 p-4 rounded text-xs leading-relaxed">
             Connect your MetaMask wallet to initiate Web3 operations.
           </div>
           <motion.button
             onClick={connectWallet}
             disabled={loading}
             className="w-full bg-[#C5A880] text-black py-2.5 px-4 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all disabled:opacity-50"
             whileTap={{ scale: loading ? 1 : 0.98 }}
           >
             {loading ? 'Connecting...' : 'Connect Wallet'}
           </motion.button>
         </div>
       ) : (
         <div className="space-y-4">
           <div className="bg-green-950/10 border border-green-800 text-green-200 p-3 rounded text-xs">
             <div className="flex items-center">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
               <span className="font-mono">
                 Active Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
               </span>
             </div>
           </div>
 
           {walletAddress && profileWalletAddress && walletAddress.toLowerCase() !== profileWalletAddress.toLowerCase() && (
             <div className="bg-red-950/10 border border-red-800 text-red-200 p-4 rounded text-xs flex items-start gap-2">
               <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
               <div className="flex-1">
                 <p className="font-bold text-white">Wallet Mismatch</p>
                 <p className="mt-1 leading-relaxed text-[#8E8E87]">
                   Registered profile wallet and connected MetaMask wallet do not match. Please switch accounts.
                 </p>
                 <p className="mt-2 text-[10px] text-[#8E8E87] font-mono">
                   Registered: {profileWalletAddress.slice(0, 8)}...{profileWalletAddress.slice(-6)} <br />
                   Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                 </p>
                 <motion.button
                   onClick={reconnectWallet}
                   disabled={loading}
                   className="mt-3 border border-red-800 hover:bg-red-950/20 text-red-400 text-[10px] font-semibold py-1.5 px-3 rounded transition-all"
                   whileTap={{ scale: loading ? 1 : 0.98 }}
                 >
                   {loading ? 'Connecting...' : 'Switch Account'}
                 </motion.button>
               </div>
             </div>
           )}
 
           {walletAddress && !profileWalletAddress && (
             <div className="bg-yellow-950/10 border border-yellow-800 text-yellow-250 p-4 rounded text-xs flex items-start gap-2">
               <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
               <div>
                 <p className="font-bold text-white">No Wallet Registered</p>
                 <p className="mt-1 leading-relaxed text-[#8E8E87]">
                   Please visit your Profile page to connect and save your MetaMask wallet address first.
                 </p>
               </div>
             </div>
           )}
 
           {mode === 'complete' && (
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">
                   Milestone Rating (1-5 stars)
                 </label>
                 <div className="flex space-x-1.5">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <button
                       key={star}
                       type="button"
                       onClick={() => setRating(star)}
                       className="text-xl focus:outline-none transition-all"
                     >
                       <Star className={`w-5 h-5 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                     </button>
                   ))}
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">
                   Metadata URI
                 </label>
                 <input
                   type="text"
                   value={metadataURI}
                   onChange={(e) => setMetadataURI(e.target.value)}
                   placeholder="https://api.deworkhub.com/jobs/123/metadata"
                   className="w-full px-3 py-2 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-xs"
                 />
               </div>
             </div>
           )}
 
           <motion.button
             onClick={handleAction}
             disabled={loading || (!!profileWalletAddress && !!walletAddress && walletAddress.toLowerCase() !== profileWalletAddress.toLowerCase()) || !profileWalletAddress}
             className="w-full bg-[#C5A880] text-black py-2.5 px-4 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all disabled:opacity-50"
             whileTap={{ scale: loading ? 1 : 0.98 }}
           >
             {loading ? 'Processing...' : getActionButtonText()}
           </motion.button>
         </div>
       )}
     </motion.div>
   );
 };
 
 export default Web3JobIntegration;