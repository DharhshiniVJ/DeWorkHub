'use client';
 
 import React, { useEffect, useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { toast } from 'sonner';
 import Navbar from '@/components/Navbar';
 import { web3Service } from '@/lib/web3';
 import axios from 'axios';
 import { Vote, FileText, CheckCircle2, XCircle, Clock, ShieldAlert, Play, Loader2 } from 'lucide-react';
 
 interface Proposal {
   id: number;
   jobId: number;
   decision: boolean;
   description: string;
   voteYes: number;
   voteNo: number;
   endTime: number;
   executed: boolean;
   voted?: boolean;
   isPartyToDispute?: boolean;
 }
 
 const DAOGovernance = () => {
   const [proposals, setProposals] = useState<Proposal[]>([]);
   const [loading, setLoading] = useState(true);
   const [walletConnected, setWalletConnected] = useState(false);
   const [walletAddress, setWalletAddress] = useState<string | null>(null);
   const [votingLoading, setVotingLoading] = useState<number | null>(null);
   const [executionLoading, setExecutionLoading] = useState<number | null>(null);
   const [blockchainTime, setBlockchainTime] = useState<number>(Math.floor(Date.now() / 1000));
   const [profileWallet, setProfileWallet] = useState<string | null>(null);
 
   useEffect(() => {
     checkWalletAndFetchProposals();
 
     if (typeof window !== 'undefined' && window.ethereum) {
       const handleAccountsChanged = async (accounts: string[]) => {
         if (accounts.length > 0) {
           const address = await web3Service.connectWallet();
           if (address) {
             setWalletAddress(address);
             setWalletConnected(true);
             await fetchProposals(address);
           }
         } else {
           setWalletAddress(null);
           setWalletConnected(false);
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
 
   const checkWalletAndFetchProposals = async () => {
     try {
       setLoading(true);
       
       const token = localStorage.getItem('token');
       let profileAddr = null;
       if (token) {
         const userRes = await axios.get('/api/auth/user', {
           headers: { Authorization: `Bearer ${token}` }
         });
         profileAddr = userRes.data.user.walletAddress || null;
         setProfileWallet(profileAddr);
       }
 
       const address = await web3Service.getWalletAddress();
       if (address) {
         setWalletAddress(address);
         setWalletConnected(true);
         await fetchProposals(address, profileAddr);
       } else {
         const address = await web3Service.connectWallet();
         if (address) {
           setWalletAddress(address);
           setWalletConnected(true);
           await fetchProposals(address, profileAddr);
         } else {
           setLoading(false);
         }
       }
     } catch (error) {
       console.error('Error connecting wallet or loading DAO data:', error);
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
           setWalletConnected(true);
           toast.success('Wallet switched and connected successfully!');
           await fetchProposals(address);
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
 
   const fetchProposals = async (voterAddress: string, profileAddr?: string | null) => {
     try {
       const activeProfileWallet = profileAddr !== undefined ? profileAddr : profileWallet;
       const queryAddress = activeProfileWallet || voterAddress;
       const blockTime = await web3Service.getCurrentBlockTimestamp();
       setBlockchainTime(blockTime);
       const count = await web3Service.getDAOProposalCount();
       const fetchedProposals = [];
       
       for (let i = 1; i <= count; i++) {
         const p = await web3Service.getDAOProposal(i);
         if (p) {
           const voted = await web3Service.hasUserVotedOnProposal(i, queryAddress);
           const jobDetails = await web3Service.getJobStatus(Number(p.jobId));
           const isPartyToDispute = jobDetails 
             ? (queryAddress.toLowerCase() === jobDetails.employer.toLowerCase() || 
                queryAddress.toLowerCase() === jobDetails.freelancer.toLowerCase())
             : false;
 
           fetchedProposals.push({
             id: Number(p.id),
             jobId: Number(p.jobId),
             decision: p.decision,
             description: p.description,
             voteYes: Number(p.voteYes),
             voteNo: Number(p.voteNo),
             endTime: p.endTime,
             executed: p.executed,
             voted,
             isPartyToDispute
           });
         }
       }
       
       fetchedProposals.sort((a, b) => {
         if (a.executed !== b.executed) return a.executed ? 1 : -1;
         return b.id - a.id;
       });
 
       setProposals(fetchedProposals);
     } catch (error) {
       console.error('Error fetching proposals:', error);
       toast.error('Failed to load DAO proposals');
     } finally {
       setLoading(false);
     }
   };
 
   const handleVote = async (proposalId: number, support: boolean) => {
     setVotingLoading(proposalId);
     try {
       const success = await web3Service.voteOnDAOProposal(proposalId, support);
       if (success) {
         toast.success('Vote cast successfully!');
         if (walletAddress) {
           await fetchProposals(walletAddress);
         }
       } else {
         toast.error('Failed to cast vote');
       }
     } catch (error) {
       console.error('Error voting:', error);
       toast.error('Transaction failed or user rejected');
     } finally {
       setVotingLoading(null);
     }
   };
 
   const handleExecute = async (proposal: Proposal) => {
     setExecutionLoading(proposal.id);
     try {
       const success = await web3Service.executeDAOProposal(proposal.id);
       if (success) {
         toast.success('Proposal executed on blockchain successfully!');
         
         try {
           const token = localStorage.getItem('token');
           if (token) {
             const contractsRes = await axios.get('/api/contracts/disputed', {
               headers: { Authorization: `Bearer ${token}` }
             });
             const matchingContract = contractsRes.data.find(
               (c: any) => c.jobId && Number(c.jobId.blockchainJobId) === Number(proposal.jobId)
             );
             
             if (matchingContract) {
               const finalStatus = "completed";
               await axios.post('/api/contracts/update', {
                 contractId: matchingContract._id,
                 status: finalStatus,
                 rating: 5,
                 feedback: `Resolved by DAO proposal #${proposal.id}`
               }, {
                 headers: { Authorization: `Bearer ${token}` }
               });
             }
           }
         } catch (dbErr) {
           console.error('Error syncing DAO execution with MongoDB:', dbErr);
         }
 
         if (walletAddress) {
           await fetchProposals(walletAddress);
         }
       } else {
         toast.error('Execution failed: check proposal vote outcomes');
       }
     } catch (error) {
       console.error('Error executing proposal:', error);
       toast.error('Transaction reverted or failed');
     } finally {
       setExecutionLoading(null);
     }
   };
 
   const isVotingClosed = (proposal: Proposal) => {
     return blockchainTime >= proposal.endTime;
   };
 
   const getProposalOutcome = (proposal: Proposal) => {
     const passed = proposal.voteYes > proposal.voteNo;
     const finalDecision = passed ? proposal.decision : !proposal.decision;
     const payVotes = proposal.decision ? proposal.voteYes : proposal.voteNo;
     const refundVotes = proposal.decision ? proposal.voteNo : proposal.voteYes;
     return {
       text: finalDecision ? 'Paid Freelancer' : 'Refunded Employer',
       color: finalDecision 
         ? 'text-green-400 bg-green-500/5 border-green-500/20' 
         : 'text-yellow-400 bg-yellow-500/5 border-yellow-500/20',
       reason: payVotes === refundVotes 
         ? 'Resolved by default (tie)' 
         : payVotes > refundVotes 
           ? `Resolved by majority vote: Pay Freelancer (${payVotes} vs ${refundVotes})` 
           : `Resolved by majority vote: Refund Employer (${refundVotes} vs ${payVotes})`
     };
   };
 
   const getProposalStatus = (proposal: Proposal) => {
     if (proposal.executed) return { text: 'Executed', color: 'text-green-400 bg-green-500/5 border-green-500/20' };
     if (isVotingClosed(proposal)) {
       if (proposal.voteYes === proposal.voteNo) {
         return { text: 'Tie (Cannot Execute)', color: 'text-red-400 bg-red-500/5 border-red-500/20' };
       }
       return { text: 'Awaiting Execution', color: 'text-blue-400 bg-blue-500/5 border-blue-500/20' };
     }
     return { text: 'Active Voting', color: 'text-yellow-400 bg-yellow-500/5 border-yellow-500/20' };
   };
 
   const getFormattedTime = (timestamp: number) => {
     const date = new Date(timestamp * 1000);
     return date.toLocaleString();
   };
 
   const isMismatchOrMissing = !profileWallet || !!(walletAddress && profileWallet && walletAddress.toLowerCase() !== profileWallet.toLowerCase());
 
   return (
     <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4] font-sans selection:bg-[#E2A93E] selection:text-black">
       <Navbar />
 
       <div className="max-w-6xl mx-auto p-6">
         {/* Header Section */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
           <div>
             <h1 className="text-3xl font-serif text-white font-medium">
               DAO Governance
             </h1>
             <p className="text-xs text-[#8E8E87] mt-1 font-mono uppercase tracking-wider">
               Vote on disputes and verify community-led resolution execution.
             </p>
           </div>
 
           <div className="flex gap-3">
             <div className="bg-[#0F0F0E] border border-[#1F1F1D] p-3 rounded flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${walletConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-xs font-mono text-gray-300">
                 {walletConnected ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : 'Disconnected'}
               </span>
             </div>
           </div>
         </div>
 
         {loading ? (
           <div className="flex flex-col justify-center items-center py-24">
             <Loader2 className="h-8 w-8 text-[#C5A880] animate-spin mb-4" />
             <p className="text-xs font-mono uppercase tracking-widest text-[#8E8E87]">Loading governance proposals...</p>
           </div>
         ) : !walletConnected ? (
           <div className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-12 text-center shadow-xs max-w-2xl mx-auto">
             <Vote className="w-12 h-12 text-[#C5A880]/70 mx-auto mb-4" />
             <h3 className="text-xl font-serif font-medium text-white mb-2">Wallet Disconnected</h3>
             <p className="text-sm text-[#8E8E87] max-w-md mx-auto mb-6 leading-relaxed">
               Please connect your MetaMask wallet to query active dispute proposals and vote.
             </p>
             <motion.button
               onClick={checkWalletAndFetchProposals}
               className="bg-[#C5A880] text-black font-semibold py-2.5 px-6 rounded text-sm hover:bg-[#E2A93E] transition-all"
               whileTap={{ scale: 0.98 }}
             >
               Connect Wallet
             </motion.button>
           </div>
         ) : (
           <div className="space-y-6">
             {/* Wallet Mismatch warning */}
             {walletAddress && profileWallet && walletAddress.toLowerCase() !== profileWallet.toLowerCase() && (
               <div className="bg-red-950/10 border border-red-800 text-red-200 p-6 rounded flex items-start gap-4 max-w-4xl mx-auto shadow-xs">
                 <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
                 <div className="flex-1">
                   <h4 className="font-serif text-base font-medium text-white">Wallet Mismatch</h4>
                   <p className="text-xs text-[#8E8E87] mt-1 leading-relaxed">
                     Registered profile wallet and active MetaMask account address do not match. Please switch accounts in MetaMask.
                   </p>
                   <p className="text-[10px] text-[#8E8E87] mt-2.5 font-mono">
                     Registered Profile: {profileWallet} <br />
                     Active MetaMask: {walletAddress}
                   </p>
                   <motion.button
                     onClick={reconnectWallet}
                     disabled={loading}
                     className="mt-4 border border-red-800 hover:bg-red-950/20 text-red-400 font-semibold py-2 px-4 rounded text-xs disabled:opacity-50 transition-all"
                     whileTap={{ scale: loading ? 1 : 0.98 }}
                   >
                     {loading ? 'Connecting...' : 'Switch Account'}
                   </motion.button>
                 </div>
               </div>
             )}
 
             {/* Missing profile wallet warning */}
             {walletAddress && !profileWallet && (
               <div className="bg-yellow-950/10 border border-yellow-800 text-yellow-250 p-6 rounded flex items-start gap-4 max-w-4xl mx-auto shadow-xs">
                 <ShieldAlert className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                 <div>
                   <h4 className="font-serif text-base font-medium text-white">No Wallet Registered</h4>
                   <p className="text-xs text-[#8E8E87] mt-1 leading-relaxed">
                     You have not linked a Web3 wallet to your DeWorkHub profile. Please navigate to your Profile page to connect and save your wallet address.
                   </p>
                 </div>
               </div>
             )}
 
             {/* Proposals List */}
             {proposals.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {proposals.map((proposal) => {
                   const status = getProposalStatus(proposal);
                   const payVotes = proposal.decision ? proposal.voteYes : proposal.voteNo;
                   const refundVotes = proposal.decision ? proposal.voteNo : proposal.voteYes;
                   const totalVotes = payVotes + refundVotes;
                   const payPercent = totalVotes > 0 ? (payVotes / totalVotes) * 100 : 0;
                   const refundPercent = totalVotes > 0 ? (refundVotes / totalVotes) * 100 : 0;
                   const isClosed = isVotingClosed(proposal);
                   const votingActive = !isClosed && !proposal.executed;
 
                   return (
                     <motion.div
                       key={proposal.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-6 shadow-xs flex flex-col justify-between"
                     >
                       <div>
                         {/* Proposal Header */}
                         <div className="flex justify-between items-start gap-2 mb-4">
                           <div>
                             <span className="text-[10px] font-mono text-[#8E8E87] block uppercase tracking-wider">PROPOSAL #{proposal.id}</span>
                             <h3 className="font-serif text-white font-medium text-base mt-1">Dispute for Job ID: #{proposal.jobId}</h3>
                           </div>
                           <span className={`text-[10px] font-mono uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${status.color}`}>
                             {status.text}
                           </span>
                         </div>
 
                         {/* Proposal Description */}
                         <div className="bg-[#121211] p-4 rounded border border-[#1F1F1D] mb-6">
                           <p className="text-sm text-[#A3A39C] leading-relaxed italic">
                             &quot;{proposal.description}&quot;
                           </p>
                           <div className="flex items-center gap-1.5 mt-3 text-xs text-[#C5A880] font-mono uppercase tracking-wider">
                             <FileText className="w-3.5 h-3.5" />
                             Arbitration Option: {proposal.decision ? 'Pay Freelancer' : 'Refund Employer'}
                           </div>
                           
                           {proposal.executed && (() => {
                             const outcome = getProposalOutcome(proposal);
                             return (
                               <div className={`mt-3 p-3 rounded border text-xs flex flex-col gap-1 ${outcome.color}`}>
                                 <span className="font-serif font-medium text-white">
                                   Final Decision: {outcome.text}
                                 </span>
                                 <span className="text-[#8E8E87] font-mono">
                                   {outcome.reason}
                                 </span>
                               </div>
                             );
                           })()}
                         </div>
 
                         {/* Vote Percentages & Progress Bars */}
                         <div className="space-y-4 mb-6">
                           <div>
                             <div className="flex justify-between text-xs font-mono mb-1.5">
                               <span className="text-green-400">Pay Freelancer</span>
                               <span>{payVotes} votes ({payPercent.toFixed(0)}%)</span>
                             </div>
                             <div className="w-full bg-[#121211] h-1.5 rounded-full overflow-hidden border border-[#1F1F1D]">
                               <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${payPercent}%` }}></div>
                             </div>
                           </div>
 
                           <div>
                             <div className="flex justify-between text-xs font-mono mb-1.5">
                               <span className="text-red-400">Refund Employer</span>
                               <span>{refundVotes} votes ({refundPercent.toFixed(0)}%)</span>
                             </div>
                             <div className="w-full bg-[#121211] h-1.5 rounded-full overflow-hidden border border-[#1F1F1D]">
                               <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${refundPercent}%` }}></div>
                             </div>
                           </div>
                         </div>
                       </div>
 
                       {/* Controls and Footer */}
                       <div className="border-t border-[#1F1F1D] pt-4 mt-auto">
                         <div className="flex items-center text-[10px] font-mono text-[#8E8E87] uppercase tracking-wider mb-4">
                           <Clock className="w-3.5 h-3.5 mr-1" />
                           <span>Voting ends: {getFormattedTime(proposal.endTime)}</span>
                         </div>
 
                         <div className="flex gap-2">
                           {votingActive && !proposal.voted && (
                             proposal.isPartyToDispute ? (
                               <div className="w-full bg-yellow-950/10 border border-yellow-800 text-yellow-250 py-3 px-4 rounded text-center text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5">
                                 <ShieldAlert className="w-4 h-4 text-yellow-500 animate-pulse" />
                                 Party involved in dispute. Awaiting DAO outcome.
                               </div>
                             ) : (
                               <>
                                 <motion.button
                                   onClick={() => handleVote(proposal.id, proposal.decision)}
                                   disabled={votingLoading === proposal.id || isMismatchOrMissing}
                                   className="flex-1 bg-transparent border border-green-800 hover:bg-green-950/20 text-green-400 py-2 rounded text-xs font-semibold disabled:opacity-30 transition-all"
                                   whileTap={{ scale: 0.98 }}
                                 >
                                   {votingLoading === proposal.id ? 'Voting...' : 'Pay Freelancer'}
                                 </motion.button>
                                 <motion.button
                                   onClick={() => handleVote(proposal.id, !proposal.decision)}
                                   disabled={votingLoading === proposal.id || isMismatchOrMissing}
                                   className="flex-1 bg-transparent border border-red-800 hover:bg-red-950/20 text-red-400 py-2 rounded text-xs font-semibold disabled:opacity-30 transition-all"
                                   whileTap={{ scale: 0.98 }}
                                 >
                                   {votingLoading === proposal.id ? 'Voting...' : 'Refund Employer'}
                                 </motion.button>
                               </>
                             )
                           )}
 
                           {votingActive && proposal.voted && (
                             <div className="w-full bg-[#121211] border border-[#1F1F1D] text-[#8E8E87] py-2 rounded text-center text-xs font-mono uppercase tracking-wider">
                               Voted Cast
                             </div>
                           )}
 
                           {isClosed && !proposal.executed && (
                             <motion.button
                               onClick={() => handleExecute(proposal)}
                               disabled={executionLoading === proposal.id || payVotes === refundVotes || isMismatchOrMissing}
                               className="w-full bg-[#C5A880] text-black hover:bg-[#E2A93E] py-2.5 rounded font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all"
                               whileTap={{ scale: 0.98 }}
                             >
                               {executionLoading === proposal.id ? (
                                 <Loader2 className="w-3.5 h-3.5 animate-spin" />
                               ) : (
                                 <Play className="w-3.5 h-3.5 fill-black" />
                               )}
                               Execute Decision
                             </motion.button>
                           )}
 
                           {proposal.executed && (
                             <div className="w-full border border-green-800 bg-green-950/5 text-green-455 py-2 rounded text-center text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5">
                               <CheckCircle2 className="w-3.5 h-3.5" />
                               Executed
                             </div>
                           )}
                         </div>
                       </div>
                     </motion.div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center py-20 bg-[#0F0F0E] border border-[#1F1F1D] rounded max-w-xl mx-auto">
                 <Vote className="w-10 h-10 text-[#1F1F1D] mx-auto mb-4" />
                 <h3 className="font-serif text-lg text-[#A3A39C] mb-1">No active proposals</h3>
                 <p className="text-xs text-[#8E8E87] max-w-xs mx-auto leading-relaxed">
                   When disputes are escalated to the block contract, proposal items will appear here for public DAO voting.
                 </p>
               </div>
             )}
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default DAOGovernance;
