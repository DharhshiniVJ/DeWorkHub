'use client';
 
 import React, { useState, useEffect } from 'react';
 import { motion } from 'framer-motion';
 import { toast } from 'sonner';
 import { web3Service } from '@/lib/web3';
 import { AlertTriangle, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
 
 interface Web3DisputeProps {
   jobId: number;
   jobStatus?: any;
   userRole: 'Freelancer' | 'Company';
   currentUserId?: string;
   employerUserId?: string;
   freelancerUserId?: string;
   profileWalletAddress?: string;
   onDisputeRaised?: (reason: string) => void;
   onDisputeApproved?: (approvalReason: string) => void;
   onDisputeResolved?: () => void;
 }
 
 const Web3Dispute: React.FC<Web3DisputeProps> = ({
   jobId,
   jobStatus,
   userRole,
   currentUserId,
   employerUserId,
   freelancerUserId,
   profileWalletAddress,
   onDisputeRaised,
   onDisputeApproved,
   onDisputeResolved
 }) => {
   const [isWalletConnected, setIsWalletConnected] = useState(false);
   const [walletAddress, setWalletAddress] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [currentJobStatus, setCurrentJobStatus] = useState<any>(jobStatus);
   const [showResolveForm, setShowResolveForm] = useState(false);
   const [resolutionDecision, setResolutionDecision] = useState<boolean | null>(null);
   const [disputeReasonInput, setDisputeReasonInput] = useState('');
   const [approvalReasonInput, setApprovalReasonInput] = useState('');
 
   useEffect(() => {
     checkWalletConnection();
 
     if (typeof window !== 'undefined' && window.ethereum) {
       const handleAccountsChanged = async (accounts: string[]) => {
         if (accounts.length > 0) {
           const address = await web3Service.connectWallet();
           if (address) {
             setWalletAddress(address);
             setIsWalletConnected(true);
             if (jobId) {
               await fetchJobStatus();
             }
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
   }, [jobId]);
 
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
             if (jobId) {
               await fetchJobStatus();
             }
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
         if (jobId) {
           await fetchJobStatus();
         }
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
           if (jobId) {
             await fetchJobStatus();
           }
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
 
   const fetchJobStatus = async () => {
     try {
       const status = await web3Service.getJobStatus(jobId);
       setCurrentJobStatus(status);
     } catch (error) {
       console.error('Error fetching job status:', error);
     }
   };
 
   const raiseDispute = async () => {
     if (!isWalletConnected) {
       toast.error('Please connect your wallet first');
       return;
     }
 
     if (!isEmployerLoggedIn && !isFreelancerLoggedIn) {
       toast.error('Only the contract employer or freelancer can raise disputes');
       return;
     }
 
     if (!disputeReasonInput.trim()) {
       toast.error('Please explain your concern before raising a dispute');
       return;
     }
 
     setLoading(true);
     try {
       const success = await web3Service.raiseDispute(jobId, disputeReasonInput);
       if (success) {
         toast.success('Dispute initiated successfully!');
         await fetchJobStatus();
         onDisputeRaised?.(disputeReasonInput);
       } else {
         toast.error('Failed to initiate dispute');
       }
     } catch (error) {
       console.error('Error raising dispute:', error);
       toast.error('Failed to initiate dispute');
     } finally {
       setLoading(false);
     }
   };
 
   const approveDispute = async () => {
     if (!isWalletConnected) {
       toast.error('Please connect your wallet first');
       return;
     }
 
     setLoading(true);
     try {
       const reason = approvalReasonInput.trim() || 'No response provided';
       const success = await web3Service.approveDispute(jobId, reason);
       if (success) {
         toast.success('Dispute approved and submitted to DAO!');
         await fetchJobStatus();
         onDisputeApproved?.(reason);
       } else {
         toast.error('Failed to approve dispute');
       }
     } catch (error) {
       console.error('Error approving dispute:', error);
       toast.error('Failed to approve dispute');
     } finally {
       setLoading(false);
     }
   };
 
   const resolveDispute = async () => {
     if (!isWalletConnected) {
       toast.error('Please connect your wallet first');
       return;
     }
 
     if (resolutionDecision === null) {
       toast.error('Please select a resolution decision');
       return;
     }
 
     setLoading(true);
     try {
       const success = await web3Service.resolveDispute(jobId, resolutionDecision);
       if (success) {
         const decision = resolutionDecision ? 'in favor of the freelancer' : 'in favor of the employer';
         toast.success(`Dispute resolved ${decision}!`);
         await fetchJobStatus();
         setShowResolveForm(false);
         setResolutionDecision(null);
         onDisputeResolved?.();
       } else {
         toast.error('Failed to resolve dispute');
       }
     } catch (error) {
       console.error('Error resolving dispute:', error);
       toast.error('Failed to resolve dispute');
     } finally {
       setLoading(false);
     }
   };
 
   const isPendingDispute = currentJobStatus?.disputeInitiator && 
     currentJobStatus.disputeInitiator !== '0x0000000000000000000000000000000000000000' && 
     !currentJobStatus.isDisputed;
 
   const getStatusIcon = () => {
     if (currentJobStatus?.isDisputed) {
       return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
     }
     if (isPendingDispute) {
       return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
     }
     if (currentJobStatus?.isCompleted) {
       return <CheckCircle className="w-4 h-4 text-green-500" />;
     }
     if (currentJobStatus?.isHired) {
       return <Clock className="w-4 h-4 text-blue-500" />;
     }
     return <Shield className="w-4 h-4 text-[#8E8E87]" />;
   };
 
   const getStatusText = () => {
     if (currentJobStatus?.isDisputed) {
       return 'Dispute Active';
     }
     if (isPendingDispute) {
       return 'Dispute Pending Approval';
     }
     if (currentJobStatus?.isCompleted) {
       return 'Completed';
     }
     if (currentJobStatus?.isHired) {
       return 'In Progress';
     }
     return 'Posted';
   };
 
   const isEmployerLoggedIn = !!(
     currentUserId &&
     employerUserId &&
     currentUserId.toString() === employerUserId.toString()
   );
   const isFreelancerLoggedIn = !!(
     currentUserId &&
     freelancerUserId &&
     currentUserId.toString() === freelancerUserId.toString()
   );
 
   const isUserInitiator = !!(
     currentJobStatus &&
     currentJobStatus.disputeInitiator &&
     currentJobStatus.disputeInitiator !== '0x0000000000000000000000000000000000000000' &&
     (
       (isEmployerLoggedIn && currentJobStatus.disputeInitiator.toLowerCase() === currentJobStatus.employer.toLowerCase()) ||
       (isFreelancerLoggedIn && currentJobStatus.disputeInitiator.toLowerCase() === currentJobStatus.freelancer.toLowerCase())
     )
   );
 
   const isProfileWalletMatching = !!(
     walletAddress &&
     profileWalletAddress &&
     walletAddress.toLowerCase() === profileWalletAddress.toLowerCase()
   );
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 15 }}
       animate={{ opacity: 1, y: 0 }}
       className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-6 text-[#F5F5F4]"
     >
       <div className="flex items-center mb-4">
         <div className="w-8 h-8 border border-red-900/30 bg-[#121211] rounded flex items-center justify-center mr-3 text-red-500">
           <Shield className="w-4 h-4" />
         </div>
         <h3 className="text-base font-serif font-medium text-white">Dispute Arbitration</h3>
       </div>
 
       {/* Job Status */}
       {currentJobStatus && (
         <div className="mb-4 p-4 bg-[#121211] border border-[#1F1F1D] rounded">
           <div className="flex items-center justify-between">
             <div className="flex items-center">
               {getStatusIcon()}
               <span className="ml-2 text-xs font-mono uppercase tracking-wider text-[#F5F5F4]">
                 Status: {getStatusText()}
               </span>
             </div>
             {currentJobStatus.budget && (
               <span className="text-xs font-mono text-[#C5A880]">
                 Budget: {currentJobStatus.budget} ETH
               </span>
             )}
           </div>
         </div>
       )}
 
       {!isWalletConnected ? (
         <div className="space-y-4">
           <div className="bg-yellow-950/10 border border-yellow-800 text-yellow-250 p-4 rounded text-xs leading-relaxed">
             Connect your MetaMask wallet to engage in dispute terms.
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
 
           {/* Wallet mismatch warning */}
           {!isProfileWalletMatching && profileWalletAddress && walletAddress && (
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
 
           {/* Missing profile wallet warning */}
           {!profileWalletAddress && (
             <div className="bg-yellow-950/10 border border-yellow-800 text-yellow-250 p-4 rounded text-xs flex items-start gap-2">
               <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
               <div>
                 <p className="font-bold text-white">No Wallet Registered</p>
                 <p className="mt-1 leading-relaxed text-[#8E8E87]">
                   You have not linked a Web3 wallet to your profile. Please go to your Profile page to connect and save your wallet address.
                 </p>
               </div>
             </div>
           )}
 
           {/* Raise Dispute Form */}
           {isProfileWalletMatching && currentJobStatus?.isHired && !currentJobStatus?.isCompleted && !currentJobStatus?.isDisputed && !isPendingDispute && (
             <div className="space-y-4">
               <div className="bg-red-950/10 border border-red-800 rounded p-4 text-xs">
                 <label className="block text-xs font-mono uppercase tracking-wider text-red-400 mb-2">Explain your concern:</label>
                 <textarea
                   value={disputeReasonInput}
                   onChange={(e) => setDisputeReasonInput(e.target.value)}
                   placeholder="Explain why you are raising a dispute on this contract..."
                   className="w-full p-3 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-xs leading-relaxed"
                   rows={4}
                   required
                 />
               </div>
               <motion.button
                 onClick={raiseDispute}
                 disabled={loading || !disputeReasonInput.trim()}
                 className="w-full bg-[#C5A880] text-black py-2.5 px-4 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all disabled:opacity-50"
                 whileTap={{ scale: loading || !disputeReasonInput.trim() ? 1 : 0.98 }}
               >
                 {loading ? 'Processing...' : 'Raise Dispute on Blockchain'}
               </motion.button>
             </div>
           )}
 
           {/* Pending Dispute approval UI */}
           {isPendingDispute && (
             <div className="space-y-4">
               <div className="bg-amber-950/10 border border-amber-800 rounded p-4 text-xs">
                 <div className="flex items-center text-amber-400 mb-2 font-bold">
                   <Clock className="w-4 h-4 mr-2" />
                   <span>Dispute Pending Approval</span>
                 </div>
                 <div className="space-y-1.5 text-[#8E8E87] mt-2">
                   <p><strong>Reason:</strong> {currentJobStatus?.disputeReason || 'No reason provided'}</p>
                   <p><strong>Initiated By:</strong> {currentJobStatus?.disputeInitiator === currentJobStatus?.employer ? 'Employer' : 'Freelancer'}</p>
                 </div>
               </div>
 
               {isProfileWalletMatching && (
                 isUserInitiator ? (
                   <div className="bg-[#121211] border border-[#1F1F1D] text-[#8E8E87] p-4 rounded text-xs leading-relaxed">
                     Dispute pending approval from the other party. Once they approve, the milestone will be automatically sent to the DAO for mutual consent arbitration.
                   </div>
                 ) : (
                   <div className="space-y-4">
                     <div className="bg-yellow-950/10 border border-yellow-800 text-yellow-250 p-4 rounded text-xs leading-relaxed">
                       The other party has initiated a dispute. You must approve the dispute to submit it to the DAO for mutual consent arbitration.
                     </div>
                     <div className="bg-amber-950/10 border border-amber-800 rounded p-4 text-xs">
                       <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">Explain response (Optional):</label>
                       <textarea
                         value={approvalReasonInput}
                         onChange={(e) => setApprovalReasonInput(e.target.value)}
                         placeholder="Explain your side of the story or response to the dispute..."
                         className="w-full p-3 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-xs leading-relaxed"
                         rows={4}
                       />
                     </div>
                     <motion.button
                       onClick={approveDispute}
                       disabled={loading}
                       className="w-full bg-[#C5A880] text-black py-2.5 px-4 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all disabled:opacity-50"
                       whileTap={{ scale: loading ? 1 : 0.98 }}
                     >
                       {loading ? 'Processing...' : 'Approve DAO Arbitration'}
                     </motion.button>
                   </div>
                 )
               )}
             </div>
           )}
 
           {/* Dispute Resolution (DAO/Admin) */}
           {currentJobStatus?.isDisputed && (
             <div className="space-y-4">
               <div className="bg-red-950/10 border border-red-805 rounded p-4 text-xs">
                 <div className="flex items-center text-red-400 mb-1.5 font-bold">
                   <AlertTriangle className="w-4 h-4 mr-2 animate-pulse" />
                   <span>Dispute Active</span>
                 </div>
                 <p className="text-[#8E8E87] leading-relaxed">
                   This contract is currently under dispute resolution in the DAO Governance dashboard.
                 </p>
                 {currentJobStatus.disputeReason && (
                   <p className="text-xs text-[#A3A39C] mt-2.5 p-2.5 bg-[#121211] border border-[#1F1F1D] rounded leading-relaxed">
                     <strong>Reason:</strong> {currentJobStatus.disputeReason}
                   </p>
                 )}
               </div>
 
               {!showResolveForm ? (
                 <div className="bg-[#121211] border border-[#1F1F1D] p-4 rounded text-xs text-[#8E8E87] leading-relaxed">
                   {isEmployerLoggedIn || isFreelancerLoggedIn ? (
                     <>
                       Arbitration is in progress. As a party to this dispute, you cannot vote on this proposal. Awaiting DAO voting outcomes...
                       <a href="/dao" className="block mt-2.5 text-[#C5A880] hover:underline font-mono uppercase tracking-wider text-[10px] font-bold">
                         Go to DAO Dashboard &rarr;
                       </a>
                     </>
                   ) : (
                     <>
                       Arbitration is in progress. Members of the DAO can vote on the resolution proposal.
                       <a href="/dao" className="block mt-2.5 text-[#C5A880] hover:underline font-mono uppercase tracking-wider text-[10px] font-bold">
                         Go to DAO Dashboard &rarr;
                       </a>
                     </>
                   )}
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div>
                     <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">
                       Resolution Decision
                     </label>
                     <div className="space-y-2 text-sm text-[#A3A39C]">
                       <label className="flex items-center cursor-pointer">
                         <input
                           type="radio"
                           name="resolution"
                           value="true"
                           checked={resolutionDecision === true}
                           onChange={() => setResolutionDecision(true)}
                           className="mr-2 border-[#1F1F1D] bg-[#121211] checked:bg-[#C5A880]"
                         />
                         <span>Pay Freelancer (Release escrow)</span>
                       </label>
                       <label className="flex items-center cursor-pointer">
                         <input
                           type="radio"
                           name="resolution"
                           value="false"
                           checked={resolutionDecision === false}
                           onChange={() => setResolutionDecision(false)}
                           className="mr-2 border-[#1F1F1D] bg-[#121211] checked:bg-[#C5A880]"
                         />
                         <span>Refund Employer (Return escrow)</span>
                       </label>
                     </div>
                   </div>
 
                   <div className="flex gap-2 mt-4">
                     <motion.button
                       onClick={resolveDispute}
                       disabled={loading || resolutionDecision === null}
                       className="flex-1 bg-[#C5A880] text-black py-2 px-4 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all disabled:opacity-50"
                       whileTap={{ scale: loading ? 1 : 0.98 }}
                     >
                       {loading ? 'Processing...' : 'Confirm Resolution'}
                     </motion.button>
                     <motion.button
                       onClick={() => {
                         setShowResolveForm(false);
                         setResolutionDecision(null);
                       }}
                       className="flex-1 border border-[#1F1F1D] text-[#A3A39C] hover:text-white py-2 px-4 rounded text-xs font-semibold transition-all"
                       whileTap={{ scale: 0.98 }}
                     >
                       Cancel
                     </motion.button>
                   </div>
                 </div>
               )}
             </div>
           )}
 
           {currentJobStatus?.isCompleted && (
             <div className="bg-green-950/10 border border-green-800 text-green-200 p-4 rounded text-xs">
               <div className="flex items-center">
                 <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                 <p className="font-bold">Job Completed</p>
               </div>
               <p className="text-[#8E8E87] mt-1 leading-relaxed">
                 Payment has been released on-chain and work certificate NFT has been issued.
               </p>
             </div>
           )}
         </div>
       )}
     </motion.div>
   );
 };
 
 export default Web3Dispute;