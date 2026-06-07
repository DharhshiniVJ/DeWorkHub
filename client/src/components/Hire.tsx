// Fix the hiring logic to select the chosen applicant and add contract management
 
 "use client"
 
 import { useEffect, useState } from "react"
 import axios from "axios"
 import Web3Hiring from "./Web3Hiring"
 import Web3Dispute from "./Web3Dispute"
 import Web3JobIntegration from "./Web3JobIntegration"
 import Link from "next/link"
 import { motion } from "framer-motion"
 import { toast } from "sonner"
 import { Briefcase } from "lucide-react"
 
 interface Job {
   _id: string
   title: string
   description?: string
   budget?: number
   status: string
   applicants: string[]
   selectedFreelancer: string | null
 }
 
 interface Application {
   _id: string
   jobId: {
     _id: string
     title: string
     blockchainJobId?: number;
   }
   freelancerId: {
     _id: string
     name: string
     email: string
     walletAddress?: string
   }
   coverLetter: string
   resumeLink: string
   status: string
   appliedAt: string
 }
 
 interface Contract {
   _id: string
   status: string
   paymentStatus: string
   escrowAmount?: number
   companyId?: any
   freelancerId?: any
   disputeReason?: string
   jobId?: {
     _id: string
     title: string
     blockchainJobId?: number
   }
 }
 
 const Hire = () => {
   const [jobs, setJobs] = useState<Job[]>([])
   const [selectedJob, setSelectedJob] = useState<string | null>(null)
   const [applications, setApplications] = useState<Application[]>([])
   const [contracts, setContracts] = useState<any[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [processingId, setProcessingId] = useState<string | null>(null)
   const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
   const [rating, setRating] = useState<number>(5)
   const [feedback, setFeedback] = useState<string>("")
   const [showRatingModal, setShowRatingModal] = useState(false)
   const [showDisputeModal, setShowDisputeModal] = useState(false)
   const [disputeReason, setDisputeReason] = useState("")
   const [showWeb3Hiring, setShowWeb3Hiring] = useState(false)
   const [showWeb3Dispute, setShowWeb3Dispute] = useState(false)
   const [showWeb3Complete, setShowWeb3Complete] = useState(false)
   const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
   const [userRole] = useState<'Freelancer' | 'Company'>('Company')
   const [currentUser, setCurrentUser] = useState<any>(null)
 
   const fetchAllContracts = async () => {
     try {
       const token = localStorage.getItem("token")
       if (!token) return
       const contractsRes = await axios.get("/api/contracts", {
         headers: { Authorization: `Bearer ${token}` },
       })
       setContracts(contractsRes.data)
     } catch (error) {
       console.error("Error fetching all contracts:", error)
     }
   }
 
   useEffect(() => {
     const fetchCompanyJobs = async () => {
       try {
         setLoading(true)
         const token = localStorage.getItem("token")
         if (!token) {
           setError("You must be logged in")
           setLoading(false)
           return
         }
         const userRes = await axios.get("/api/auth/user", {
           headers: { Authorization: `Bearer ${token}` },
         })
 
         setCurrentUser(userRes.data.user)
 
         const res = await axios.get("/api/jobs/company-jobs", {
           headers: { Authorization: `Bearer ${token}` },
         })
 
         setJobs(res.data)
 
         const contractsRes = await axios.get("/api/contracts", {
           headers: { Authorization: `Bearer ${token}` },
         })
         setContracts(contractsRes.data)
 
         if (res.data.length > 0) {
           setSelectedJob(res.data[0]._id)
           fetchApplications(res.data[0]._id)
         } else {
           setLoading(false)
         }
       } catch (error) {
         console.error("Error fetching company jobs:", error)
         setError("Failed to load jobs")
         setLoading(false)
       }
     }
 
     fetchCompanyJobs()
   }, [])
 
   const fetchApplications = async (jobId: string) => {
     try {
       setLoading(true)
       setError(null)
       const token = localStorage.getItem("token")
 
       const res = await axios.get(`/api/applications/job/${jobId}`, {
         headers: { Authorization: `Bearer ${token}` },
       })
 
       setApplications(res.data)
 
       const contractsRes = await axios.get("/api/contracts", {
         headers: { Authorization: `Bearer ${token}` },
       })
       const contractForJob = contractsRes.data.find(
         (c: any) => c.jobId && (c.jobId._id === jobId || c.jobId === jobId)
       )
       if (contractForJob) {
         setSelectedContract(contractForJob)
       } else {
         setSelectedContract(null)
       }
 
       setLoading(false)
     } catch (error: any) {
       console.error("Error fetching applications:", error)
       setError(error.response?.data?.message || "Failed to load applications")
       setLoading(false)
     }
   }
 
   const handleJobSelect = (jobId: string) => {
     setSelectedJob(jobId)
     fetchApplications(jobId)
   }
 
   const handleHireFreelancer = async (applicationId: string, freelancerId: string) => {
     try {
       setProcessingId(applicationId)
       const token = localStorage.getItem("token")
 
       const response = await axios.post(
         "/api/applications/hire",
         { applicationId, jobId: selectedJob, freelancerId },
         { headers: { Authorization: `Bearer ${token}` } },
       )
 
       setSelectedContract({
         _id: response.data.contractId,
         status: "ongoing",
         paymentStatus: "pending",
       })
 
       if (selectedJob) {
         fetchApplications(selectedJob)
       }
 
       const jobsRes = await axios.get("/api/jobs/company-jobs", {
         headers: { Authorization: `Bearer ${token}` },
       })
       setJobs(jobsRes.data)
       await fetchAllContracts()
 
       setProcessingId(null)
     } catch (error) {
       console.error("Error hiring freelancer:", error)
       setError("Failed to hire freelancer")
       setProcessingId(null)
     }
   }
 
   const handlePayment = async (contractId: string) => {
     try {
       const token = localStorage.getItem("token")
       await axios.post("/api/contracts/payment", { contractId }, { headers: { Authorization: `Bearer ${token}` } })
       toast.success("Payment processed successfully")
 
       const jobsRes = await axios.get("/api/jobs/company-jobs", {
         headers: { Authorization: `Bearer ${token}` },
       })
       setJobs(jobsRes.data)
       await fetchAllContracts()
 
       if (selectedJob) {
         fetchApplications(selectedJob)
       }
     } catch (error) {
       console.error("Error processing payment:", error)
       toast.error("Failed to process payment")
     }
   }
 
   const handleCompleteContract = async (contractId: string, customRating?: number, customFeedback?: string) => {
     try {
       const token = localStorage.getItem("token")
       await axios.post(
         "/api/contracts/update",
         { 
           contractId, 
           status: "completed", 
           rating: customRating !== undefined ? customRating : rating, 
           feedback: customFeedback !== undefined ? customFeedback : feedback 
         },
         { headers: { Authorization: `Bearer ${token}` } },
       )
 
       setShowRatingModal(false)
       toast.success("Contract marked as completed")
 
       const jobsRes = await axios.get("/api/jobs/company-jobs", {
         headers: { Authorization: `Bearer ${token}` },
       })
       setJobs(jobsRes.data)
       await fetchAllContracts()
 
       if (selectedJob) {
         fetchApplications(selectedJob)
       }
     } catch (error) {
       console.error("Error completing contract:", error)
       toast.error("Failed to complete contract")
     }
   }
 
   const handleDisputeContract = async (contractId: string, customReason?: string) => {
     try {
       const token = localStorage.getItem("token")
       await axios.post(
         "/api/contracts/dispute",
         { contractId, reason: customReason !== undefined ? customReason : disputeReason },
         { headers: { Authorization: `Bearer ${token}` } },
       )
 
       setShowDisputeModal(false)
       toast.success("Dispute filed successfully")
 
       const jobsRes = await axios.get("/api/jobs/company-jobs", {
         headers: { Authorization: `Bearer ${token}` },
       })
       setJobs(jobsRes.data)
       await fetchAllContracts()
 
       if (selectedJob) {
         fetchApplications(selectedJob)
       }
     } catch (error) {
       console.error("Error filing dispute:", error)
       toast.error("Failed to file dispute")
     }
   }
 
   const handleWeb3Hire = (application: Application) => {
     setSelectedApplication(application)
     setShowWeb3Hiring(true)
   }
 
   const handleWeb3HireSuccess = () => {
     setShowWeb3Hiring(false)
     if (selectedApplication) {
       handleHireFreelancer(selectedApplication._id, selectedApplication.freelancerId._id)
     }
     setSelectedApplication(null)
     toast.success("Freelancer hired successfully on blockchain!")
   }
 
   const handleWeb3CompleteSuccess = (data?: { rating?: number; metadataURI?: string }) => {
     setShowWeb3Complete(false)
     if (selectedContract) {
       const finalRating = data?.rating || rating;
       handleCompleteContract(selectedContract._id, finalRating, "Completed via blockchain escrow release");
     } else if (selectedJob) {
       fetchApplications(selectedJob)
     }
     toast.success("Job completed successfully on blockchain!")
   }
 
   const handleWeb3DisputeRaisedSuccess = (reason?: string) => {
     setShowWeb3Dispute(false)
     if (selectedContract) {
       handleDisputeContract(selectedContract._id, reason || "Disputed on blockchain")
     } else if (selectedJob) {
       fetchApplications(selectedJob)
     }
     toast.success("Dispute raised successfully on blockchain!")
   }
 
   const handleWeb3DisputeApprovedSuccess = async (approvalReason: string) => {
     setShowWeb3Dispute(false)
     if (selectedContract) {
       try {
         const token = localStorage.getItem("token")
         const mergedReason = selectedContract.disputeReason 
           ? `${selectedContract.disputeReason} | Response: ${approvalReason}`
           : `Response: ${approvalReason}`
         await axios.post(
           "/api/contracts/update",
           { contractId: selectedContract._id, status: "disputed", disputeReason: mergedReason },
           { headers: { Authorization: `Bearer ${token}` } }
         )
         await fetchAllContracts()
         setSelectedContract(null)
         toast.success("Dispute approved and submitted to DAO!")
       } catch (err) {
         console.error("Error updating dispute approval in DB:", err)
         toast.error("Dispute approved on-chain, but DB update failed.")
       }
     } else {
       await fetchAllContracts()
       setSelectedContract(null)
     }
   }
 
   const handleWeb3DisputeResolvedSuccess = () => {
     setShowWeb3Dispute(false)
     if (selectedContract) {
       handleCompleteContract(selectedContract._id, 5, "Dispute resolved on blockchain")
     } else if (selectedJob) {
       fetchApplications(selectedJob)
     }
     toast.success("Dispute resolved successfully on blockchain!")
   }
 
   const getSelectedJobStatus = () => {
     if (!selectedJob) return null
     const job = jobs.find((j) => j._id === selectedJob)
     return job ? job.status : null
   }
 
   const jobStatus = getSelectedJobStatus()
   const hiredApplication = applications.find((app) => app.status === "hired")
 
   return (
     <div className="flex h-[calc(100vh-80px)] bg-[#0A0A09] text-[#F5F5F4] font-sans selection:bg-[#E2A93E] selection:text-black">
       {/* Left Column (Jobs List) */}
       <div className="w-1/4 p-6 border-r border-[#1F1F1D] overflow-y-auto">
         <h2 className="text-lg font-serif font-medium text-white mb-6 flex items-center">
           <span className="bg-[#C5A880] w-1 h-5 rounded-full mr-2"></span>
           Your Jobs
         </h2>
   
         {jobs.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-48 bg-[#0F0F0E] rounded border border-[#1F1F1D] p-6">
             <Briefcase className="w-8 h-8 text-[#1F1F1D] mb-3" />
             <p className="text-sm text-[#8E8E87] text-center font-medium">No jobs posted yet</p>
           </div>
         ) : (
           <ul className="space-y-3">
             {jobs.map((job) => {
               const contract = contracts.find(c => c.jobId && (c.jobId._id === job._id || c.jobId === job._id))
               const displayStatus = contract ? contract.status : job.status
               const isSelected = selectedJob === job._id;
               return (
                 <li
                   key={job._id}
                   onClick={() => handleJobSelect(job._id)}
                   className={`p-4 border rounded cursor-pointer transition-all duration-200 ${
                     isSelected 
                       ? "border-[#C5A880] bg-[#121211] shadow-sm" 
                       : "bg-[#0F0F0E] border-[#1F1F1D] hover:bg-[#121211]/80 hover:border-[#C5A880]/30"
                   }`}
                 >
                   <h3 className="font-serif font-medium text-[#F5F5F4] text-base leading-snug">{job.title}</h3>
                   <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#1F1F1D]/55">
                     <span
                       className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded-full ${
                         displayStatus === "open"
                           ? "bg-green-950/20 text-green-400 border-green-500/20"
                           : displayStatus === "in_progress" || displayStatus === "ongoing"
                             ? "bg-[#121211] text-[#C5A880] border-[#C5A880]/20"
                             : displayStatus === "completed"
                               ? "bg-green-950/20 text-green-400 border-green-500/20"
                               : "bg-red-950/20 text-red-400 border-red-500/20 animate-pulse"
                       }`}
                     >
                       {displayStatus === "ongoing" ? "in progress" : displayStatus.replace("_", " ")}
                     </span>
                     <span className="text-[10px] font-mono text-[#8E8E87]">
                       {job.applicants.length} applied
                     </span>
                   </div>
                 </li>
               )
             })}
           </ul>
         )}
       </div>
   
       {/* Right Column (Applications) */}
       <div className="w-3/4 p-8 overflow-y-auto bg-[#0F0F0E]">
         {loading ? (
           <div className="flex justify-center items-center h-full w-full">
             <div className="w-8 h-8 border-t-2 border-[#C5A880] rounded-full animate-spin"></div>
           </div>
         ) : error ? (
           <div className="bg-red-950/20 border border-red-800 text-red-200 p-4 rounded text-sm font-medium">
             {error}
           </div>
         ) : !selectedJob ? (
           <div className="flex flex-col items-center justify-center h-full text-[#8E8E87]">
             <Briefcase className="w-10 h-10 text-[#1F1F1D] mb-4" />
             <p className="font-serif text-lg">Select a job to view candidate details</p>
           </div>
         ) : (
           <div className="space-y-6 max-w-4xl">
             {/* Job Details Card */}
             {(() => {
               const currentJob = jobs.find((j) => j._id === selectedJob)
               if (!currentJob) return null
               return (
                 <div className="bg-[#121211] p-6 rounded border border-[#1F1F1D]">
                   <div className="flex justify-between items-start mb-3">
                     <h3 className="text-2xl font-serif text-white font-medium">{currentJob.title}</h3>
                     <span
                       className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${
                         currentJob.status === "open"
                           ? "bg-green-950/20 text-green-400 border-green-500/20"
                           : "bg-[#121211] text-[#C5A880] border-[#C5A880]/20"
                       }`}
                     >
                       {currentJob.status.replace("_", " ")}
                     </span>
                   </div>
                   {currentJob.description && (
                     <p className="text-sm text-[#A3A39C] mb-4 leading-relaxed whitespace-pre-line">{currentJob.description}</p>
                   )}
                   {currentJob.budget && (
                     <div className="text-xs font-mono font-semibold text-[#C5A880]">
                       Budget: ${currentJob.budget.toLocaleString()} USD
                     </div>
                   )}
                 </div>
               )
             })()}
 
             {/* Applications or Hired Freelancer View */}
             {(jobStatus === "in_progress" || jobStatus === "completed" || selectedContract?.status === "disputed" || selectedContract?.status === "pending_dispute" || selectedContract?.status === "completed") ? (
               <div className={`border rounded p-6 shadow-sm ${
                 selectedContract?.status === "completed" || jobStatus === "completed" 
                   ? "bg-green-950/10 border-green-800 text-green-200" 
                   : selectedContract?.status === "disputed"
                     ? "bg-red-950/10 border-red-800 text-red-200"
                     : selectedContract?.status === "pending_dispute"
                       ? "bg-amber-950/10 border-amber-800 text-amber-200"
                       : "bg-[#121211] border-[#1F1F1D] text-[#A3A39C]"
               }`}>
                 <h3 className="text-lg font-serif font-medium text-white mb-6 flex items-center">
                   {selectedContract?.status === "completed" || jobStatus === "completed" ? (
                     <span>Contract Completed</span>
                   ) : selectedContract?.status === "disputed" ? (
                     <span>Dispute Active</span>
                   ) : selectedContract?.status === "pending_dispute" ? (
                     <span>Dispute Pending Approval</span>
                   ) : (
                     <span>Job In Progress</span>
                   )}
                 </h3>
                 {hiredApplication ? (
                   <div className="bg-[#0A0A09] p-6 border border-[#1F1F1D] rounded">
                     <h4 className="font-serif text-base text-[#C5A880] mb-4 border-b border-[#1F1F1D] pb-2">Hired Freelancer Details</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2.5 text-sm">
                         <p className="text-[#A3A39C]"><span className="font-mono text-xs uppercase tracking-wider text-[#8E8E87] block mb-0.5">Name</span> {hiredApplication.freelancerId?.name || "Unknown"}</p>
                         <p className="text-[#A3A39C]"><span className="font-mono text-xs uppercase tracking-wider text-[#8E8E87] block mb-0.5">Email</span> {hiredApplication.freelancerId?.email || "N/A"}</p>
                         {hiredApplication.jobId.blockchainJobId !== undefined && hiredApplication.jobId.blockchainJobId !== null && (
                           <p className="text-[#A3A39C]"><span className="font-mono text-xs uppercase tracking-wider text-[#8E8E87] block mb-0.5">Blockchain Job ID</span> <span className="px-2 py-0.5 rounded bg-[#121211] border border-[#1F1F1D] font-mono text-xs font-bold text-white">#{hiredApplication.jobId.blockchainJobId}</span></p>
                         )}
                         {hiredApplication.resumeLink && (
                           <a
                             href={hiredApplication.resumeLink}
                             target="_blank"
                             rel="noreferrer"
                             className="text-[#C5A880] hover:text-[#E2A93E] inline-flex items-center text-xs font-semibold underline mt-2"
                           >
                             View Resume Document
                           </a>
                         )}
                       </div>
                       <div className="bg-[#121211] p-4 rounded border border-[#1F1F1D]">
                         <h5 className="font-mono text-xs uppercase tracking-wider text-[#8E8E87] mb-2">Cover Letter</h5>
                         <p className="text-sm text-[#A3A39C] leading-relaxed italic">{hiredApplication.coverLetter || "No cover letter provided"}</p>
                       </div>
                     </div>
       
                     {selectedContract?.status === "disputed" || selectedContract?.status === "pending_dispute" ? (
                       <div className="mt-6 bg-red-950/20 border border-red-800 text-red-200 p-4 rounded text-sm">
                         <div className="flex items-center gap-2 font-bold mb-1.5">
                           <span>Disputed Escrow Lockout State ({selectedContract?.status === "pending_dispute" ? "Pending approval from counterparty" : "Active DAO Arbitration"}).</span>
                         </div>
                         <p className="text-xs text-[#8E8E87]">
                           {selectedContract?.status === "pending_dispute"
                             ? "The other party has proposed raising this to the DAO Governance portal. Awaiting contract approval confirmation."
                             : "Funds are locked on-chain. Platform voters will determine resolution distribution options."}
                         </p>
                         <div className="mt-4 flex flex-wrap gap-3">
                           <button
                             onClick={() => setShowWeb3Dispute(true)}
                             className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold transition-all"
                           >
                             Manage Dispute on Blockchain
                           </button>
                           {selectedContract?.status === "disputed" && (
                             <Link href="/dao" className="text-xs text-[#C5A880] hover:underline font-mono uppercase tracking-wider flex items-center">
                               View Governance Dashboard
                             </Link>
                           )}
                         </div>
                       </div>
                     ) : jobStatus === "in_progress" && selectedContract?.status !== "completed" ? (
                       <div className="mt-6 pt-6 border-t border-[#1F1F1D] flex flex-wrap gap-3 justify-end">
                         {hiredApplication.jobId.blockchainJobId !== undefined && hiredApplication.jobId.blockchainJobId !== null && (
                           <button
                             onClick={() => setShowWeb3Complete(true)}
                             className="bg-[#C5A880] text-black px-4 py-2 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all"
                           >
                             Complete on Blockchain
                           </button>
                         )}
                         
                         {hiredApplication.jobId.blockchainJobId !== undefined && hiredApplication.jobId.blockchainJobId !== null && (
                           <button
                             onClick={() => setShowWeb3Dispute(true)}
                             className="border border-red-900/30 hover:border-red-800 hover:bg-red-950/20 text-red-400 px-4 py-2 rounded text-xs font-semibold transition-all"
                           >
                             Dispute on Blockchain
                           </button>
                         )}
                       </div>
                     ) : (
                       <div className="mt-6 bg-green-950/20 border border-green-800 text-green-200 p-4 rounded text-center text-sm font-medium">
                         Contract completed and freelancer reviewed successfully.
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="bg-[#0A0A09] p-6 border border-[#1F1F1D] rounded text-center text-[#8E8E87]">
                     <p>No hired candidate matches</p>
                   </div>
                 )}
               </div>
             ) : applications.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 bg-[#0F0F0E] rounded border border-[#1F1F1D] shadow-sm">
                 <Briefcase className="w-10 h-10 text-[#1F1F1D] mb-3" />
                 <p className="text-[#8E8E87] text-sm">No applications received yet</p>
               </div>
             ) : (
               <div>
                 <h3 className="text-lg font-serif font-medium text-white mb-4">Candidate Applications</h3>
                 <div className="space-y-4">
                   {applications.map((application) => (
                     <div 
                       key={application._id} 
                       className="bg-[#121211] p-6 rounded border border-[#1F1F1D] hover:border-[#C5A880]/30 transition-all duration-300"
                     >
                       <div className="flex justify-between items-center mb-4">
                         <h4 className="font-serif text-lg text-white font-medium">{application.freelancerId?.name || "Unknown"}</h4>
                         <span className="text-[10px] font-mono text-[#8E8E87] uppercase">
                           Applied {new Date(application.appliedAt).toLocaleDateString()}
                         </span>
                       </div>
       
                       <p className="text-sm text-[#A3A39C] mb-2">
                         <span className="text-[#8E8E87] font-mono text-xs uppercase mr-2">Email:</span>
                         {application.freelancerId?.email || "N/A"}
                       </p>
       
                       {application.resumeLink && (
                         <a
                           href={application.resumeLink}
                           target="_blank"
                           rel="noreferrer"
                           className="text-[#C5A880] hover:underline text-xs font-semibold inline-flex items-center"
                         >
                           Open Resume Document
                         </a>
                       )}
       
                       <div className="mt-4 pt-4 border-t border-[#1F1F1D]/55">
                         <h5 className="font-mono text-xs uppercase tracking-wider text-[#8E8E87] mb-2">Cover Letter</h5>
                         <div className="bg-[#0A0A09] p-4 rounded border border-[#1F1F1D]/50 text-sm text-[#A3A39C] leading-relaxed">
                           {application.coverLetter || "No cover letter provided"}
                         </div>
                       </div>
 
                       <div className="mt-6 flex flex-wrap gap-3">
                         <motion.button
                           onClick={() => handleWeb3Hire(application)}
                           className="bg-[#C5A880] text-black px-5 py-2 rounded text-xs font-semibold hover:bg-[#E2A93E] transition-all"
                           whileTap={{ scale: 0.99 }}
                         >
                           Hire with Web3 Escrow
                         </motion.button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
         )}
       </div>
 
       {/* Complete Rating Modal */}
       {showRatingModal && selectedContract && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-md w-full shadow-2xl">
             <h3 className="text-lg font-serif font-medium text-white mb-4">Complete Contract</h3>
             <p className="text-xs text-[#8E8E87] mb-4">Provide rating and feedback to finalize milestone completion.</p>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Rating</label>
                 <div className="flex gap-1.5">
                   {[1,2,3,4,5].map((star) => (
                     <span 
                       key={star} 
                       className={`text-2xl cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-700'}`}
                       onClick={() => setRating(star)}
                     >
                       ★
                     </span>
                   ))}
                 </div>
               </div>
 
               <div>
                 <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Review Feedback</label>
                 <textarea
                   value={feedback}
                   onChange={(e) => setFeedback(e.target.value)}
                   className="w-full p-3 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-sm"
                   rows={4}
                   placeholder="Describe deliverables feedback..."
                 />
               </div>
 
               <div className="flex justify-end gap-3 pt-2">
                 <button 
                   onClick={() => setShowRatingModal(false)}
                   className="border border-[#1F1F1D] text-[#A3A39C] hover:text-white px-4 py-2 rounded text-xs font-semibold"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => handleCompleteContract(selectedContract._id)}
                   className="bg-[#C5A880] text-black px-4 py-2 rounded text-xs font-semibold hover:bg-[#E2A93E]"
                 >
                   Confirm Completion
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
 
       {/* Dispute Input Modal */}
       {showDisputeModal && selectedContract && (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-md w-full shadow-2xl">
             <h3 className="text-lg font-serif font-medium text-white mb-2">File a Contract Dispute</h3>
             <p className="text-xs text-red-400 mb-4">Filing a dispute locks contract payouts. Review is escalated to on-chain DAO voters.</p>
 
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Reason for dispute</label>
                 <textarea
                   value={disputeReason}
                   onChange={(e) => setDisputeReason(e.target.value)}
                   className="w-full p-3 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-sm"
                   rows={4}
                   placeholder="Describe why milestone deliverables are not met..."
                   required
                 />
               </div>
 
               <div className="flex justify-end gap-3 pt-2">
                 <button 
                   onClick={() => setShowDisputeModal(false)}
                   className="border border-[#1F1F1D] text-[#A3A39C] hover:text-white px-4 py-2 rounded text-xs font-semibold"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => handleDisputeContract(selectedContract._id)}
                   className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold"
                   disabled={!disputeReason.trim()}
                 >
                   File Dispute
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
 
       {/* Web3 Action Modals */}
       {showWeb3Hiring && selectedApplication && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b border-[#1F1F1D] pb-3">
               <h2 className="text-xl font-serif font-medium text-white">Hire via Web3 Escrow</h2>
               <button onClick={() => setShowWeb3Hiring(false)} className="text-[#8E8E87] hover:text-white">✕</button>
             </div>
             <Web3Hiring
               jobId={selectedApplication.jobId.blockchainJobId!}
               jobDetails={{
                 title: selectedApplication.jobId.title,
                 budget: jobs.find(j => j._id === selectedJob)?.budget || 0,
                 companyName: currentUser?.name
               }}
               employerWallet={currentUser?.walletAddress || undefined}
               freelancerAddress={selectedApplication.freelancerId?.walletAddress || ""}
               freelancerName={selectedApplication.freelancerId?.name || ""}
               budget={jobs.find(j => j._id === selectedJob)?.budget || 0}
               onHireSuccess={handleWeb3HireSuccess}
             />
           </div>
         </div>
       )}
 
       {showWeb3Complete && selectedContract && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b border-[#1F1F1D] pb-3">
               <h2 className="text-xl font-serif font-medium text-white">Complete Job on Blockchain</h2>
               <button onClick={() => setShowWeb3Complete(false)} className="text-[#8E8E87] hover:text-white">✕</button>
             </div>
             <Web3JobIntegration
               mode="complete"
               jobId={selectedContract.jobId?.blockchainJobId?.toString()}
               jobDetails={{
                 title: selectedContract.jobId?.title || "",
                 budget: selectedContract.escrowAmount,
                 companyName: currentUser?.name
               }}
               profileWalletAddress={currentUser?.walletAddress || undefined}
               onSuccess={handleWeb3CompleteSuccess}
             />
           </div>
         </div>
       )}
 
       {showWeb3Dispute && selectedContract && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b border-[#1F1F1D] pb-3">
               <h2 className="text-xl font-serif font-medium text-white">Web3 Dispute Resolution</h2>
               <button onClick={() => setShowWeb3Dispute(false)} className="text-[#8E8E87] hover:text-white">✕</button>
             </div>
             <Web3Dispute
               jobId={selectedContract.jobId?.blockchainJobId ?? 0}
               userRole={userRole}
               currentUserId={currentUser?._id || currentUser?.id}
               employerUserId={typeof selectedContract.companyId === 'object' ? selectedContract.companyId._id : selectedContract.companyId}
               freelancerUserId={typeof selectedContract.freelancerId === 'object' ? selectedContract.freelancerId._id : selectedContract.freelancerId}
               profileWalletAddress={currentUser?.walletAddress || undefined}
               onDisputeRaised={handleWeb3DisputeRaisedSuccess}
               onDisputeApproved={handleWeb3DisputeApprovedSuccess}
               onDisputeResolved={handleWeb3DisputeResolvedSuccess}
             />
           </div>
         </div>
       )}
     </div>
   )
 }
 
 export default Hire;
