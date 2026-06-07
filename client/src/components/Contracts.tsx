/* eslint-disable @typescript-eslint/no-explicit-any */
 "use client"
 
 import { useEffect, useState, useRef } from "react"
 import axios from "axios"
 import { StarIcon, DollarSign, Calendar, AlertTriangle, Check, X, ChevronRight, Loader2 } from "lucide-react"
 import { motion, AnimatePresence } from "framer-motion"
 import Web3JobIntegration from "./Web3JobIntegration"
 import Web3Dispute from "./Web3Dispute"
 import { toast } from "sonner"
 
 interface Job {
   _id: string
   title: string
   description: string
   budget: number
   blockchainJobId?: number;
 }
 
 interface User {
   _id: string
   name: string
   email: string
 }
 
 interface Contract {
   _id: string
   jobId: Job
   companyId: User
   freelancerId: User
   escrowAmount: number
   status: "ongoing" | "completed" | "disputed" | "pending_dispute"
   paymentStatus: "pending" | "paid"
   createdAt: string
   updatedAt: string
   disputeReason?: string
 }
 
 const Contracts = () => {
   const [contracts, setContracts] = useState<Contract[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [userRole, setUserRole] = useState<"Freelancer" | "Company" | null>(null)
   const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
   const [rating, setRating] = useState<number>(5)
   const [feedback, setFeedback] = useState<string>("")
   const [disputeReason, setDisputeReason] = useState<string>("")
   const [activeTab, setActiveTab] = useState<"all" | "ongoing" | "completed" | "disputed">("all")
   const [isRefreshing, setIsRefreshing] = useState(false)
   const modalRef = useRef<HTMLDivElement>(null)
   const [showWeb3Complete, setShowWeb3Complete] = useState(false)
   const [showWeb3Dispute, setShowWeb3Dispute] = useState(false)
   const [showCompleteModal, setShowCompleteModal] = useState(false)
   const [showDisputeModal, setShowDisputeModal] = useState(false)
   const [profileWalletAddress, setProfileWalletAddress] = useState<string | null>(null)
   const [currentUserId, setCurrentUserId] = useState<string | null>(null)
 
   const closeAllModals = () => {
     setSelectedContract(null)
     setShowCompleteModal(false)
     setShowDisputeModal(false)
     setShowWeb3Complete(false)
     setShowWeb3Dispute(false)
     setDisputeReason("")
   }
 
   const openCompleteModal = (contract: Contract) => {
     closeAllModals()
     setSelectedContract(contract)
     setShowCompleteModal(true)
   }
 
   const openDisputeModal = (contract: Contract) => {
     closeAllModals()
     setSelectedContract(contract)
     setShowDisputeModal(true)
     setDisputeReason("")
   }
 
   const openWeb3CompleteModal = (contract: Contract) => {
     closeAllModals()
     setSelectedContract(contract)
     setShowWeb3Complete(true)
   }
 
   const openWeb3DisputeModal = (contract: Contract) => {
     closeAllModals()
     setSelectedContract(contract)
     setShowWeb3Dispute(true)
   }
 
   useEffect(() => {
     const fetchUserAndContracts = async () => {
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
         setUserRole(userRes.data.user.role)
         setProfileWalletAddress(userRes.data.user.walletAddress || null)
         setCurrentUserId(userRes.data.user._id || userRes.data.user.id || null)
 
         const contractsRes = await axios.get("/api/contracts", {
           headers: { Authorization: `Bearer ${token}` },
         })
         setContracts(contractsRes.data)
         setLoading(false)
       } catch (error) {
         console.error("Error fetching data:", error)
         setError("Failed to load contracts")
         setLoading(false)
       }
     }
 
     fetchUserAndContracts()
   }, [])
 
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       const web3DisputeModal = document.getElementById("web3-dispute-modal");
       const web3CompleteModal = document.getElementById("web3-complete-modal");
 
       if (web3DisputeModal && !web3DisputeModal.contains(event.target as Node)) {
         closeAllModals();
         return;
       }
       if (web3CompleteModal && !web3CompleteModal.contains(event.target as Node)) {
         closeAllModals();
         return;
       }
 
       if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
         closeAllModals()
       }
     }
     
     document.addEventListener("mousedown", handleClickOutside)
     return () => document.removeEventListener("mousedown", handleClickOutside)
   }, [])
 
   const refreshContracts = async () => {
     try {
       setIsRefreshing(true)
       const token = localStorage.getItem("token")
       const contractsRes = await axios.get("/api/contracts", {
         headers: { Authorization: `Bearer ${token}` },
       })
       setContracts(contractsRes.data)
       setIsRefreshing(false)
     } catch (error) {
       console.error("Error refreshing contracts:", error)
       setIsRefreshing(false)
     }
   }
 
   const handlePayment = async (contractId: string) => {
     try {
       const token = localStorage.getItem("token")
       await axios.post("/api/contracts/payment", { contractId }, { headers: { Authorization: `Bearer ${token}` } })
       await refreshContracts()
       toast.success("Payment processed successfully")
     } catch (error) {
       console.error("Error processing payment:", error)
       toast.error("Failed to process payment")
     }
   }
 
   const handleCompleteContract = async (contractId: string, customRating?: number, customFeedback?: string) => {
     try {
       const token = localStorage.getItem("token")
       const payload = { 
         contractId, 
         status: "completed", 
         rating: customRating !== undefined ? customRating : rating, 
         feedback: customFeedback !== undefined ? customFeedback : feedback 
       };
       await axios.post(
         "/api/contracts/update",
         payload,
         { headers: { Authorization: `Bearer ${token}` } },
       )
       
       await refreshContracts()
       closeAllModals()
       setRating(5)
       setFeedback("")
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
       
       await refreshContracts()
       closeAllModals()
     } catch (error) {
       console.error("Error filing dispute:", error)
       toast.error("Failed to file dispute")
     }
   }
 
   const handleWeb3Complete = (contract: Contract) => {
     openWeb3CompleteModal(contract)
   }
 
   const handleWeb3CompleteSuccess = (data?: { rating?: number; metadataURI?: string }) => {
     if (selectedContract) {
       const finalRating = data?.rating || rating;
       handleCompleteContract(selectedContract._id, finalRating, "Completed via blockchain escrow release");
     } else {
       refreshContracts()
       closeAllModals()
     }
     toast.success("Job completed successfully on blockchain!")
   }
 
   const handleWeb3Dispute = (contract: Contract) => {
     openWeb3DisputeModal(contract)
   }
 
   const handleWeb3DisputeRaisedSuccess = (reason?: string) => {
     if (selectedContract) {
       handleDisputeContract(selectedContract._id, reason || "Disputed on blockchain")
     } else {
       refreshContracts()
       closeAllModals()
     }
     toast.success("Dispute raised successfully on blockchain!")
   }
 
   const handleWeb3DisputeApprovedSuccess = async (approvalReason: string) => {
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
         await refreshContracts()
         closeAllModals()
         toast.success("Dispute approved and submitted to DAO!")
       } catch (err) {
         console.error("Error updating dispute approval in DB:", err)
         toast.error("Dispute approved on-chain, but DB update failed.")
       }
     } else {
       refreshContracts()
       closeAllModals()
     }
   }
 
   const handleWeb3DisputeResolvedSuccess = () => {
     if (selectedContract) {
       handleCompleteContract(selectedContract._id, 5, "Dispute resolved on blockchain")
     } else {
       refreshContracts()
       closeAllModals()
     }
     toast.success("Dispute resolved successfully on blockchain!")
   }
 
   const filteredContracts = contracts.filter(contract => {
     if (activeTab === "all") return true;
     if (activeTab === "disputed") {
       return contract.status === "disputed" || contract.status === "pending_dispute";
     }
     return contract.status === activeTab;
   });
 
   const getStatusColors = (status: string) => {
     switch (status) {
       case "ongoing":
         return "border-[#C5A880]/30 text-[#C5A880] bg-[#C5A880]/5";
       case "completed":
         return "border-green-500/20 text-green-400 bg-green-500/5";
       case "disputed":
         return "border-red-500/20 text-red-400 bg-red-500/5";
       case "pending_dispute":
         return "border-amber-500/20 text-amber-400 bg-amber-500/5 animate-pulse";
       case "pending":
         return "border-amber-500/20 text-amber-400 bg-amber-500/5";
       case "paid":
         return "border-green-500/20 text-green-400 bg-green-500/5";
       default:
         return "border-[#1F1F1D] text-[#8E8E87] bg-[#121211]";
     }
   }
 
   const renderStarRating = () => {
     return (
       <div className="flex items-center space-x-1.5 mt-2">
         {[1, 2, 3, 4, 5].map((star) => (
           <motion.div
             key={star}
             whileHover={{ scale: 1.15 }}
             whileTap={{ scale: 0.9 }}
           >
             <StarIcon
               className={`h-6 w-6 cursor-pointer ${
                 star <= rating ? "text-yellow-400 fill-yellow-400" : "text-[#1F1F1D]"
               }`}
               onClick={() => setRating(star)}
             />
           </motion.div>
         ))}
       </div>
     )
   }
 
   const renderContractActions = (contract: Contract) => {
     if (contract.status === "pending_dispute" || contract.status === "disputed") {
       return (
         <div className="mt-4">
           <motion.button
             whileTap={{ scale: 0.99 }}
             onClick={() => handleWeb3Dispute(contract)}
             className="border border-red-800 hover:bg-red-950/20 text-red-400 px-4 py-2.5 rounded text-xs font-semibold w-full flex items-center justify-center gap-2"
           >
             Manage Dispute on Blockchain
           </motion.button>
         </div>
       )
     }
 
     if (userRole === "Freelancer") {
       if (contract.status === "ongoing") {
         return (
           <div className="mt-4">
             <motion.button
               whileTap={{ scale: 0.99 }}
               onClick={() => handleWeb3Dispute(contract)}
               className="border border-red-800 hover:bg-red-950/20 text-red-400 px-4 py-2.5 rounded text-xs font-semibold w-full flex items-center justify-center gap-2"
             >
               Dispute Web3
             </motion.button>
           </div>
         )
       }
       return null
     }
 
     if (userRole !== "Company") return null;
 
     if (contract.status === "ongoing") {
       return (
         <div className="mt-4 grid grid-cols-2 gap-2">
           <motion.button
             onClick={() => handleWeb3Complete(contract)}
             className="bg-[#C5A880] text-black hover:bg-[#E2A93E] px-3 py-2 rounded text-xs font-semibold transition-all text-center"
           >
             Complete Web3
           </motion.button>
           
           <motion.button
             onClick={() => handleWeb3Dispute(contract)}
             className="border border-red-900/30 hover:border-red-800 hover:bg-red-950/20 text-red-400 px-3 py-2 rounded text-xs font-semibold transition-all text-center"
           >
             Dispute Web3
           </motion.button>
         </div>
       )
     }
 
     return null
   }
 
   if (loading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-[#0A0A09]">
         <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           className="mb-4"
         >
           <Loader2 className="h-10 w-10 text-[#C5A880]" />
         </motion.div>
         <p className="text-xs font-mono uppercase tracking-widest text-[#8E8E87]">Loading contracts...</p>
       </div>
     )
   }
 
   if (error) {
     return (
       <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         className="p-6 max-w-md mx-auto mt-12 bg-red-950/20 border border-red-800 rounded text-red-200"
       >
         <div className="flex items-center text-red-400 mb-2">
           <AlertTriangle className="h-5 w-5 mr-2" />
           <h2 className="font-serif font-medium text-lg text-white">Error</h2>
         </div>
         <p className="text-sm text-[#8E8E87]">{error}</p>
         <motion.button
           whileTap={{ scale: 0.98 }}
           className="mt-4 px-4 py-2 bg-red-800 text-white rounded text-xs font-semibold hover:bg-red-700"
           onClick={() => window.location.reload()}
         >
           Try Again
         </motion.button>
       </motion.div>
     )
   }
 
   return (
     <div className="p-6 min-h-screen bg-[#0A0A09] text-[#F5F5F4] font-sans selection:bg-[#E2A93E] selection:text-black">
       <motion.div
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4 }}
       >
         <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
           <div>
             <h1 className="text-3xl font-serif text-white font-medium">
               {userRole === "Freelancer" ? "My Contracts" : "Manage Contracts"}
             </h1>
             <p className="text-xs text-[#8E8E87] mt-1 font-mono uppercase tracking-wider">Escrow Ledger Status</p>
           </div>
           
           <motion.button
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={refreshContracts}
             disabled={isRefreshing}
             className="px-4 py-2 border border-[#1F1F1D] rounded bg-[#0F0F0E] hover:bg-[#121211] text-[#A3A39C] hover:text-[#F5F5F4] text-xs font-semibold flex items-center gap-2 transition-all"
           >
             <motion.div
               animate={isRefreshing ? { rotate: 360 } : {}}
               transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
             >
               <Loader2 className="h-3.5 w-3.5" />
             </motion.div>
             Refresh
           </motion.button>
         </div>
 
         {/* Tab Navigation */}
         <div className="flex mb-8 bg-[#0F0F0E] p-1 rounded border border-[#1F1F1D] max-w-6xl mx-auto">
           {["all", "ongoing", "completed", "disputed"].map((tab) => (
             <motion.button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`flex-1 py-1.5 px-3 rounded text-xs font-mono uppercase tracking-wider transition-all ${
                 activeTab === tab
                   ? "bg-[#C5A880] text-black font-semibold shadow-sm"
                   : "text-[#8E8E87] hover:text-[#F5F5F4]"
               }`}
             >
               {tab}
             </motion.button>
           ))}
         </div>
       </motion.div>
 
       {filteredContracts.length === 0 ? (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="text-center py-16 bg-[#0F0F0E] border border-[#1F1F1D] rounded max-w-6xl mx-auto text-[#8E8E87]"
         >
           <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded border border-[#1F1F1D] bg-[#121211]">
             <Calendar className="h-6 w-6 text-[#C5A880]" />
           </div>
           <h3 className="text-lg font-serif font-medium text-white mb-1">No contracts found</h3>
           <p className="text-sm">
             {activeTab === "all" 
               ? "You do not have any contracts established yet." 
               : `You do not have any ${activeTab} contracts.`}
           </p>
         </motion.div>
       ) : (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.4 }}
           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
         >
           <AnimatePresence>
             {filteredContracts.map((contract, index) => (
               <motion.div
                 key={contract._id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.97 }}
                 transition={{ delay: index * 0.03 }}
                 className="bg-[#0F0F0E] border border-[#1F1F1D] rounded p-5 shadow-xs relative flex flex-col justify-between"
               >
                 <div>
                   <h2 className="font-serif font-medium text-white text-base leading-snug mb-4">{contract.jobId.title}</h2>
 
                   <div className="space-y-3 pt-3 border-t border-[#1F1F1D]/55 mb-5">
                     <div className="flex items-center text-sm">
                       <div className="bg-[#121211] border border-[#1F1F1D] p-1.5 rounded mr-3 text-[#C5A880]">
                         <ChevronRight className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <p className="text-[10px] font-mono text-[#8E8E87] uppercase tracking-wider">
                           {userRole === "Freelancer" ? "CLIENT" : "FREELANCER"}
                         </p>
                         <p className="font-medium text-[#F5F5F4] mt-0.5">
                           {userRole === "Freelancer" ? contract.companyId.name : contract.freelancerId.name}
                         </p>
                       </div>
                     </div>
 
                     <div className="flex items-center text-sm">
                       <div className="bg-[#121211] border border-[#1F1F1D] p-1.5 rounded mr-3 text-[#C5A880]">
                         <DollarSign className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <p className="text-[10px] font-mono text-[#8E8E87] uppercase tracking-wider">ESCROW BUDGET</p>
                         <p className="font-medium text-[#F5F5F4] mt-0.5">${contract.escrowAmount.toLocaleString()} USD</p>
                       </div>
                     </div>
 
                     <div className="flex items-center text-sm">
                       <div className="bg-[#121211] border border-[#1F1F1D] p-1.5 rounded mr-3 text-[#C5A880]">
                         <Calendar className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <p className="text-[10px] font-mono text-[#8E8E87] uppercase tracking-wider">STARTED ON</p>
                         <p className="font-medium text-[#F5F5F4] mt-0.5">{new Date(contract.createdAt).toLocaleDateString()}</p>
                       </div>
                     </div>
                   </div>
 
                   <div className="flex flex-wrap gap-1.5 mb-2">
                     <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-mono uppercase tracking-wider ${getStatusColors(contract.status)}`}>
                       {contract.status === "ongoing" ? "in progress" : contract.status.replace("_", " ")}
                     </span>
                     <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-mono uppercase tracking-wider ${getStatusColors(contract.paymentStatus)}`}>
                       {contract.paymentStatus}
                     </span>
                     {contract.jobId.blockchainJobId !== undefined && contract.jobId.blockchainJobId !== null && (
                       <span className="px-2.5 py-0.5 border border-[#1F1F1D] bg-[#121211] rounded-full text-[10px] font-mono text-white">
                         Blockchain: #{contract.jobId.blockchainJobId}
                       </span>
                     )}
                   </div>
 
                   {contract.disputeReason && (
                     <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: "auto" }}
                       className="mt-4 p-3 bg-red-950/20 border border-red-850 rounded text-red-200 text-xs"
                     >
                       <div className="flex items-center mb-1 font-bold text-red-400">
                         <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                         <span>Dispute Reason:</span>
                       </div>
                       <p className="text-[#A3A39C] mt-0.5 leading-relaxed">{contract.disputeReason}</p>
                     </motion.div>
                   )}
                 </div>
 
                 {renderContractActions(contract)}
               </motion.div>
             ))}
           </AnimatePresence>
         </motion.div>
       )}
 
       {/* Complete Contract Modal */}
       <AnimatePresence>
         {showCompleteModal && selectedContract && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
           >
             <motion.div
               ref={modalRef}
               initial={{ scale: 0.95, y: 15 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.95, y: 15 }}
               className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-md w-full shadow-2xl"
             >
               <div className="flex justify-between items-center mb-4 border-b border-[#1F1F1D] pb-3">
                 <h2 className="text-lg font-serif font-medium text-white">Complete Contract</h2>
                 <motion.button onClick={closeAllModals} className="text-[#8E8E87] hover:text-white">✕</motion.button>
               </div>
               
               <div className="bg-[#121211] border border-[#1F1F1D] p-3.5 rounded mb-4 text-xs text-[#A3A39C]">
                 <p>
                   You are completing the contract for {selectedContract.jobId.title} with{" "}
                   <span className="text-white font-semibold">{selectedContract.freelancerId.name}</span>
                 </p>
               </div>
               
               <h3 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Rate Freelancer</h3>
               {renderStarRating()}
 
               <h3 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87] mt-5 mb-2">Feedback review</h3>
               <textarea
                 value={feedback}
                 onChange={(e) => setFeedback(e.target.value)}
                 placeholder="Share your experience working with this freelancer..."
                 className="w-full p-3 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-sm"
                 rows={4}
               />
 
               <div className="flex justify-end space-x-3 mt-6">
                 <button 
                   onClick={closeAllModals} 
                   className="px-4 py-2 border border-[#1F1F1D] text-[#A3A39C] hover:text-white rounded text-xs font-semibold"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => handleCompleteContract(selectedContract._id)}
                   className="px-4 py-2 bg-[#C5A880] text-black rounded text-xs font-semibold hover:bg-[#E2A93E]"
                 >
                   Complete Contract
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
 
       {/* Dispute Modal */}
       <AnimatePresence>
         {showDisputeModal && selectedContract && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
           >
             <motion.div
               ref={modalRef}
               initial={{ scale: 0.95, y: 15 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.95, y: 15 }}
               className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-md w-full shadow-2xl"
             >
               <div className="flex justify-between items-center mb-4 border-b border-[#1F1F1D] pb-3">
                 <h2 className="text-lg font-serif font-medium text-white">File a Dispute</h2>
                 <motion.button onClick={closeAllModals} className="text-[#8E8E87] hover:text-white">✕</motion.button>
               </div>
               
               <div className="bg-red-950/20 border border-red-800 text-red-200 p-4 rounded text-xs mb-4">
                 <div className="flex items-center mb-1 font-bold">
                   <AlertTriangle className="h-4 w-4 mr-1 text-red-400" />
                   <span>Warning</span>
                 </div>
                 <p className="text-[#A3A39C] leading-relaxed mt-0.5">
                   Filing a dispute locks contract payouts and escalates review to the DAO Governance dashboard. 
                   Ensure that you have attempted direct resolution before escalating.
                 </p>
               </div>
               
               <h3 className="text-xs font-mono uppercase tracking-wider text-[#8E8E87] mb-2">Explain reason</h3>
               <textarea
                 value={disputeReason}
                 onChange={(e) => setDisputeReason(e.target.value)}
                 placeholder="Please provide details about why you're disputing this contract..."
                 className="w-full p-3 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none text-sm animate-all"
                 rows={4}
                 required
               />
 
               <div className="flex justify-end space-x-3 mt-6">
                 <button 
                   onClick={closeAllModals} 
                   className="px-4 py-2 border border-[#1F1F1D] text-[#A3A39C] hover:text-white rounded text-xs font-semibold"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => handleDisputeContract(selectedContract._id)}
                   className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-semibold"
                   disabled={!disputeReason.trim()}
                 >
                   Submit Dispute
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
 
       {/* Web3 Complete Modal */}
       {showWeb3Complete && selectedContract && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div id="web3-complete-modal" className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b border-[#1F1F1D] pb-3">
               <h2 className="text-lg font-serif font-medium text-white">Complete Job on Blockchain</h2>
               <button onClick={closeAllModals} className="text-[#8E8E87] hover:text-white">✕</button>
             </div>
             
             <Web3JobIntegration
               mode="complete"
               jobId={selectedContract.jobId.blockchainJobId?.toString()}
               jobDetails={{
                 title: selectedContract.jobId.title,
                 budget: selectedContract.escrowAmount,
                 companyName: selectedContract.companyId.name
               }}
               profileWalletAddress={profileWalletAddress || undefined}
               onSuccess={handleWeb3CompleteSuccess}
             />
           </div>
         </div>
       )}
 
       {/* Web3 Dispute Modal */}
       {showWeb3Dispute && selectedContract && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div id="web3-dispute-modal" className="bg-[#0F0F0E] border border-[#1F1F1D] text-[#F5F5F4] rounded-lg p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b border-[#1F1F1D] pb-3">
               <h2 className="text-lg font-serif font-medium text-white">Web3 Dispute Resolution</h2>
               <button onClick={closeAllModals} className="text-[#8E8E87] hover:text-white">✕</button>
             </div>
             
             <Web3Dispute
               jobId={selectedContract.jobId.blockchainJobId!}
               userRole={userRole || 'Company'}
               currentUserId={currentUserId || undefined}
               employerUserId={typeof selectedContract.companyId === 'object' ? (selectedContract.companyId as any)._id : selectedContract.companyId}
               freelancerUserId={typeof selectedContract.freelancerId === 'object' ? (selectedContract.freelancerId as any)._id : selectedContract.freelancerId}
               profileWalletAddress={profileWalletAddress || undefined}
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
 
 export default Contracts