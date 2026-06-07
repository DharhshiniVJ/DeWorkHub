'use client';
 
 import React, { useState, useEffect } from 'react';
 import { motion } from 'framer-motion';
 import { toast } from 'sonner';
 import { web3Service } from '@/lib/web3';
 import { UserCheck, DollarSign, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
 
 interface Web3HiringProps {
   jobId: number;
   jobDetails: any;
   employerWallet?: string;
   freelancerAddress: string;
   freelancerName: string;
   budget: number;
   onHireSuccess?: () => void;
 }
 
 const Web3Hiring: React.FC<Web3HiringProps> = ({
   jobId,
   jobDetails,
   employerWallet,
   freelancerAddress,
   freelancerName,
   budget,
   onHireSuccess
 }) => {
   const [isWalletConnected, setIsWalletConnected] = useState(false);
   const [walletAddress, setWalletAddress] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [showConfirmation, setShowConfirmation] = useState(false);
   const [escrowAmount, setEscrowAmount] = useState(budget.toString());
 
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
       console.error("Error checking wallet connection:", error);
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
 
   const hireFreelancer = async () => {
     if (!isWalletConnected) {
       toast.error('Please connect your wallet first');
       return;
     }
 
     if (!escrowAmount || parseFloat(escrowAmount) <= 0) {
       toast.error('Please enter a valid escrow amount');
       return;
     }
 
     if (jobId === undefined || jobId === null || isNaN(Number(jobId))) {
       toast.error('Invalid on-chain Job ID. Was this job posted on-chain?');
       return;
     }
 
     if (!freelancerAddress || freelancerAddress.trim() === '') {
       toast.error('The selected freelancer has not registered a wallet address.');
       return;
     }
 
     setLoading(true);
     try {
       const success = await web3Service.hireFreelancer(
         jobId,
         freelancerAddress,
         escrowAmount
       );
       
       if (success) {
         toast.success('Freelancer hired successfully! Payment locked in escrow.');
         onHireSuccess?.();
       } else {
         toast.error('Failed to hire freelancer');
       }
     } catch (error) {
       console.error('Error hiring freelancer:', error);
       toast.error('Failed to hire freelancer');
     } finally {
       setLoading(false);
       setShowConfirmation(false);
     }
   };
 
   const handleEscrowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = e.target.value;
     if (value === '' || parseFloat(value) >= 0) {
       setEscrowAmount(value);
     }
   };
 
   const walletMismatch =
     employerWallet &&
     walletAddress &&
     employerWallet.toLowerCase() !== walletAddress.toLowerCase();
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 15 }}
       animate={{ opacity: 1, y: 0 }}
       className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-6 text-[#F5F5F4]"
     >
       <div className="flex items-center mb-4">
         <div className="w-8 h-8 border border-[#C5A880]/30 bg-[#121211] rounded flex items-center justify-center mr-3 text-[#C5A880]">
           <UserCheck className="w-4 h-4" />
         </div>
         <h3 className="text-base font-serif font-medium text-white">Hire Candidate Escrow</h3>
       </div>
 
       {/* Job and Freelancer Details */}
       <div className="mb-6 space-y-4">
         <div className="bg-[#121211] border border-[#1F1F1D] rounded p-4">
           <h4 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-3">Job Details</h4>
           <div className="space-y-1.5 text-xs text-[#A3A39C]">
             <div className="flex justify-between">
               <span>Title:</span>
               <span className="font-semibold text-white">{jobDetails.title}</span>
             </div>
             <div className="flex justify-between">
               <span>Budget:</span>
               <span className="font-mono text-[#C5A880]">${jobDetails.budget}</span>
             </div>
             <div className="flex justify-between">
               <span>Company:</span>
               <span className="text-white">{jobDetails.companyName}</span>
             </div>
           </div>
         </div>
 
         <div className="bg-[#121211] border border-[#1F1F1D] rounded p-4">
           <h4 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-3">Freelancer Details</h4>
           <div className="space-y-1.5 text-xs text-[#A3A39C]">
             <div className="flex justify-between">
               <span>Name:</span>
               <span className="font-semibold text-white">{freelancerName}</span>
             </div>
             <div className="flex justify-between">
               <span>Wallet Address:</span>
               <span className="font-mono text-[10px] text-white">{freelancerAddress.slice(0, 6)}...{freelancerAddress.slice(-4)}</span>
             </div>
           </div>
         </div>
       </div>
 
       {walletMismatch && employerWallet && walletAddress && (
         <div className="bg-red-950/10 border border-red-800 text-red-200 p-4 rounded text-xs flex items-start gap-2 mb-4">
           <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
           <div className="flex-1">
             <p className="font-bold text-white">Wallet Mismatch</p>
             <p className="mt-1 leading-relaxed text-[#8E8E87]">
               Registered profile wallet and connected MetaMask wallet do not match. Please switch accounts.
             </p>
             <p className="mt-2 text-[10px] text-[#8E8E87] font-mono">
               Registered: {employerWallet.slice(0, 8)}...{employerWallet.slice(-6)} <br />
               Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
             </p>
             <motion.button
               onClick={reconnectWallet}
               disabled={loading}
               className="mt-3 border border-red-800 hover:bg-red-950/20 text-red-450 text-[10px] font-semibold py-1.5 px-3 rounded transition-all"
               whileTap={{ scale: loading ? 1 : 0.98 }}
             >
               {loading ? 'Connecting...' : 'Switch Account'}
             </motion.button>
           </div>
         </div>
       )}
 
       {!isWalletConnected ? (
         <div className="space-y-4">
           <div className="bg-yellow-950/10 border border-yellow-800 text-yellow-250 p-4 rounded text-xs leading-relaxed">
             Connect your MetaMask wallet to release escrow assignments.
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
 
           {/* Escrow Amount Input */}
           <div>
             <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">
               Escrow Value (ETH)
             </label>
             <div className="relative">
               <input
                 type="number"
                 value={escrowAmount}
                 onChange={handleEscrowChange}
                 placeholder="Enter amount to lock in escrow"
                 className="w-full px-3 py-2 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-xs"
                 step="0.01"
                 min="0"
               />
               <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-[#8E8E87]">ETH</div>
             </div>
             <p className="text-[10px] text-[#8E8E87] mt-1.5">
               Funds will remain locked within the escrow contract until milestone approval or dispute completion.
             </p>
           </div>
 
           {/* Security Information */}
           <div className="bg-[#121211] border border-[#1F1F1D] rounded p-4">
             <div className="flex items-start">
               <Shield className="w-4 h-4 text-[#C5A880] mr-2 mt-0.5" />
               <div>
                 <h4 className="text-xs font-mono uppercase tracking-wider text-white mb-1">Contract Compliance</h4>
                 <ul className="text-xs text-[#A3A39C] space-y-1">
                   <li>- Milestone budgets are locked in blockchain source</li>
                   <li>- Code deliverables released upon matching keys</li>
                   <li>- Secure arbitration routing</li>
                 </ul>
               </div>
             </div>
           </div>
 
           {!showConfirmation ? (
             <motion.button
               onClick={() => setShowConfirmation(true)}
               disabled={
                 loading ||
                 walletMismatch ||
                 !escrowAmount ||
                 parseFloat(escrowAmount) <= 0
               }
               className="w-full bg-[#C5A880] text-black py-2.5 px-4 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all disabled:opacity-50"
               whileTap={{ scale: loading ? 1 : 0.98 }}
             >
               Review & Lock Escrow
             </motion.button>
           ) : (
             <div className="space-y-4">
               <div className="bg-yellow-950/10 border border-yellow-800 text-yellow-250 p-4 rounded text-xs leading-relaxed">
                 <h4 className="font-bold text-white mb-2">Confirm terms</h4>
                 <div className="space-y-1 text-[#8E8E87]">
                   <p>- You will secure {escrowAmount} ETH within Job Escrow</p>
                   <p>- Funds release upon milestone validation</p>
                   <p>- Actions are immutable on-chain</p>
                 </div>
               </div>
 
               <div className="flex gap-2">
                 <motion.button
                   onClick={hireFreelancer}
                   disabled={loading}
                   className="flex-1 bg-[#C5A880] text-black py-2.5 px-4 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all disabled:opacity-50"
                   whileTap={{ scale: loading ? 1 : 0.98 }}
                 >
                   {loading ? 'Processing...' : 'Confirm escrow'}
                 </motion.button>
                 <motion.button
                   onClick={() => setShowConfirmation(false)}
                   className="flex-1 border border-[#1F1F1D] text-[#A3A39C] hover:text-white py-2.5 px-4 rounded text-xs font-semibold transition-all"
                   whileTap={{ scale: 0.98 }}
                 >
                   Cancel
                 </motion.button>
               </div>
             </div>
           )}
         </div>
       )}
     </motion.div>
   );
 };
 
 export default Web3Hiring;