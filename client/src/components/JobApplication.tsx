/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
 
 import type React from "react"
 import { useState } from "react"
 import axios from "axios"
 
 interface ApplicationProps {
   jobId: string
   onApplicationSubmit: () => void
 }
 
 const JobApplication = ({ jobId, onApplicationSubmit }: ApplicationProps) => {
   const [coverLetter, setCoverLetter] = useState("")
   const [resumeLink, setResumeLink] = useState("")
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [error, setError] = useState("")
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
     setIsSubmitting(true)
     setError("")
 
     if (!resumeLink) {
       setError("Please provide your resume link")
       setIsSubmitting(false)
       return
     }
 
     try {
       const token = localStorage.getItem("token")
       if (!token) {
         setError("You must be logged in to apply")
         setIsSubmitting(false)
         return
       }
 
       // Create form data
       const formData = new FormData()
       formData.append("jobId", jobId)
       formData.append("coverLetter", coverLetter)
       formData.append("resumeLink", resumeLink)
 
       await axios.post("/api/applications", formData, {
         headers: {
           Authorization: `Bearer ${token}`,
           "Content-Type": "multipart/form-data",
         },
       })
 
       onApplicationSubmit()
       // Reset form
       setCoverLetter("")
       setResumeLink("")
     } catch (error: any) {
       console.error("Error submitting application:", error)
       setError(error.response?.data?.message || "Failed to submit application")
     } finally {
       setIsSubmitting(false)
     }
   }
 
   return (
     <div className="bg-[#0F0F0E] p-6 rounded border border-[#1F1F1D] text-[#F5F5F4]">
       <h3 className="text-lg font-serif font-medium text-white mb-6 border-b border-[#1F1F1D] pb-3">Apply for this Job</h3>
       {error && <div className="bg-red-950/20 border border-red-800 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
 
       <form onSubmit={handleSubmit} className="space-y-5">
         <div>
           <label className="block text-[#A3A39C] text-xs font-mono uppercase tracking-wider mb-2">Cover Letter</label>
           <textarea
             value={coverLetter}
             onChange={(e) => setCoverLetter(e.target.value)}
             className="w-full p-3 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none transition-all"
             rows={4}
             placeholder="Explain why you are suitable for this position..."
             required
           />
         </div>
 
         <div>
           <label className="block text-[#A3A39C] text-xs font-mono uppercase tracking-wider mb-2">Resume Link</label>
           <input
             type="url"
             value={resumeLink}
             onChange={(e) => setResumeLink(e.target.value)}
             className="w-full p-3 bg-[#121211] border border-[#1F1F1D] rounded text-[#F5F5F4] focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] outline-none transition-all"
             placeholder="Paste shareable resume URL (e.g. Google Drive)"
             required
           />
           <p className="text-[#8E8E87] text-xs mt-1.5">Provide a publicly viewable link to your resume document</p>
         </div>
 
         <button
           type="submit"
           disabled={isSubmitting}
           className="w-full py-2.5 px-4 rounded text-black bg-[#C5A880] hover:bg-[#E2A93E] font-medium transition-all text-sm disabled:opacity-50"
         >
           {isSubmitting ? "Submitting Application..." : "Submit Application"}
         </button>
       </form>
     </div>
   )
 }
 
 export default JobApplication
