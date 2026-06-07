const mongoose = require('mongoose');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('.env.local file not found in client directory.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
const JOB_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_JOB_ESCROW_ADDRESS;

if (!MONGODB_URI || !JOB_ESCROW_ADDRESS) {
  console.error('Missing required environment variables MONGODB_URI or NEXT_PUBLIC_JOB_ESCROW_ADDRESS.');
  process.exit(1);
}

// Minimal ABIs
const JOB_ESCROW_ABI = [
  "function jobs(uint256) public view returns (uint256 id, address employer, address payable freelancer, uint256 budget, bool isHired, bool isCompleted, bool isDisputed, address disputeInitiator, string disputeReason)"
];

// Contract Mongoose Schema
const ContractSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  escrowAmount: Number,
  status: String,
  paymentStatus: String,
  disputeReason: String
}, { timestamps: true });

const JobSchema = new mongoose.Schema({
  title: String,
  status: String,
  blockchainJobId: Number
});

const Contract = mongoose.models.Contract || mongoose.model('Contract', ContractSchema);
const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);

async function sync() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB successfully.');

  console.log('Connecting to local Hardhat node...');
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contract = new ethers.Contract(JOB_ESCROW_ADDRESS, JOB_ESCROW_ABI, provider);

  // Find all disputed contracts
  const disputedContracts = await Contract.find({
    status: { $in: ['disputed', 'pending_dispute'] }
  }).populate('jobId');

  console.log(`Found ${disputedContracts.length} disputed/pending_dispute contracts in MongoDB.`);

  for (const dbContract of disputedContracts) {
    const jobObj = dbContract.jobId;
    if (!jobObj || jobObj.blockchainJobId === undefined || jobObj.blockchainJobId === null) {
      console.log(`Skipping contract ${dbContract._id} because it lacks a blockchainJobId.`);
      continue;
    }

    const blockchainJobId = Number(jobObj.blockchainJobId);
    console.log(`Checking Job #${blockchainJobId} on-chain...`);

    try {
      const jobInfo = await contract.jobs(blockchainJobId);
      const isDisputed = jobInfo.isDisputed;
      const budget = ethers.formatEther(jobInfo.budget);

      console.log(`On-chain state for Job #${blockchainJobId}: isDisputed = ${isDisputed}, budget = ${budget} ETH`);

      if (!isDisputed && parseFloat(budget) === 0) {
        console.log(`Job #${blockchainJobId} has been resolved on-chain! Updating database...`);

        // Update Contract status
        dbContract.status = 'completed';
        await dbContract.save();

        // Update Job status
        await Job.findByIdAndUpdate(jobObj._id, { status: 'completed' });

        console.log(`Successfully synced contract ${dbContract._id} and job ${jobObj._id} to completed.`);
      } else {
        console.log(`Job #${blockchainJobId} is still active/unresolved on-chain.`);
      }
    } catch (err) {
      console.error(`Error querying on-chain job #${blockchainJobId}:`, err.message);
    }
  }

  console.log('Sync complete. Disconnecting...');
  await mongoose.disconnect();
}

sync().catch(console.error);
