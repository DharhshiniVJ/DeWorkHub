import { expect } from "chai";
import { ethers } from "hardhat";
import { JobEscrow, DeWorkDAO, ReputationNFT } from "../typechain-types";

describe("Mutual-Consent Dispute Resolution Flow", function () {
  let reputationNFT: any;
  let dao: any;
  let escrow: any;
  let owner: any;
  let employer: any;
  let freelancer: any;
  let voter: any;

  beforeEach(async function () {
    [owner, employer, freelancer, voter] = await ethers.getSigners();

    // Deploy Reputation NFT
    const ReputationNFTFactory = await ethers.getContractFactory("ReputationNFT");
    reputationNFT = await ReputationNFTFactory.deploy();
    await reputationNFT.waitForDeployment();

    // Deploy DAO
    const DeWorkDAOFactory = await ethers.getContractFactory("DeWorkDAO");
    dao = await DeWorkDAOFactory.deploy();
    await dao.waitForDeployment();

    // Deploy Escrow
    const JobEscrowFactory = await ethers.getContractFactory("JobEscrow");
    escrow = await JobEscrowFactory.deploy(await reputationNFT.getAddress(), await dao.getAddress());
    await escrow.waitForDeployment();

    // Link DAO to Escrow
    await dao.setEscrowContract(await escrow.getAddress());
  });

  it("Should execute the full mutual-consent dispute flow (Employer initiates, Freelancer approves)", async function () {
    // 1. Post a job
    await escrow.connect(employer).postJob();
    const jobId = 1;

    // Verify job is posted
    let job = await escrow.jobs(jobId);
    expect(job.employer).to.equal(employer.address);

    // 2. Hire Freelancer
    const budget = ethers.parseEther("1.0");
    await escrow.connect(employer).hireFreelancer(jobId, freelancer.address, { value: budget });

    job = await escrow.jobs(jobId);
    expect(job.isHired).to.be.true;
    expect(job.freelancer).to.equal(freelancer.address);
    expect(job.budget).to.equal(budget);

    // 3. Employer raises dispute
    const reason = "Delayed submission";
    await escrow.connect(employer).raiseDispute(jobId, reason);

    job = await escrow.jobs(jobId);
    expect(job.disputeInitiator).to.equal(employer.address);
    expect(job.disputeReason).to.equal(reason);
    expect(job.isDisputed).to.be.false; // Should be pending, not active yet!

    // Verify freelancer cannot raise another dispute while one is pending
    await expect(
      escrow.connect(freelancer).raiseDispute(jobId, "Another reason")
    ).to.be.revertedWith("Dispute already initiated");

    // Verify freelancer approves the dispute
    await expect(
      escrow.connect(employer).approveDispute(jobId, "Some response")
    ).to.be.revertedWith("Only freelancer can approve employer's dispute");

    // Freelancer approves
    const tx = await escrow.connect(freelancer).approveDispute(jobId, "Delayed explanation reason");
    await tx.wait();

    job = await escrow.jobs(jobId);
    expect(job.isDisputed).to.be.true; // Now the dispute is active!

    // Verify DAO proposal was created automatically
    const proposalCount = await dao.proposalCounter();
    expect(proposalCount).to.equal(1);

    const proposal = await dao.proposals(1);
    expect(proposal.jobId).to.equal(jobId);
    expect(proposal.decision).to.be.false; // decision is false because employer initiated (refund employer)
    expect(proposal.executed).to.be.false;

    // 4. Voting Restrictions
    // Employer should not be allowed to vote
    await expect(
      dao.connect(employer).vote(1, true)
    ).to.be.revertedWith("Employer of the job cannot vote");

    // Freelancer should not be allowed to vote
    await expect(
      dao.connect(freelancer).vote(1, true)
    ).to.be.revertedWith("Freelancer of the job cannot vote");

    // 5. Voter votes
    await dao.connect(voter).vote(1, true); // Voter votes Yes (Yes supporting the decision, which is to refund employer)
    
    // Fast forward voting duration (1 hour)
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    // 6. Execute proposal
    const initialEmployerBalance = await ethers.provider.getBalance(employer.address);
    await dao.connect(voter).executeProposal(1);

    const finalEmployerBalance = await ethers.provider.getBalance(employer.address);
    // Since voteYes (1) > voteNo (0), proposal passes. decision is false (refund employer).
    // Employer should get refunded 1.0 ETH
    expect(finalEmployerBalance - initialEmployerBalance).to.be.closeTo(budget, ethers.parseEther("0.01"));

    job = await escrow.jobs(jobId);
    expect(job.isDisputed).to.be.false;
    expect(job.budget).to.equal(0);
  });

  it("Should execute the full mutual-consent dispute flow (Freelancer initiates, Employer approves)", async function () {
    // 1. Post a job
    await escrow.connect(employer).postJob();
    const jobId = 1;

    // 2. Hire Freelancer
    const budget = ethers.parseEther("2.0");
    await escrow.connect(employer).hireFreelancer(jobId, freelancer.address, { value: budget });

    // 3. Freelancer raises dispute
    const reason = "Employer demands out of scope features";
    await escrow.connect(freelancer).raiseDispute(jobId, reason);

    let job = await escrow.jobs(jobId);
    expect(job.disputeInitiator).to.equal(freelancer.address);
    expect(job.disputeReason).to.equal(reason);
    expect(job.isDisputed).to.be.false;

    // Verify freelancer cannot approve their own dispute
    await expect(
      escrow.connect(freelancer).approveDispute(jobId, "Some response")
    ).to.be.revertedWith("Only employer can approve freelancer's dispute");

    // Employer approves
    await escrow.connect(employer).approveDispute(jobId, "No explanation response");

    job = await escrow.jobs(jobId);
    expect(job.isDisputed).to.be.true;

    // Verify DAO proposal was created automatically
    const proposalCount = await dao.proposalCounter();
    expect(proposalCount).to.equal(1);

    const proposal = await dao.proposals(1);
    expect(proposal.jobId).to.equal(jobId);
    expect(proposal.decision).to.be.true; // decision is true because freelancer initiated (pay freelancer)

    // 4. Voter votes Yes (Yes supporting the decision, which is to pay freelancer)
    await dao.connect(voter).vote(1, true);

    // Fast forward voting duration (1 hour)
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    // 5. Execute proposal
    const initialFreelancerBalance = await ethers.provider.getBalance(freelancer.address);
    await dao.connect(voter).executeProposal(1);

    const finalFreelancerBalance = await ethers.provider.getBalance(freelancer.address);
    // Since voteYes (1) > voteNo (0), proposal passes. decision is true (pay freelancer).
    // Freelancer should get paid 2.0 ETH
    expect(finalFreelancerBalance - initialFreelancerBalance).to.be.closeTo(budget, ethers.parseEther("0.01"));

    job = await escrow.jobs(jobId);
    expect(job.isDisputed).to.be.false;
    expect(job.budget).to.equal(0);
  });
});
