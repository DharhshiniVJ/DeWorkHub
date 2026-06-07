// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

interface IDeWorkDAO {
    function autoCreateProposal(uint256 _jobId, bool _decision, string memory _description) external;
}

contract JobEscrow {
    struct Job {
        uint256 id;
        address employer;
        address payable freelancer;
        uint256 budget;
        bool isHired;
        bool isCompleted;
        bool isDisputed;
        address disputeInitiator;
        string disputeReason;
    }

    mapping(uint256 => Job) public jobs;
    uint256 public jobCounter;
    address public reputationNFT;
    address public daoContract; // DAO contract address

    event JobPosted(uint256 jobId, address employer);
    event FreelancerHired(uint256 jobId, address freelancer, uint256 budget);
    event JobCompleted(uint256 jobId, uint256 rating);
    event PaymentReleased(uint256 jobId, address freelancer, uint256 amount);
    event DisputeInitiated(uint256 jobId, address initiator, string reason);
    event DisputeRaised(uint256 jobId);
    event DisputeResolved(uint256 jobId, bool decision); // true = pay freelancer, false = refund employer

    constructor(address _reputationNFT, address _daoContract) {
        reputationNFT = _reputationNFT;
        daoContract = _daoContract;
    }

    // 🏢 Post a job (No funds locked yet)
    function postJob() public {
        jobCounter++;
        jobs[jobCounter] = Job(jobCounter, msg.sender, payable(address(0)), 0, false, false, false, address(0), "");
        emit JobPosted(jobCounter, msg.sender);
    }

    // 💰 Hire a freelancer (Locks funds at the time of hiring)
    function hireFreelancer(uint256 _jobId, address payable _freelancer) public payable {
        Job storage job = jobs[_jobId];
        require(job.id != 0, "Invalid job ID");
        require(job.employer == msg.sender, "Only employer can hire");
        require(!job.isHired, "Freelancer already hired");
        require(msg.value > 0, "Must lock payment for freelancer");

        job.freelancer = _freelancer;
        job.budget = msg.value;
        job.isHired = true;

        emit FreelancerHired(_jobId, _freelancer, msg.value);
    }

    // ✅ Mark job as completed & release payment
    function completeJob(uint256 _jobId, uint256 _rating, string memory _metadataURI) public {
        Job storage job = jobs[_jobId];
        require(job.id != 0, "Invalid job ID");
        require(msg.sender == job.employer, "Only employer can verify completion");
        require(job.isHired, "Freelancer not hired");
        require(!job.isCompleted, "Job already completed");
        require(!job.isDisputed, "Dispute raised, cannot complete");
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");

        job.isCompleted = true;

        // 🎖 Issue Reputation NFT (exactly one Certificate of Work Completion)
        ReputationNFT reputation = ReputationNFT(reputationNFT);
        reputation.issueReputationNFT(job.freelancer, _metadataURI);

        // 💸 Release payment ONLY if NFT minting is successful
        uint256 payment = job.budget;
        job.budget = 0; // Prevent re-entrancy
        require(job.freelancer.send(payment), "Payment transfer failed");

        emit JobCompleted(_jobId, _rating);
        emit PaymentReleased(_jobId, job.freelancer, payment);
    }

    // 🚨 Raise a dispute (Can be called by either employer or freelancer)
    function raiseDispute(uint256 _jobId, string memory _reason) public {
        Job storage job = jobs[_jobId];
        require(job.id != 0, "Invalid job ID");
        require(job.isHired, "Freelancer not hired");
        require(!job.isCompleted, "Cannot dispute after completion");
        require(!job.isDisputed, "Dispute already active");
        require(job.disputeInitiator == address(0), "Dispute already initiated");
        require(msg.sender == job.employer || msg.sender == job.freelancer, "Only employer or freelancer can raise a dispute");
        require(bytes(_reason).length > 0, "Reason cannot be empty");

        job.disputeInitiator = msg.sender;
        job.disputeReason = _reason;
        
        emit DisputeInitiated(_jobId, msg.sender, _reason);
    }

    // 🤝 Approve a dispute to submit to the DAO
    function approveDispute(uint256 _jobId, string memory _approvalReason) public {
        Job storage job = jobs[_jobId];
        require(job.id != 0, "Invalid job ID");
        require(job.disputeInitiator != address(0), "No dispute initiated");
        require(!job.isDisputed, "Dispute already active");

        if (job.disputeInitiator == job.employer) {
            require(msg.sender == job.freelancer, "Only freelancer can approve employer's dispute");
        } else {
            require(msg.sender == job.employer, "Only employer can approve freelancer's dispute");
        }

        job.isDisputed = true;

        // Auto-create proposal in the DAO contract
        // false = refund employer (if employer initiated), true = pay freelancer (if freelancer initiated)
        bool decision = (job.disputeInitiator == job.freelancer);
        string memory desc = string(abi.encodePacked(
            "Dispute for Job ID: #", 
            uintToString(_jobId), 
            ". Initiator: ", 
            job.disputeInitiator == job.employer ? "Employer" : "Freelancer", 
            ". Reason: ", 
            job.disputeReason,
            " | Response: ",
            bytes(_approvalReason).length > 0 ? _approvalReason : "No response provided"
        ));

        IDeWorkDAO(daoContract).autoCreateProposal(_jobId, decision, desc);

        emit DisputeRaised(_jobId);
    }

    // 🏛 DAO resolves dispute
    function resolveDispute(uint256 _jobId, bool decision) public {
        require(msg.sender == daoContract, "Only DAO can resolve disputes");

        Job storage job = jobs[_jobId];
        require(job.id != 0, "Invalid job ID");
        require(job.isDisputed, "No dispute raised for this job");

        if (decision) {
            // DAO voted to release payment
            uint256 payment = job.budget;
            job.budget = 0;
            require(job.freelancer.send(payment), "Payment transfer failed");
            emit PaymentReleased(_jobId, job.freelancer, payment);
        } else {
            // DAO voted to refund employer
            uint256 refundAmount = job.budget;
            job.budget = 0;
            payable(job.employer).transfer(refundAmount);
        }

        job.isDisputed = false;
        job.disputeInitiator = address(0);
        job.disputeReason = "";
        emit DisputeResolved(_jobId, decision);
    }

    // Helper to convert uint to string for proposal description
    function uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) {
            return "0";
        }
        uint256 temp = v;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (v != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(v % 10)));
            v /= 10;
        }
        return string(buffer);
    }
}

contract ReputationNFT is ERC721URIStorage {
    uint256 public tokenIdCounter;

    event ReputationIssued(address freelancer, uint256 tokenId);

    constructor() ERC721("FreelancerReputation", "FRP") {}

    function issueReputationNFT(address _freelancer, string memory _metadataURI) public {
        tokenIdCounter++;
        _mint(_freelancer, tokenIdCounter);
        _setTokenURI(tokenIdCounter, _metadataURI);

        emit ReputationIssued(_freelancer, tokenIdCounter);
    }
}
