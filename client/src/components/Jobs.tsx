'use client';
 
 import { useEffect, useState, useRef } from 'react';
 import axios from 'axios';
 import JobApplication from './JobApplication';
 import Link from 'next/link';
 import { AnimatePresence, motion } from 'framer-motion';
 import { Search, Briefcase, ChevronRight, CheckCircle, XCircle, Clock, Award, AlertTriangle } from 'lucide-react';
 
 interface Company {
   _id: string;
   name: string;
 }
 
 interface Job {
   _id: string;
   title: string;
   description: string;
   requiredSkills: string[];
   budget: number;
   companyId: Company;
   status: string;
 }
 
 interface Application {
   _id: string;
   jobId: {
     _id: string;
     title: string;
   } | null;
   status: string;
 }
 
 const Jobs = () => {
   const [jobs, setJobs] = useState<Job[]>([]);
   const [selectedJob, setSelectedJob] = useState<Job | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [showApplication, setShowApplication] = useState(false);
   const [myApplications, setMyApplications] = useState<Application[]>([]);
   const [contracts, setContracts] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [isSearchFocused, setIsSearchFocused] = useState(false);
   const jobsContainerRef = useRef<HTMLDivElement>(null);
 
   useEffect(() => {
     const fetchData = async () => {
       try {
         setLoading(true);
         const jobsRes = await axios.get('/api/jobs/available');
         setJobs(jobsRes.data);
         
         const token = localStorage.getItem('token');
         if (token) {
           const applicationsRes = await axios.get('/api/applications/my-applications', {
             headers: { Authorization: `Bearer ${token}` }
           });
           setMyApplications(applicationsRes.data);
 
           const contractsRes = await axios.get('/api/contracts', {
             headers: { Authorization: `Bearer ${token}` }
           });
           setContracts(contractsRes.data);
         }
       } catch (error) {
         console.error('Error fetching data:', error);
       } finally {
         setTimeout(() => setLoading(false), 500);
       }
     };
 
     fetchData();
   }, []);
 
   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setSearchQuery(e.target.value);
   };
 
   const filteredJobs = jobs.filter(job =>
     job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     job.requiredSkills.some(skill => 
       skill.toLowerCase().includes(searchQuery.toLowerCase())
     )
   );
 
   const getApplicationForJob = (jobId: string) => {
     return myApplications.find(app => app.jobId && app.jobId._id === jobId);
   };
 
   const getContractForJob = (jobId: string) => {
     return contracts.find(c => c.jobId && (c.jobId._id === jobId || c.jobId === jobId));
   };
 
   const getApplicationStatus = (jobId: string) => {
     const application = getApplicationForJob(jobId);
     if (!application) return null;
     
     if (application.status === 'hired') {
       const contract = getContractForJob(jobId);
       if (contract) {
         if (contract.status === 'disputed') return 'Dispute Active';
         if (contract.status === 'pending_dispute') return 'Dispute Pending';
         if (contract.status === 'completed') return 'Completed';
       }
       return 'You are Hired!';
     }
     
     switch(application.status) {
       case 'applied':
         return 'Under Review';
       case 'reviewed':
         return 'Being Reviewed';
       case 'rejected':
         return 'Not Selected';
       default:
         return application.status;
     }
   };
 
   const getStatusIcon = (status: string | null) => {
     if (!status) return null;
     
     switch(status) {
       case 'You are Hired!':
         return <Award className="w-3.5 h-3.5 text-green-400" />;
       case 'Completed':
         return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
       case 'Dispute Active':
         return <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />;
       case 'Dispute Pending':
         return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
       case 'Not Selected':
         return <XCircle className="w-3.5 h-3.5 text-red-400" />;
       case 'Under Review':
       case 'Being Reviewed':
         return <Clock className="w-3.5 h-3.5 text-[#C5A880]" />;
       default:
         return <CheckCircle className="w-3.5 h-3.5 text-[#C5A880]" />;
     }
   };
 
   const handleApplicationSubmit = async () => {
     try {
       const token = localStorage.getItem('token');
       if (token) {
         const res = await axios.get('/api/applications/my-applications', {
           headers: { Authorization: `Bearer ${token}` }
         });
         setMyApplications(res.data);
       }
       
       setShowApplication(false);
       
       const successMessage = document.createElement('div');
       successMessage.className = 'fixed top-5 right-5 bg-green-600 text-white p-4 rounded shadow-lg z-50 transition-all text-sm font-medium';
       successMessage.innerHTML = 'Application submitted successfully!';
       document.body.appendChild(successMessage);
       
       setTimeout(() => {
         successMessage.style.opacity = '0';
         setTimeout(() => document.body.removeChild(successMessage), 500);
       }, 3000);
     } catch (error) {
       console.error('Error refreshing applications:', error);
     }
   };
 
   if (loading) {
     return (
       <div className="flex justify-center items-center h-full w-full">
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="flex flex-col items-center"
         >
           <div className="w-10 h-10 border-t-2 border-[#C5A880] border-solid rounded-full animate-spin"></div>
           <p className="mt-4 text-xs font-mono uppercase tracking-widest text-[#8E8E87]">Querying opportunities...</p>
         </motion.div>
       </div>
     );
   }
 
   return (
     <motion.div 
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       transition={{ duration: 0.4 }}
       className="flex h-[calc(100vh-80px)]"
     >
       {/* Left Column (Jobs List) */}
       <div className="w-2/5 p-6 border-r border-[#1F1F1D] bg-[#0A0A09] flex flex-col">
         <div className="relative mb-6">
           <motion.div 
             className={`flex items-center px-3 py-2.5 bg-[#121211] border rounded border-[#1F1F1D] transition-all ${isSearchFocused ? 'border-[#C5A880]/60' : ''}`}
             animate={{ scale: isSearchFocused ? 1.01 : 1 }}
             transition={{ type: "spring", stiffness: 400, damping: 25 }}
           >
             <Search className="w-4 h-4 text-[#8E8E87] mr-2" />
             <input
               type="text"
               placeholder="Search jobs or skills..."
               className="w-full bg-transparent outline-none text-[#F5F5F4] placeholder-[#8E8E87] text-sm"
               value={searchQuery}
               onChange={handleSearchChange}
               onFocus={() => setIsSearchFocused(true)}
               onBlur={() => setIsSearchFocused(false)}
             />
           </motion.div>
         </div>
 
         <div className="mb-4 flex justify-between items-center px-1">
           <h2 className="text-lg font-serif font-medium text-white">Available Jobs</h2>
           <span className="text-xs font-mono uppercase text-[#8E8E87]">{filteredJobs.length} open</span>
         </div>
 
         <div className="overflow-y-auto flex-1 pr-1" ref={jobsContainerRef}>
           <AnimatePresence>
             {filteredJobs.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-center py-12 text-[#8E8E87]"
               >
                 <Briefcase className="w-10 h-10 mx-auto text-[#1F1F1D] mb-3" />
                 <p className="text-sm">No jobs found matching your search</p>
               </motion.div>
             ) : (
               <ul className="space-y-3">
                 {filteredJobs.map((job, index) => {
                   const applicationStatus = getApplicationStatus(job._id);
                   const statusIcon = getStatusIcon(applicationStatus);
                   const isSelected = selectedJob?._id === job._id;
                   
                   return (
                     <motion.li
                       key={job._id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.03 }}
                       onClick={() => {
                         setSelectedJob(job);
                         setShowApplication(false);
                       }}
                       className={`p-4 border rounded cursor-pointer transition-all duration-200 ${
                         isSelected 
                           ? 'border-[#C5A880] bg-[#121211] shadow-sm' 
                           : 'bg-[#0F0F0E] border-[#1F1F1D] hover:bg-[#121211]/80 hover:border-[#C5A880]/30'
                       }`}
                       whileHover={{ y: -1 }}
                       whileTap={{ scale: 0.99 }}
                     >
                       <div className="flex justify-between items-start">
                         <h3 className="font-serif font-medium text-[#F5F5F4] text-base leading-tight">
                           {job.title}
                         </h3>
                         <ChevronRight className={`w-4 h-4 ml-2 mt-0.5 ${isSelected ? 'text-[#C5A880]' : 'text-[#8E8E87]'}`} />
                       </div>
                       
                       <div className="mt-3 flex flex-wrap gap-1.5">
                         {job.requiredSkills.slice(0, 3).map(skill => (
                           <span 
                             key={skill} 
                             className="text-[10px] font-mono border border-[#C5A880]/20 text-[#C5A880] bg-[#C5A880]/5 px-2 py-0.5 rounded"
                           >
                             {skill}
                           </span>
                         ))}
                         {job.requiredSkills.length > 3 && (
                           <span className="text-[10px] font-mono border border-[#1F1F1D] text-[#8E8E87] px-2 py-0.5 rounded">
                             +{job.requiredSkills.length - 3} more
                           </span>
                         )}
                       </div>
                       
                       <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#1F1F1D]/50">
                         <span className="text-xs font-mono font-semibold text-[#C5A880]">
                           ${job.budget.toLocaleString()}
                         </span>
                         {applicationStatus && (
                           <div className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${
                             applicationStatus === 'You are Hired!' || applicationStatus === 'Completed'
                               ? 'bg-green-950/20 text-green-400 border-green-500/20' 
                               : applicationStatus === 'Not Selected' || applicationStatus === 'Dispute Active'
                                 ? 'bg-red-950/20 text-red-400 border-red-500/20'
                                 : applicationStatus === 'Dispute Pending'
                                   ? 'bg-amber-950/20 text-amber-400 border-amber-500/20'
                                   : 'bg-[#121211] text-[#C5A880] border-[#C5A880]/20'
                           }`}>
                             {statusIcon}
                             <span>{applicationStatus}</span>
                           </div>
                         )}
                       </div>
                     </motion.li>
                   );
                 })}
               </ul>
             )}
           </AnimatePresence>
         </div>
       </div>
 
       {/* Right Column (Job Details) */}
       <div className="w-3/5 p-8 bg-[#0F0F0E] overflow-y-auto">
         <AnimatePresence mode="wait">
           {selectedJob ? (
             <motion.div
               key={selectedJob._id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
               className="space-y-6"
             >
               <div>
                 <h2 className="text-3xl font-serif text-white font-medium leading-tight mb-2">
                   {selectedJob.title}
                 </h2>
                 <p className="text-xs font-mono uppercase tracking-wider text-[#8E8E87] flex items-center gap-1.5">
                   <span>Client:</span>
                   <span className="text-[#C5A880] font-bold">
                     {selectedJob.companyId?.name || "Unknown Company"}
                   </span>
                 </p>
               </div>
               
               <div className="bg-[#121211] border border-[#1F1F1D] p-6 rounded">
                 <h3 className="text-xs uppercase tracking-wider text-[#A3A39C] font-mono font-bold mb-3">Job Description</h3>
                 <p className="text-sm text-[#A3A39C] leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
               </div>
 
               <div>
                 <h3 className="text-xs uppercase tracking-wider text-[#A3A39C] font-mono font-bold mb-3">Required Skills</h3>
                 <div className="flex flex-wrap gap-2">
                   {selectedJob.requiredSkills.map((skill) => (
                     <span 
                       key={skill}
                       className="border border-[#C5A880]/30 text-[#C5A880] bg-[#C5A880]/5 px-3 py-1 rounded text-xs font-mono"
                     >
                       {skill}
                     </span>
                   ))}
                 </div>
               </div>
 
               <div className="flex items-center justify-between p-4 bg-[#121211] border border-[#1F1F1D] rounded">
                 <div>
                   <span className="text-xs text-[#8E8E87] font-mono uppercase tracking-wider block">Project Escrow Budget</span>
                   <p className="text-xl font-serif font-medium text-[#C5A880] mt-1">${selectedJob.budget.toLocaleString()} USD</p>
                 </div>
                 {getContractForJob(selectedJob._id)?.jobId?.blockchainJobId && (
                   <div className="text-right">
                     <span className="text-xs text-[#8E8E87] font-mono uppercase tracking-wider block">Blockchain Job ID</span>
                     <p className="text-base font-mono font-bold text-white mt-1">#{getContractForJob(selectedJob._id).jobId.blockchainJobId}</p>
                   </div>
                 )}
               </div>
 
               <div className="pt-4 border-t border-[#1F1F1D]">
                 {showApplication ? (
                   <JobApplication 
                     jobId={selectedJob._id} 
                     onApplicationSubmit={handleApplicationSubmit} 
                   />
                 ) : (
                   (() => {
                     const applicationStatus = getApplicationStatus(selectedJob._id);
                     if (applicationStatus) {
                       return (
                         <div className={`p-6 border rounded ${
                           applicationStatus === 'You are Hired!' 
                             ? 'bg-green-950/10 border-green-800 text-green-200' 
                             : applicationStatus === 'Not Selected'
                               ? 'bg-red-950/10 border-red-800 text-red-200'
                               : 'bg-[#121211] border-[#1F1F1D] text-[#A3A39C]'
                         }`}>
                           <div className="flex items-center gap-2 mb-2">
                             {applicationStatus === 'You are Hired!' ? (
                               <Award className="w-5 h-5 text-green-400" />
                             ) : applicationStatus === 'Not Selected' ? (
                               <XCircle className="w-5 h-5 text-red-400" />
                             ) : (
                               <Clock className="w-5 h-5 text-[#C5A880]" />
                             )}
                             <h4 className="font-serif text-base font-medium text-white">
                               {applicationStatus}
                             </h4>
                           </div>
                           
                           <p className="text-sm text-[#8E8E87] mt-1 mb-4">
                             {applicationStatus === 'You are Hired!' 
                               ? 'Congratulations. You have been selected by the employer for this project.' 
                               : applicationStatus === 'Not Selected'
                                 ? 'Thank you for your interest. The selection process has concluded.'
                                 : 'Your cover letter and application details are currently under review.'}
                           </p>
                           
                           {applicationStatus === 'You are Hired!' && (
                             <Link href="/contracts">
                               <motion.button 
                                 className="bg-[#C5A880] text-black py-2 px-4 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-colors"
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                               >
                                 Go to Contract Panel
                               </motion.button>
                             </Link>
                           )}
 
                           {applicationStatus === 'Dispute Active' && (
                             <div className="p-4 bg-red-950/20 border border-red-800 rounded text-red-200 text-sm">
                               <p className="font-bold flex items-center gap-1.5">
                                 <AlertTriangle className="w-4 h-4 text-red-500" />
                                 Contract Payout Dispute Raised
                               </p>
                               <p className="text-xs text-[#8E8E87] mt-1">
                                 The contract payment status has been locked due to an open dispute. Review active progress on the Contracts page or DAO Governance dashboard.
                               </p>
                               <Link href="/contracts">
                                 <motion.button 
                                   className="mt-3 bg-red-800 text-white py-1.5 px-4 rounded text-xs font-semibold hover:bg-red-700 transition-colors"
                                   whileHover={{ scale: 1.02 }}
                                   whileTap={{ scale: 0.98 }}
                                 >
                                   Go to Contracts
                                 </motion.button>
                               </Link>
                             </div>
                           )}
 
                           {applicationStatus === 'Completed' && (
                             <div className="p-4 bg-green-950/20 border border-green-800 rounded text-green-200 text-sm">
                               <p className="font-bold flex items-center gap-1.5">
                                 <CheckCircle className="w-4 h-4 text-green-400" />
                                 Contract Completed Successfully
                               </p>
                               <p className="text-xs text-[#8E8E87] mt-1">
                                 The locked escrow has been released to your wallet. The job is finalised.
                               </p>
                               <Link href="/contracts">
                                 <motion.button 
                                   className="mt-3 bg-green-700 text-white py-1.5 px-4 rounded text-xs font-semibold hover:bg-green-600 transition-colors"
                                   whileHover={{ scale: 1.02 }}
                                   whileTap={{ scale: 0.98 }}
                                 >
                                   Go to Contracts
                                 </motion.button>
                               </Link>
                             </div>
                           )}
                         </div>
                       );
                     } else {
                       return (
                         <motion.button
                           onClick={() => setShowApplication(true)}
                           className="bg-[#C5A880] text-black py-2.5 px-6 rounded font-semibold text-sm hover:bg-[#E2A93E] transition-colors w-full"
                           whileHover={{ scale: 1.01 }}
                           whileTap={{ scale: 0.99 }}
                         >
                           Apply for this Position
                         </motion.button>
                       );
                     }
                   })()
                 )}
               </div>
             </motion.div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center">
               <Briefcase className="w-12 h-12 text-[#1F1F1D] mb-4" />
               <h3 className="text-lg font-serif font-medium text-[#A3A39C] mb-1">Select a job to view details</h3>
               <p className="text-xs text-[#8E8E87] max-w-xs leading-relaxed">Browse the available opportunities listed in the left sidebar and select one to view its complete scope.</p>
             </div>
           )}
         </AnimatePresence>
       </div>
     </motion.div>
   );
 };
 
 export default Jobs;