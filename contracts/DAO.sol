// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IJobEscrow {
    function resolveDispute(uint256 _jobId, bool decision) external;
    function jobs(uint256 _jobId) external view returns (
        uint256 id,
        address employer,
        address payable freelancer,
        uint256 budget,
        bool isHired,
        bool isCompleted,
        bool isDisputed,
        address disputeInitiator,
        string memory disputeReason
    );
}

contract DeWorkDAO {
    struct Proposal {
        uint256 id;
        uint256 jobId;
        bool decision; // true = pay freelancer, false = refund employer
        string description;
        uint256 voteYes;
        uint256 voteNo;
        uint256 endTime;
        bool executed;
    }

    address public escrowContract;
    uint256 public proposalCounter;
    
    // proposalId => Proposal
    mapping(uint256 => Proposal) public proposals;
    
    // proposalId => voterAddress => voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public constant VOTING_DURATION = 1 hours; // Shorter duration for local demo & verification

    event ProposalCreated(uint256 proposalId, uint256 jobId, bool decision, string description);
    event Voted(uint256 proposalId, address voter, bool support);
    event ProposalExecuted(uint256 proposalId);

    constructor() {}

    function setEscrowContract(address _escrowContract) public {
        escrowContract = _escrowContract;
    }

    // ⚡ Auto-create proposal (Can only be called by the Escrow contract upon mutual dispute approval)
    function autoCreateProposal(uint256 _jobId, bool _decision, string memory _description) public {
        require(msg.sender == escrowContract, "Only Escrow contract can auto-create proposals");
        
        proposalCounter++;
        
        Proposal storage p = proposals[proposalCounter];
        p.id = proposalCounter;
        p.jobId = _jobId;
        p.decision = _decision;
        p.description = _description;
        p.endTime = block.timestamp + VOTING_DURATION;
        p.executed = false;

        emit ProposalCreated(proposalCounter, _jobId, _decision, _description);
    }

    function vote(uint256 _proposalId, bool _support) public {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp < p.endTime, "Voting period ended");
        require(!hasVoted[_proposalId][msg.sender], "Voter has already voted");
        require(escrowContract != address(0), "Escrow contract not set");

        // Fetch employer and freelancer of the disputed job to enforce conflict of interest rules
        (, address employer, address freelancer, , , , , , ) = IJobEscrow(escrowContract).jobs(p.jobId);
        
        require(msg.sender != employer, "Employer of the job cannot vote");
        require(msg.sender != freelancer, "Freelancer of the job cannot vote");

        hasVoted[_proposalId][msg.sender] = true;
        if (_support) {
            p.voteYes++;
        } else {
            p.voteNo++;
        }

        emit Voted(_proposalId, msg.sender, _support);
    }

    function executeProposal(uint256 _proposalId) public {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp >= p.endTime, "Voting is still active");
        require(!p.executed, "Proposal already executed");
        require(escrowContract != address(0), "Escrow contract not set");

        p.executed = true;

        if (p.voteYes > p.voteNo) {
            IJobEscrow(escrowContract).resolveDispute(p.jobId, p.decision);
        } else {
            // If the proposal vote was rejected, resolve opposite
            IJobEscrow(escrowContract).resolveDispute(p.jobId, !p.decision);
        }

        emit ProposalExecuted(_proposalId);
    }
}
