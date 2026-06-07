'use client';
 
 import React, { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { toast } from 'sonner';
 import Navbar from '@/components/Navbar';
 import { web3Service } from '@/lib/web3';
 import axios from 'axios';
 import Image from 'next/image';
 
 interface User {
   _id: string;
   name: string;
   email: string;
   role: 'Freelancer' | 'Company';
   profilePicture?: string;
   bio?: string;
   skills?: string[];
   experience?: string;
   companyName?: string;
   walletAddress?: string;
   rating: number;
   createdAt: string;
 }
 
 interface ReputationNFT {
   tokenId: string;
   tokenURI: string;
 }
 
 const ProfilePage = () => {
   const [user, setUser] = useState<User | null>(null);
   const [walletAddress, setWalletAddress] = useState<string | null>(null);
   const [isWalletConnected, setIsWalletConnected] = useState(false);
   const [reputationNFTs, setReputationNFTs] = useState<ReputationNFT[]>([]);
   const [isEditing, setIsEditing] = useState(false);
   const [loading, setLoading] = useState(true);
   const [walletLoading, setWalletLoading] = useState(false);
 
   const [formData, setFormData] = useState({
     name: '',
     bio: '',
     skills: [] as string[],
     experience: '',
     companyName: '',
     profilePicture: ''
   });
 
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
       setFormData({
         name: res.data.user.name || '',
         bio: res.data.user.bio || '',
         skills: res.data.user.skills || [],
         experience: res.data.user.experience || '',
         companyName: res.data.user.companyName || '',
         profilePicture: res.data.user.profilePicture || ''
       });
 
       if (res.data.user.walletAddress) {
         setWalletAddress(res.data.user.walletAddress);
         setIsWalletConnected(true);
         await web3Service.connectWallet();
         await fetchReputationNFTs(res.data.user.walletAddress);
       }
     } catch (error) {
       console.error('Error fetching user data:', error);
       toast.error('Failed to load user data');
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
 
         await fetchReputationNFTs(address);
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
 
   const disconnectWallet = async () => {
     try {
       await web3Service.disconnectWallet();
       setWalletAddress(null);
       setIsWalletConnected(false);
       setReputationNFTs([]);
       
       const token = localStorage.getItem('token');
       if (token) {
         await axios.put('/api/auth/user', 
           { walletAddress: null },
           { headers: { Authorization: `Bearer ${token}` } }
         );
       }
       
       toast.success('Wallet disconnected');
     } catch (error) {
       console.error('Error disconnecting wallet:', error);
       toast.error('Failed to disconnect wallet');
     }
   };
 
   const fetchReputationNFTs = async (address: string) => {
     try {
       const nfts = await web3Service.getReputationNFTs(address);
       setReputationNFTs(nfts);
     } catch (error) {
       console.error('Error fetching reputation NFTs:', error);
     }
   };
 
   const handleSaveProfile = async () => {
     try {
       const token = localStorage.getItem('token');
       if (!token) return;
 
       const res = await axios.put('/api/auth/user', formData, {
         headers: { Authorization: `Bearer ${token}` }
       });
 
       setUser(res.data.user);
       setIsEditing(false);
       toast.success('Profile updated successfully!');
     } catch (error) {
       console.error('Error updating profile:', error);
       toast.error('Failed to update profile');
     }
   };
 
   const addSkill = () => {
     const newSkill = prompt('Enter a new skill:');
     if (newSkill && !formData.skills.includes(newSkill)) {
       setFormData(prev => ({
         ...prev,
         skills: [...prev.skills, newSkill]
       }));
     }
   };
 
   const removeSkill = (skillToRemove: string) => {
     setFormData(prev => ({
       ...prev,
       skills: prev.skills.filter(skill => skill !== skillToRemove)
     }));
   };
 
   if (loading) {
     return (
       <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4]">
         <Navbar />
         <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C5A880]"></div>
         </div>
       </div>
     );
   }
 
   if (!user) {
     return (
       <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4]">
         <Navbar />
         <div className="flex justify-center items-center h-64">
           <p className="text-[#8E8E87] text-sm">Please log in to view your profile</p>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-[#0A0A09] text-[#F5F5F4] font-sans selection:bg-[#E2A93E] selection:text-black">
       <Navbar />
       
       <div className="max-w-4xl mx-auto p-6">
         <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
           className="bg-[#0F0F0E] border border-[#1F1F1D] rounded shadow-xs overflow-hidden"
         >
           {/* Header Section */}
           <div className="border-b border-[#1F1F1D] p-8 bg-[#0F0F0E] text-[#F5F5F4]">
             <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
               <div className="relative">
                 {user.profilePicture ? (
                   <Image
                     src={user.profilePicture}
                     alt="Profile"
                     width={100}
                     height={100}
                     className="rounded-full ring-2 ring-[#C5A880]/30"
                   />
                 ) : (
                   <div className="w-24 h-24 bg-[#121211] border border-[#C5A880]/30 rounded-full flex items-center justify-center text-3xl font-serif font-bold text-[#C5A880]">
                     {user.name?.charAt(0).toUpperCase()}
                   </div>
                 )}
               </div>
               
               <div className="flex-1 text-center md:text-left">
                 <h1 className="text-2xl font-serif font-medium text-white">{user.name}</h1>
                 <p className="text-sm text-[#8E8E87] mt-1">{user.email}</p>
                 <div className="flex items-center justify-center md:justify-start mt-3 gap-3">
                   <span className="border border-[#C5A880]/30 text-[#C5A880] bg-[#C5A880]/5 px-3 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider">
                     {user.role}
                   </span>
                   {user.rating > 0 && (
                     <div className="flex items-center text-yellow-400 text-xs font-mono">
                       <span>★</span>
                       <span className="ml-1 text-[#F5F5F4]">{user.rating.toFixed(1)}</span>
                     </div>
                   )}
                 </div>
               </div>
 
               <motion.button
                 onClick={() => setIsEditing(!isEditing)}
                 className="border border-[#1F1F1D] hover:border-[#C5A880]/30 hover:bg-[#121211] px-4 py-2 rounded font-medium text-xs text-[#A3A39C] hover:text-[#F5F5F4] transition-colors"
                 whileTap={{ scale: 0.98 }}
               >
                 {isEditing ? 'Cancel' : 'Edit Profile'}
               </motion.button>
             </div>
           </div>
 
           <div className="p-8">
             {/* Wallet Connection Section */}
             <div className="mb-8 pb-8 border-b border-[#1F1F1D]/55">
               <h2 className="text-lg font-serif font-medium text-white mb-4">Web3 Wallet Binding</h2>
               <div className="bg-[#121211] border border-[#1F1F1D] rounded p-6">
                 {isWalletConnected ? (
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div>
                       <p className="text-xs font-mono uppercase tracking-wider text-[#8E8E87]">Bound Wallet Address</p>
                       <p className="font-mono text-xs bg-[#0F0F0E] border border-[#1F1F1D] px-3 py-1.5 rounded mt-1.5 text-white break-all">
                         {walletAddress}
                       </p>
                     </div>
                     <motion.button
                       onClick={disconnectWallet}
                       className="border border-red-900/30 hover:border-red-800 hover:bg-red-950/20 text-red-400 px-4 py-2 rounded text-xs font-semibold transition-all w-full sm:w-auto"
                       whileTap={{ scale: 0.98 }}
                     >
                       Disconnect Wallet
                     </motion.button>
                   </div>
                 ) : (
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div>
                       <p className="text-xs font-mono uppercase tracking-wider text-[#8E8E87]">No wallet connected</p>
                       <p className="text-xs text-[#8E8E87] mt-1">Bind your wallet address to engage in trustless contract escrows.</p>
                     </div>
                     <motion.button
                       onClick={connectWallet}
                       disabled={walletLoading}
                       className="bg-[#C5A880] text-black hover:bg-[#E2A93E] px-4 py-2 rounded text-xs font-semibold transition-all w-full sm:w-auto"
                       whileTap={{ scale: 0.98 }}
                     >
                       {walletLoading ? 'Connecting...' : 'Connect Wallet'}
                     </motion.button>
                   </div>
                 )}
               </div>
             </div>
 
             {/* Profile Information */}
             <div className="mb-8">
               <h2 className="text-lg font-serif font-medium text-white mb-4">Profile Specifications</h2>
               
               {isEditing ? (
                 <div className="space-y-4 max-w-2xl">
                   <div>
                     <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Name</label>
                     <input
                       type="text"
                       value={formData.name}
                       onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                       className="w-full px-3 py-2 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-sm"
                     />
                   </div>
 
                   <div>
                     <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Bio</label>
                     <textarea
                       value={formData.bio}
                       onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                       rows={3}
                       className="w-full px-3 py-2 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-sm"
                     />
                   </div>
 
                   {user.role === 'Freelancer' && (
                     <>
                       <div>
                         <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Skills</label>
                         <div className="flex flex-wrap gap-1.5 mb-3">
                           {formData.skills.map((skill, index) => (
                             <span
                               key={index}
                               className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-mono border border-[#C5A880]/30 text-[#C5A880] bg-[#C5A880]/5"
                             >
                               {skill}
                               <button
                                 onClick={() => removeSkill(skill)}
                                 className="ml-2 text-[#C5A880] hover:text-red-400 text-sm"
                               >
                                 ×
                               </button>
                             </span>
                           ))}
                         </div>
                         <button
                           onClick={addSkill}
                           className="text-[#C5A880] hover:text-[#E2A93E] text-xs font-semibold"
                         >
                           + Add Skill Tag
                         </button>
                       </div>
 
                       <div>
                         <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Experience</label>
                         <textarea
                           value={formData.experience}
                           onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                           rows={3}
                           className="w-full px-3 py-2 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-sm"
                         />
                       </div>
                     </>
                   )}
 
                   {user.role === 'Company' && (
                     <div>
                       <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Company Name</label>
                       <input
                         type="text"
                         value={formData.companyName}
                         onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                         className="w-full px-3 py-2 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-sm"
                       />
                     </div>
                   )}
 
                   <div className="flex space-x-3 pt-2">
                     <motion.button
                       onClick={handleSaveProfile}
                       className="bg-[#C5A880] text-black px-6 py-2 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all"
                       whileTap={{ scale: 0.98 }}
                     >
                       Save Changes
                     </motion.button>
                     <motion.button
                       onClick={() => setIsEditing(false)}
                       className="border border-[#1F1F1D] text-[#A3A39C] hover:text-white px-6 py-2 rounded text-xs font-semibold transition-all"
                       whileTap={{ scale: 0.98 }}
                     >
                       Cancel
                     </motion.button>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-5 text-sm max-w-2xl">
                   {user.bio && (
                     <div>
                       <h3 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87]">Bio</h3>
                       <p className="text-[#A3A39C] mt-1.5 leading-relaxed">{user.bio}</p>
                     </div>
                   )}
 
                   {user.role === 'Freelancer' && user.skills && user.skills.length > 0 && (
                     <div>
                       <h3 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Skills</h3>
                       <div className="flex flex-wrap gap-1.5">
                         {user.skills.map((skill, index) => (
                           <span
                             key={index}
                             className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-mono border border-[#C5A880]/30 text-[#C5A880] bg-[#C5A880]/5"
                           >
                             {skill}
                           </span>
                         ))}
                       </div>
                     </div>
                   )}
 
                   {user.role === 'Freelancer' && user.experience && (
                     <div>
                       <h3 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87]">Experience</h3>
                       <p className="text-[#A3A39C] mt-1.5 leading-relaxed whitespace-pre-line">{user.experience}</p>
                     </div>
                   )}
 
                   {user.role === 'Company' && user.companyName && (
                     <div>
                       <h3 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87]">Company</h3>
                       <p className="text-[#A3A39C] mt-1.5">{user.companyName}</p>
                     </div>
                   )}
 
                   <div className="pt-2">
                     <h3 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87]">Member Since</h3>
                     <p className="text-[#A3A39C] mt-1.5 font-mono">
                       {new Date(user.createdAt).toLocaleDateString()}
                     </p>
                   </div>
                 </div>
               )}
             </div>
 
             {/* Reputation NFTs Section */}
             {isWalletConnected && user.role === 'Freelancer' && (
               <div className="mt-8 pt-8 border-t border-[#1F1F1D]/55">
                 <h2 className="text-lg font-serif font-medium text-white mb-4">Reputation Tokens</h2>
                 <div className="bg-[#121211] border border-[#1F1F1D] rounded p-6">
                   {reputationNFTs.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {reputationNFTs.map((nft) => (
                         <div
                           key={nft.tokenId}
                           className="bg-[#0A0A09] border border-[#1F1F1D]/80 rounded p-4 text-center"
                         >
                           <div className="w-10 h-10 rounded border border-[#1F1F1D] bg-[#121211] flex items-center justify-center mx-auto mb-3 text-[#C5A880]">
                             <span className="text-lg">★</span>
                           </div>
                           <h3 className="font-serif font-medium text-white text-sm">Certificate #{nft.tokenId}</h3>
                           <p className="text-xs text-[#8E8E87] mt-1">Verified work completion</p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-8">
                       <p className="text-sm text-[#8E8E87]">No reputation certificates found</p>
                       <p className="text-xs text-[#8E8E87]/70 mt-1">Complete milestone contracts to automatically mint NFTs.</p>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
         </motion.div>
       </div>
     </div>
   );
 };
 
 export default ProfilePage;