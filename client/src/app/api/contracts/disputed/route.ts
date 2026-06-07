import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Contract from "@/models/Contract"
import { getUserFromToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    // Authenticate user (any logged in user can view disputed contracts for DAO voting)
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const contracts = await Contract.find({ status: "disputed" })
      .populate("jobId", "title blockchainJobId budget")
      .populate("companyId", "name walletAddress")
      .populate("freelancerId", "name walletAddress")
      .sort({ updatedAt: -1 })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error("Error fetching disputed contracts:", error)
    return NextResponse.json({ message: "Failed to fetch disputed contracts" }, { status: 500 })
  }
}
