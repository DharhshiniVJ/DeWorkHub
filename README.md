# DeWorkHub: Trustless Freelancing Platform

DeWorkHub is a decentralized, full-stack freelancing platform that secures contracts using on-chain smart escrows and community arbitration. By replacing centralized corporate gatekeepers with immutable blockchain logic, DeWorkHub ensures payouts are fair, immediate, and fully verifiable.

> **Tagline**: *Trust the game, not the player.*

---

## 🛡️ Why DeWorkHub is More Secure Than Web2 Platforms

| Feature | Web2 Freelance Platforms (Upwork, Fiverr) | DeWorkHub (Web3 Platform) |
| :--- | :--- | :--- |
| **Custodian Payouts** | Money is held in centralized bank accounts. Platforms can delay or freeze funds. | Milestone budgets are locked inside audited, open-source smart contract escrows. |
| **Account Ownership** | Accounts can be suspended arbitrarily, causing you to lose your history and earnings. | Your profile is bound to your Web3 wallet. Completed contracts mint non-transferable reputation NFTs you own forever. |
| **Dispute Payouts** | Closed-door corporate teams resolve disputes, often favoring clients to maximize platform revenue. | Transparent, decentralized DAO arbitration where peer community voters vote on-chain. |
| **Service Fees** | High cuts (up to 20%) on all payments. | Low flat service fee (2%) to sustain decentralized governance. |

---

## 🛠️ Prerequisites

Before setting up the project locally, make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.x or later recommended)
* [Git](https://git-scm.com/)
* [MetaMask Browser Extension](https://metamask.io/)
* [MongoDB](https://www.mongodb.com/) (either a local instance or a free MongoDB Atlas cluster)

---

## 🚀 Step-by-Step Desktop Setup Guide

Follow these instructions to run the entire project on your local machine.

### Step 1: Clone the Repository
Clone the project repository to your desktop and navigate to the project root:
```bash
git clone <repository-url>
cd DeWorkHub
```

### Step 2: Install Dependencies
Install all package dependencies for the local Hardhat blockchain environment and the Next.js frontend client:

1. **Install root Hardhat dependencies**:
   ```bash
   npm install
   ```
2. **Install full-stack client dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

### Step 3: Run the Local Blockchain Node
Start a local Hardhat Ethereum node to simulate a local blockchain network. This node will provide you with 20 pre-funded test accounts (each containing 10,000 mock ETH):
```bash
npx hardhat node
```
*Note: Keep this terminal window open. In the printed console, you will see a list of accounts (Account #0 to #19) and their corresponding **Private Keys**. You will need these in the next step.*

### Step 4: Configure MetaMask with the Local Network & Test Accounts

1. Open your browser and click on the **MetaMask extension**.
2. Click the **Network Selector dropdown** in the top-left corner and click **Add network** -> **Add a network manually**.
3. Fill in the following network details:
   * **Network Name**: `Hardhat Localhost`
   * **New RPC URL**: `http://127.0.0.1:8545`
   * **Chain ID**: `31337`
   * **Currency Symbol**: `ETH`
4. Click **Save** and switch to your new `Hardhat Localhost` network.
5. Import test accounts from your Hardhat terminal:
   * Copy the **Private Key** of **Account #0** (use this as the **Employer/Client** account).
   * In MetaMask, click your **Profile icon** -> **Import account**.
   * Paste the Private Key and click **Import**. Rename this account to `Hardhat Employer`.
   * Repeat the import process for **Account #1** (use this as the **Freelancer** account). Rename it to `Hardhat Freelancer`.

### Step 5: Deploy the Smart Contracts
Open a new terminal window in the root directory and run the deployment script to compile and deploy the contracts onto your local Hardhat node:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
Your terminal will print the deployed contract addresses. For example:
```text
Deploying contracts with deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
ReputationNFT deployed at: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
DeWorkDAO deployed at: 0x0165878A594ca255338adfa4d48449f69242Eb8F
JobEscrow deployed at: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
DeWorkDAO escrow link established.
```

### Step 6: Configure Environment Variables
Navigate to the `client` folder and open `.env.local` to bind your newly deployed smart contracts and database connection.

1. Locate the contract variables and update them with the addresses printed in **Step 5**:
   ```env
   NEXT_PUBLIC_JOB_ESCROW_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
   NEXT_PUBLIC_REPUTATION_NFT_ADDRESS=0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
   NEXT_PUBLIC_DAO_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F
   ```
2. Update the `MONGODB_URI` database configuration:
   - If using a local MongoDB instance: `MONGODB_URI=mongodb://localhost:27017/deworkhub`
   - If using MongoDB Atlas, configure your replica set URI.
3. Configure `JWT_SECRET` and auth URLs:
   ```env
   JWT_SECRET=dev_jwt_secret_token_here
   NEXTAUTH_SECRET=dev_nextauth_secret_token_here
   NEXTAUTH_URL=http://localhost:3000
   ```

### Step 7: Run the Application
Start the full-stack Next.js client application:
```bash
cd client
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`** to view the application!

---

## ⚖️ Testing the Core Flow (Client & Freelancer)

To verify the platform's Web3 integration:
1. **Register two profiles**:
   - Register an account as a **Company** and link the `Hardhat Employer` MetaMask wallet address to its profile.
   - Register another account as a **Freelancer** and link the `Hardhat Freelancer` MetaMask wallet address to its profile.
2. **Post a Job**:
   - Log in as the **Company**. Post a new job with a defined milestone budget.
3. **Apply**:
   - Log in as the **Freelancer**. Find the posted job, submit a proposal, and apply.
4. **Hire & Lock Escrow**:
   - Log in as the **Company**. Open the applications for the job, click **Hire with Web3 Escrow**.
   - MetaMask will prompt you to connect your `Hardhat Employer` wallet, specify the escrow amount in ETH, and lock the funds into the smart contract.
5. **Complete Work**:
   - Once completed, the **Company** releases the escrow on-chain. This transfers the ETH to the freelancer's address and automatically mints a non-transferable Reputation NFT to the freelancer's wallet.
