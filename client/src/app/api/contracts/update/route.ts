import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Contract from "@/models/Contract"
import Job from "@/models/Job"
import Review from "@/models/Review"
import User from "@/models/User"
import { getUserFromToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    // Authenticate user
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { contractId, status, rating, feedback } = body

    if (!contractId || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Find the contract
    const contract = await Contract.findById(contractId)
    if (!contract) {
      return NextResponse.json({ message: "Contract not found" }, { status: 404 })
    }

    // Verify the contract belongs to this user (either company or freelancer)
    // OR allow if the contract is currently disputed and we are updating it to completed (DAO resolution)
    const isParty = contract.companyId.toString() === user.id || contract.freelancerId.toString() === user.id;
    const isDaoResolution = (contract.status === "disputed" || contract.status === "pending_dispute") && status === "completed";

    if (!isParty && !isDaoResolution) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Update contract status
    contract.status = status
    if (body.disputeReason) {
      contract.disputeReason = body.disputeReason
    }
    await contract.save()

    // If contract is completed, update job status
    if (status === "completed") {
      await Job.findByIdAndUpdate(contract.jobId, { status: "completed" })

      // Create review if rating is provided
      if (rating) {
        const review = new Review({
          contractId,
          freelancerId: contract.freelancerId,
          companyId: contract.companyId,
          rating,
          feedback,
        })

        await review.save()

        // Recalculate average rating for freelancer and save to User collection
        const reviews = await Review.find({ freelancerId: contract.freelancerId })
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
        const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0
        await User.findByIdAndUpdate(contract.freelancerId, { rating: avgRating })
      }
    }

    return NextResponse.json({ message: `Contract marked as ${status}` })
  } catch (error) {
    console.error("Error updating contract:", error)
    return NextResponse.json({ message: "Failed to update contract" }, { status: 500 })
  }
}

