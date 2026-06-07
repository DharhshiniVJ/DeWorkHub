import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Job from "@/models/Job"
import Contract from "@/models/Contract"
import Review from "@/models/Review"
import User from "@/models/User" // Load User schema since ref is populated

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    // Extract jobId from URL path (blockchainJobId)
    const pathname = req.nextUrl.pathname
    const jobIdStr = pathname.split("/").pop()

    if (!jobIdStr || isNaN(Number(jobIdStr))) {
      return NextResponse.json({ error: "Invalid Job ID" }, { status: 400 })
    }

    const blockchainJobId = Number(jobIdStr)

    // Find the Job in MongoDB
    const job = await Job.findOne({ blockchainJobId })
    if (!job) {
      return NextResponse.json({ error: `Job with blockchain ID #${blockchainJobId} not found in DB` }, { status: 404 })
    }

    // Find the Contract associated with the Job
    const contract = await Contract.findOne({ jobId: job._id })
      .populate("companyId", "name companyName")
      .populate("freelancerId", "name")
    
    if (!contract) {
      // Fallback if contract is not found yet
      return NextResponse.json({
        name: `DeWorkHub Job Certificate: ${job.title}`,
        description: `Cryptographically verified completion of job '${job.title}' on DeWorkHub.`,
        image: "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=500&q=80",
        attributes: [
          { trait_type: "Job Title", value: job.title },
          { trait_type: "Status", value: "Completed" }
        ]
      })
    }

    // Find review/rating details
    const review = await Review.findOne({ contractId: contract._id })

    const companyName = contract.companyId?.companyName || contract.companyId?.name || "Unknown"
    const freelancerName = contract.freelancerId?.name || "Unknown"
    const rating = review ? review.rating : 5
    const feedback = review ? review.feedback : "Excellent work completed successfully!"
    const budget = contract.escrowAmount ? `${contract.escrowAmount} ETH` : "N/A"

    // Construct ERC-721 Metadata
    const metadata = {
      name: `DeWorkHub Job Certificate: ${job.title}`,
      description: `Verified work achievement certificate for freelancer ${freelancerName} completing contract for ${companyName}.`,
      image: "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=500&q=80",
      attributes: [
        { trait_type: "Job Title", value: job.title },
        { trait_type: "Company", value: companyName },
        { trait_type: "Freelancer", value: freelancerName },
        { trait_type: "Stars", value: rating },
        { trait_type: "Escrow Budget", value: budget },
        { trait_type: "Employer Feedback", value: feedback }
      ]
    }

    return NextResponse.json(metadata, { status: 200 })
  } catch (error) {
    console.error("Error generating NFT metadata:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
