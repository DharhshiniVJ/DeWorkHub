import { ethers } from 'ethers';

// TypeScript declarations for ethereum window object
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Contract ABI - you'll need to update this with your actual contract ABI
const JOB_ESCROW_ABI = [
  "function postJob() public",
  "function hireFreelancer(uint256 _jobId, address payable _freelancer) public payable",
  "function completeJob(uint256 _jobId, uint256 _rating, string memory _metadataURI) public",
  "function raiseDispute(uint256 _jobId, string memory _reason) public",
  "function approveDispute(uint256 _jobId, string memory _approvalReason) public",
  "function resolveDispute(uint256 _jobId, bool decision) public",
  "function jobs(uint256) public view returns (uint256 id, address employer, address payable freelancer, uint256 budget, bool isHired, bool isCompleted, bool isDisputed, address disputeInitiator, string disputeReason)",
  "function jobCounter() public view returns (uint256)",
  "event JobPosted(uint256 jobId, address employer)",
  "event FreelancerHired(uint256 jobId, address freelancer, uint256 budget)",
  "event JobCompleted(uint256 jobId, uint256 rating)",
  "event PaymentReleased(uint256 jobId, address freelancer, uint256 amount)",
  "event DisputeInitiated(uint256 jobId, address initiator, string reason)",
  "event DisputeRaised(uint256 jobId)",
  "event DisputeResolved(uint256 jobId, bool decision)"
];

const REPUTATION_NFT_ABI = [
  "function issueReputationNFT(address _freelancer, string memory _metadataURI) public",
  "function balanceOf(address owner) public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function tokenIdCounter() public view returns (uint256)"
];

const DAO_ABI = [
  "function autoCreateProposal(uint256 _jobId, bool _decision, string memory _description) public",
  "function vote(uint256 _proposalId, bool _support) public",
  "function executeProposal(uint256 _proposalId) public",
  "function proposals(uint256) public view returns (uint256 id, uint256 jobId, bool decision, string description, uint256 voteYes, uint256 voteNo, uint256 endTime, bool executed)",
  "function proposalCounter() public view returns (uint256)",
  "function hasVoted(uint256, address) public view returns (bool)"
];

// Contract addresses - update these with your deployed contract addresses
const JOB_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_JOB_ESCROW_ADDRESS || '';
const REPUTATION_NFT_ADDRESS = process.env.NEXT_PUBLIC_REPUTATION_NFT_ADDRESS || '';
const DAO_ADDRESS = process.env.NEXT_PUBLIC_DAO_ADDRESS || '';

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private jobEscrowContract: ethers.Contract | null = null;
  private reputationNFTContract: ethers.Contract | null = null;
  private daoContract: ethers.Contract | null = null;

  async connectWallet(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        // Initialize contracts
        this.jobEscrowContract = new ethers.Contract(
          JOB_ESCROW_ADDRESS,
          JOB_ESCROW_ABI,
          this.signer
        );
        
        this.reputationNFTContract = new ethers.Contract(
          REPUTATION_NFT_ADDRESS,
          REPUTATION_NFT_ABI,
          this.signer
        );

        if (DAO_ADDRESS) {
          this.daoContract = new ethers.Contract(
            DAO_ADDRESS,
            DAO_ABI,
            this.signer
          );
        }
        const address = await this.signer.getAddress();
        return address;
      } else {
        throw new Error('MetaMask not found');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.jobEscrowContract = null;
    this.reputationNFTContract = null;
    this.daoContract = null;
  }

  async getWalletAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  async postJob(): Promise<number | null> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const tx = await this.jobEscrowContract.postJob();
      const receipt = await tx.wait();
      
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.jobEscrowContract!.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((parsedLog: any) => parsedLog && parsedLog.name === 'JobPosted');

      if (event) {
        const jobId = event.args[0];
        return Number(jobId);
      }
      
      const counter = await this.jobEscrowContract.jobCounter();
      return Number(counter);
    } catch (error) {
      console.error('Error posting job:', error);
      return null;
    }
  }

  async hireFreelancer(jobId: number, freelancerAddress: string, budget: string): Promise<boolean> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const tx = await this.jobEscrowContract.hireFreelancer(
        jobId,
        freelancerAddress,
        { value: ethers.parseEther(budget) }
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error hiring freelancer:', error);
      return false;
    }
  }

  async completeJob(jobId: number, rating: number, metadataURI: string): Promise<boolean> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const tx = await this.jobEscrowContract.completeJob(jobId, rating, metadataURI);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error completing job:', error);
      return false;
    }
  }

  async getJobDetails(jobId: number): Promise<any> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const job = await this.jobEscrowContract.jobs(jobId);
      return {
        id: job.id.toString(),
        employer: job.employer,
        freelancer: job.freelancer,
        budget: ethers.formatEther(job.budget),
        isHired: job.isHired,
        isCompleted: job.isCompleted,
        isDisputed: job.isDisputed,
        disputeInitiator: job.disputeInitiator,
        disputeReason: job.disputeReason
      };
    } catch (error) {
      console.error('Error getting job details:', error);
      return null;
    }
  }

  async getReputationNFTs(address: string): Promise<any[]> {
    try {
      if (!this.reputationNFTContract) throw new Error('Contract not initialized');
      
      const totalTokens = await this.reputationNFTContract.tokenIdCounter();
      const nfts = [];
      
      for (let i = 1; i <= totalTokens; i++) {
        try {
          const owner = await this.reputationNFTContract.ownerOf(i);
          if (owner.toLowerCase() === address.toLowerCase()) {
            const tokenURI = await this.reputationNFTContract.tokenURI(i);
            nfts.push({ tokenId: i.toString(), tokenURI });
          }
        } catch (e) {
          // Token might not exist or been burned, skip
        }
      }
      
      return nfts;
    } catch (error) {
      console.error('Error getting reputation NFTs:', error);
      return [];
    }
  }

  async getJobCounter(): Promise<number> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const counter = await this.jobEscrowContract.jobCounter();
      return parseInt(counter.toString());
    } catch (error) {
      console.error('Error getting job counter:', error);
      return 0;
    }
  }

  async raiseDispute(jobId: number, reason: string): Promise<boolean> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const tx = await this.jobEscrowContract.raiseDispute(jobId, reason);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error raising dispute:', error);
      return false;
    }
  }

  async approveDispute(jobId: number, approvalReason: string): Promise<boolean> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const tx = await this.jobEscrowContract.approveDispute(jobId, approvalReason);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error approving dispute:', error);
      return false;
    }
  }

  async resolveDispute(jobId: number, decision: boolean): Promise<boolean> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const tx = await this.jobEscrowContract.resolveDispute(jobId, decision);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      return false;
    }
  }

  async getJobStatus(jobId: number): Promise<any> {
    try {
      if (!this.jobEscrowContract) throw new Error('Contract not initialized');
      
      const job = await this.jobEscrowContract.jobs(jobId);
      return {
        id: job.id.toString(),
        employer: job.employer,
        freelancer: job.freelancer,
        budget: ethers.formatEther(job.budget),
        isHired: job.isHired,
        isCompleted: job.isCompleted,
        isDisputed: job.isDisputed,
        disputeInitiator: job.disputeInitiator,
        disputeReason: job.disputeReason
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      return null;
    }
  }

  async createDAOProposal(jobId: number, decision: boolean, description: string): Promise<boolean> {
    try {
      if (!this.daoContract) throw new Error('DAO contract not initialized');
      const tx = await this.daoContract.createProposal(jobId, decision, description);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error creating DAO proposal:', error);
      return false;
    }
  }

  async voteOnDAOProposal(proposalId: number, support: boolean): Promise<boolean> {
    try {
      if (!this.daoContract) throw new Error('DAO contract not initialized');
      const tx = await this.daoContract.vote(proposalId, support);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error voting on DAO proposal:', error);
      return false;
    }
  }

  async executeDAOProposal(proposalId: number): Promise<boolean> {
    try {
      if (!this.daoContract) throw new Error('DAO contract not initialized');
      const tx = await this.daoContract.executeProposal(proposalId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error executing DAO proposal:', error);
      return false;
    }
  }

  async getDAOProposalCount(): Promise<number> {
    try {
      if (!this.daoContract) throw new Error('DAO contract not initialized');
      const count = await this.daoContract.proposalCounter();
      return Number(count);
    } catch (error) {
      console.error('Error getting proposal count:', error);
      return 0;
    }
  }

  async getDAOProposal(proposalId: number): Promise<any> {
    try {
      if (!this.daoContract) throw new Error('DAO contract not initialized');
      const p = await this.daoContract.proposals(proposalId);
      return {
        id: p.id.toString(),
        jobId: p.jobId.toString(),
        decision: p.decision,
        description: p.description,
        voteYes: p.voteYes.toString(),
        voteNo: p.voteNo.toString(),
        endTime: Number(p.endTime),
        executed: p.executed
      };
    } catch (error) {
      console.error('Error getting DAO proposal:', error);
      return null;
    }
  }

  async hasUserVotedOnProposal(proposalId: number, voterAddress: string): Promise<boolean> {
    try {
      if (!this.daoContract) throw new Error('DAO contract not initialized');
      return await this.daoContract.hasVoted(proposalId, voterAddress);
    } catch (error) {
      console.error('Error checking if voter voted:', error);
      return false;
    }
  }

  async getCurrentBlockTimestamp(): Promise<number> {
    try {
      if (!this.provider) {
        return Math.floor(Date.now() / 1000);
      }
      const block = await this.provider.getBlock('latest');
      return block ? block.timestamp : Math.floor(Date.now() / 1000);
    } catch (error) {
      console.error('Error getting block timestamp:', error);
      return Math.floor(Date.now() / 1000);
    }
  }
}

export const web3Service = new Web3Service(); 