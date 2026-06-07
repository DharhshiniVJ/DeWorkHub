import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with deployer:", deployer.address);

    // Deploy ReputationNFT contract
    const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
    const reputationNFT = await ReputationNFT.deploy();
    await reputationNFT.waitForDeployment();
    const reputationNFTAddress = await reputationNFT.getAddress();
    console.log("ReputationNFT deployed at:", reputationNFTAddress);

    // Deploy DeWorkDAO contract
    const DeWorkDAO = await ethers.getContractFactory("DeWorkDAO");
    const deWorkDAO = await DeWorkDAO.deploy();
    await deWorkDAO.waitForDeployment();
    const deWorkDAOAddress = await deWorkDAO.getAddress();
    console.log("DeWorkDAO deployed at:", deWorkDAOAddress);

    // Deploy JobEscrow contract with ReputationNFT and DeWorkDAO addresses
    const JobEscrow = await ethers.getContractFactory("JobEscrow");
    const jobEscrow = await JobEscrow.deploy(reputationNFTAddress, deWorkDAOAddress);
    await jobEscrow.waitForDeployment();
    const jobEscrowAddress = await jobEscrow.getAddress();
    console.log("JobEscrow deployed at:", jobEscrowAddress);

    // Link JobEscrow back to DeWorkDAO
    const linkTx = await deWorkDAO.setEscrowContract(jobEscrowAddress);
    await linkTx.wait();
    console.log("DeWorkDAO escrow link established.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
