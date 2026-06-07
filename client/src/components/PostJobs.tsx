import { useState, useRef, useEffect } from 'react';
 import axios from 'axios';
 import { motion } from 'framer-motion';
 import { Briefcase, FileText, DollarSign, Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react';
 import Web3JobIntegration from './Web3JobIntegration';
 
 const PostJobs = () => {
   const [title, setTitle] = useState('');
   const [description, setDescription] = useState('');
   const [requiredSkills, setRequiredSkills] = useState('');
   const [budget, setBudget] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [focusedField, setFocusedField] = useState<string | null>(null);
   const [showSuccess, setShowSuccess] = useState(false);
   const [showWeb3Integration, setShowWeb3Integration] = useState(false);
   const [postedJobId, setPostedJobId] = useState<string | null>(null);
   const formRef = useRef<HTMLDivElement>(null);
   const [skillTags, setSkillTags] = useState<string[]>([]);
   const [profileWalletAddress, setProfileWalletAddress] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchUserProfile = async () => {
       try {
         const token = localStorage.getItem('token');
         if (token) {
           const userRes = await axios.get('/api/auth/user', {
             headers: { Authorization: `Bearer ${token}` }
           });
           setProfileWalletAddress(userRes.data.user.walletAddress || null);
         }
       } catch (err) {
         console.error('Error fetching user profile in PostJobs:', err);
       }
     };
     fetchUserProfile();
   }, []);
 
   const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setRequiredSkills(e.target.value);
   };
 
   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter' || e.key === ',') {
       e.preventDefault();
       const skill = requiredSkills.trim();
       
       if (skill && !skillTags.includes(skill)) {
         setSkillTags([...skillTags, skill]);
         setRequiredSkills('');
       }
     }
   };
 
   const removeSkill = (skillToRemove: string) => {
     setSkillTags(skillTags.filter(skill => skill !== skillToRemove));
   };
 
   const handlePostJob = async () => {
     if (!title || !description || (!requiredSkills && skillTags.length === 0) || !budget) {
       formRef.current?.classList.add('shake');
       setTimeout(() => {
         formRef.current?.classList.remove('shake');
       }, 500);
       return;
     }
 
     try {
       setIsSubmitting(true);
       const token = localStorage.getItem('token');
       if (!token) {
         alert('Unauthorized. Please login.');
         setIsSubmitting(false);
         return;
       }
 
       const allSkills = [...skillTags];
       if (requiredSkills.trim()) {
         allSkills.push(requiredSkills.trim());
       }
 
       const response = await axios.post('/api/jobs', 
         { title, description, requiredSkills: allSkills, budget },
         { headers: { Authorization: `Bearer ${token}` } }
       );
 
       const newJobId = response.data.job?._id || response.data._id;
       setPostedJobId(newJobId);
       setShowSuccess(true);
       
       setTimeout(() => {
         setShowWeb3Integration(true);
         setShowSuccess(false);
       }, 2000);
     } catch (error) {
       console.error('Error posting job:', error);
       const errorToast = document.createElement('div');
       errorToast.className = 'fixed top-5 right-5 bg-red-900 border border-red-800 text-red-200 p-4 rounded shadow-lg z-50 text-sm';
       errorToast.innerHTML = 'Failed to post job. Please try again.';
       document.body.appendChild(errorToast);
       
       setTimeout(() => {
         errorToast.style.opacity = '0';
         errorToast.style.transition = 'opacity 0.5s ease-out';
         setTimeout(() => document.body.removeChild(errorToast), 500);
       }, 3000);
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const containerVariants = {
     hidden: { opacity: 0, y: 15 },
     visible: { 
       opacity: 1, 
       y: 0,
       transition: { 
         duration: 0.5, 
         ease: "easeOut" 
       }
     }
   };
 
   const itemVariants = {
     hidden: { opacity: 0, y: 10 },
     visible: (i: number) => ({ 
       opacity: 1, 
       y: 0,
       transition: { 
         delay: i * 0.05,
         duration: 0.3, 
         ease: "easeOut" 
       }
     })
   };
 
   return (
     <motion.div 
       className="max-w-2xl mx-auto my-8 relative"
       variants={containerVariants}
       initial="hidden"
       animate="visible"
     >
       <motion.div 
         ref={formRef}
         className="relative z-10 bg-[#0F0F0E] p-8 rounded border border-[#1F1F1D] shadow-sm text-[#F5F5F4]"
         transition={{ duration: 0.3 }}
       >
         <motion.div
           className="flex items-center justify-between mb-8 border-b border-[#1F1F1D] pb-4"
           custom={0}
           variants={itemVariants}
         >
           <h2 className="text-2xl font-serif font-medium text-white">Post a New Job</h2>
           <Briefcase className="w-6 h-6 text-[#C5A880]" />
         </motion.div>
 
         {/* Success message */}
         {showSuccess && (
           <motion.div 
             className="absolute inset-0 bg-[#0A0A09]/95 backdrop-blur-sm flex items-center justify-center z-20 rounded"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
           >
             <motion.div 
               className="text-center p-8"
               initial={{ scale: 0.9 }}
               animate={{ scale: 1 }}
             >
               <motion.div
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ type: "spring", damping: 10, stiffness: 100 }}
               >
                 <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
               </motion.div>
               <h3 className="text-xl font-serif font-medium text-white mb-2">Job Posted Successfully</h3>
               <p className="text-sm text-[#8E8E87]">Your job has been listed and is now visible to candidates</p>
             </motion.div>
           </motion.div>
         )}
 
         <div className="space-y-6">
           <motion.div custom={1} variants={itemVariants}>
             <div>
               <label className="flex items-center text-xs font-mono uppercase tracking-wider text-[#A3A39C] mb-2">
                 <FileText className="w-4 h-4 mr-2 text-[#C5A880]" />
                 Job Title
               </label>
               <motion.div
                 initial={false}
                 animate={{ 
                   borderColor: focusedField === 'title' ? '#C5A880' : '#1F1F1D'
                 }}
                 className="relative border rounded bg-[#121211] overflow-hidden"
               >
                 <input
                   type="text"
                   placeholder="e.g. Protocol Engineer Needed"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   onFocus={() => setFocusedField('title')}
                   onBlur={() => setFocusedField(null)}
                   className="w-full p-3 bg-transparent outline-none text-[#F5F5F4] text-sm"
                 />
               </motion.div>
             </div>
           </motion.div>
 
           <motion.div custom={2} variants={itemVariants}>
             <div>
               <label className="flex items-center text-xs font-mono uppercase tracking-wider text-[#A3A39C] mb-2">
                 <FileText className="w-4 h-4 mr-2 text-[#C5A880]" />
                 Job Description
               </label>
               <motion.div
                 initial={false}
                 animate={{ 
                   borderColor: focusedField === 'description' ? '#C5A880' : '#1F1F1D'
                 }}
                 className="relative border rounded bg-[#121211] overflow-hidden"
               >
                 <textarea
                   placeholder="Describe the job deliverables, responsibilities, and requirements..."
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   onFocus={() => setFocusedField('description')}
                   onBlur={() => setFocusedField(null)}
                   className="w-full p-3 bg-transparent outline-none min-h-32 text-[#F5F5F4] text-sm"
                 />
               </motion.div>
             </div>
           </motion.div>
 
           <motion.div custom={3} variants={itemVariants}>
             <div>
               <label className="flex items-center text-xs font-mono uppercase tracking-wider text-[#A3A39C] mb-2">
                 <Tag className="w-4 h-4 mr-2 text-[#C5A880]" />
                 Required Skills
               </label>
               <motion.div
                 initial={false}
                 animate={{ 
                   borderColor: focusedField === 'skills' ? '#C5A880' : '#1F1F1D'
                 }}
                 className="relative border rounded bg-[#121211] overflow-hidden"
               >
                 <input
                   type="text"
                   placeholder="Add skill tags (press Enter or comma)"
                   value={requiredSkills}
                   onChange={handleSkillsChange}
                   onKeyDown={handleKeyDown}
                   onFocus={() => setFocusedField('skills')}
                   onBlur={() => setFocusedField(null)}
                   className="w-full p-3 bg-transparent outline-none text-[#F5F5F4] text-sm"
                 />
               </motion.div>
 
               {skillTags.length > 0 && (
                 <div className="flex flex-wrap gap-1.5 mt-3">
                   {skillTags.map((skill) => (
                     <motion.span
                       key={skill}
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-mono border border-[#C5A880]/30 text-[#C5A880] bg-[#C5A880]/5"
                     >
                       {skill}
                       <XCircle 
                         className="ml-2 w-3.5 h-3.5 cursor-pointer hover:text-red-400 transition-colors"
                         onClick={() => removeSkill(skill)}
                       />
                     </motion.span>
                   ))}
                 </div>
               )}
             </div>
           </motion.div>
 
           <motion.div custom={4} variants={itemVariants}>
             <div>
               <label className="flex items-center text-xs font-mono uppercase tracking-wider text-[#A3A39C] mb-2">
                 <DollarSign className="w-4 h-4 mr-2 text-[#C5A880]" />
                 Budget
               </label>
               <motion.div
                 initial={false}
                 animate={{ 
                   borderColor: focusedField === 'budget' ? '#C5A880' : '#1F1F1D'
                 }}
                 className="relative border rounded bg-[#121211] overflow-hidden"
               >
                 <input
                   type="number"
                   placeholder="Enter contract budget"
                   value={budget}
                   onChange={(e) => setBudget(e.target.value)}
                   onFocus={() => setFocusedField('budget')}
                   onBlur={() => setFocusedField(null)}
                   className="w-full p-3 pr-12 bg-transparent outline-none text-[#F5F5F4] text-sm"
                 />
                 <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-[#8E8E87]">USD</div>
               </motion.div>
             </div>
           </motion.div>
 
           <motion.div
             custom={5}
             variants={itemVariants}
             className="pt-4"
           >
             <motion.button
               onClick={handlePostJob}
               className="w-full py-2.5 px-6 rounded text-black bg-[#C5A880] font-semibold text-sm hover:bg-[#E2A93E] transition-all flex items-center justify-center disabled:opacity-50"
               whileTap={{ scale: 0.99 }}
               disabled={isSubmitting}
             >
               {isSubmitting ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin text-black" />
               ) : (
                 <Briefcase className="w-4 h-4 mr-2 text-black" />
               )}
               <span>
                 {isSubmitting ? "Posting Job..." : "Post Job"}
               </span>
             </motion.button>
           </motion.div>
         </div>
       </motion.div>
 
       {/* Web3 Integration */}
       {showWeb3Integration && postedJobId && (
         <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           className="mt-6"
         >
           <Web3JobIntegration
             mode="post"
             jobId={postedJobId}
             profileWalletAddress={profileWalletAddress || undefined}
             onSuccess={() => {
               setShowWeb3Integration(false);
               setPostedJobId(null);
               setTitle('');
               setDescription('');
               setRequiredSkills('');
               setBudget('');
               setSkillTags([]);
             }}
           />
         </motion.div>
       )}
 
       <style jsx global>{`
         @keyframes shake {
           0%, 100% { transform: translateX(0); }
           10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
           20%, 40%, 60%, 80% { transform: translateX(5px); }
         }
         .shake {
           animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
         }
       `}</style>
     </motion.div>
   );
 };
 
 export default PostJobs;