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

## ⚖️ Detailed Step-by-Step Testing Guide

To thoroughly test the platform's core Web3 features, you will simulate both a **Company (Employer)** and a **Freelancer** interacting. It is recommended to use two different browser sessions (e.g., Google Chrome in normal mode for the Employer and Chrome in Incognito mode for the Freelancer) to run the test flows concurrently.

---

### Flow A: Successful Milestone Payout & Reputation NFT Minting

Follow these steps to post a job, fund the escrow contract, complete the contract, and verify the minted reputation NFT.

#### 1. Setup the Profiles
1. **Employer Profile**:
   - In Browser #1, go to `http://localhost:3000/register`.
   - Create an account with the role **Company**.
   - Navigate to `/profile`. Click **Connect Wallet** and select MetaMask (make sure you are connected to the `Hardhat Employer` account you imported).
   - Save the wallet address on your profile.
2. **Freelancer Profile**:
   - In Browser #2 (Incognito), go to `http://localhost:3000/register`.
   - Create an account with the role **Freelancer**.
   - Navigate to `/profile`. Click **Connect Wallet** and select MetaMask (make sure you are connected to the `Hardhat Freelancer` account).
   - Save the wallet address on your profile.

#### 2. Create and Apply for a Job
1. **Post the Job (Employer)**:
   - On the Employer dashboard (Browser #1), click **Post a Job**.
   - Fill in the details:
     - **Title**: `Frontend UI React Engineer`
     - **Description**: `Overhaul UI using modern design system tokens.`
     - **Budget**: `5` (this represents 5 ETH).
   - Submit the form.
2. **Apply (Freelancer)**:
   - On the Freelancer dashboard (Browser #2), click **Available Jobs**.
   - Find the `Frontend UI React Engineer` job and click **Apply**.
   - Write a cover letter and provide a mock resume link, then click **Submit Application**.

#### 3. Hire & Lock Escrow (Employer)
1. In Browser #1 (Employer), go to the **Hiring** tab.
2. Under the job applications list, locate the application from your freelancer.
3. Click **Hire with Web3 Escrow**.
4. MetaMask will pop up asking to connect your `Hardhat Employer` wallet.
5. In the modal, verify the freelancer's wallet address and the escrow amount (5 ETH).
6. Click **Review & Lock Escrow** -> **Confirm Escrow**.
7. MetaMask will prompt you to confirm a transaction to the `JobEscrow` smart contract. Click **Confirm**.
8. Once the transaction completes, the contract status changes to `in progress` (Ongoing) and the 5 ETH is locked securely in the blockchain escrow.

#### 4. Complete & Release Payout (Employer)
1. Once the freelancer finishes the work, navigate to the **Active Contracts** page on the Employer side (Browser #1).
2. Locate the ongoing contract for `Frontend UI React Engineer`.
3. Click **Complete on Blockchain**.
4. MetaMask will pop up. Choose a rating (e.g., `5` stars) and confirm the release transaction.
5. Once confirmed:
   - The 5 ETH locked in the escrow contract is instantly sent to the freelancer's wallet address.
   - A non-transferable **Reputation NFT** containing the metadata (Job Title, client name, feedback, and 5-star rating) is minted and sent to the freelancer.

#### 5. Verify the Reputation NFT (Freelancer)
1. Switch to Browser #2 (Freelancer).
2. Go to the **Reputation** page.
3. You will see a beautiful **Work Certificate** showing your newly minted NFT with:
   - Gold/Platinum border (for 5-star rating).
   - Client feedback and rating stars.
   - Verified budget and contract ID link.

---

### Flow B: Mutual-Consent Escrow Dispute & DAO Arbitration

Follow these steps to test the dispute resolution protocol where both parties consent to escalate a dispute and community voters settle the payout on-chain.

#### 1. Setup another Contract
1. Repeat **Steps 1-3** in Flow A above to create a second contract and lock funds (e.g., 3 ETH) in escrow.

#### 2. Raise a Dispute (Employer)
1. In Browser #1 (Employer), go to the **Active Contracts** page.
2. Locate the ongoing contract and click **Dispute on Blockchain**.
3. MetaMask will prompt you to connect. Enter a reason (e.g., `Freelancer did not submit source code deliverables`) and confirm the transaction.
4. Once completed, the contract state moves to **Pending Dispute** (or `pending_dispute`). The escrow remains locked, but no proposal is created yet because it requires mutual consent.

#### 3. Approve the Dispute (Freelancer)
1. Switch to Browser #2 (Freelancer). Go to the **Active Contracts** page.
2. Locate the contract. You will see its status is **Dispute Pending Approval**.
3. Click **Manage Dispute on Blockchain**.
4. In the modal, you will see the Employer's dispute reason. 
5. Click **Approve Dispute** and confirm the transaction in MetaMask (using your `Hardhat Freelancer` account).
6. Once the freelancer approves, the contract status changes to **Dispute Active** (`disputed`), and a voting proposal is automatically created in the **DAO Governance** system.

#### 4. Vote on the Dispute (DAO Voters)
1. Switch your MetaMask account to a third pre-funded account (e.g., `Account #2` from your Hardhat list) to act as an independent voter.
2. In your browser, navigate to the **DAO** page (`http://localhost:3000/dao`).
3. You will see the active proposal for the disputed contract, displaying the dispute reason and the response.
4. Click **Pay Freelancer** or **Refund Employer** to submit your vote on-chain.
5. Once the voting duration expires (you can fast-forward time on your local node by running `npx hardhat run scripts/fast-forward.ts --network localhost`), the majority decision is executed, and the smart contract automatically releases the locked 3 ETH to the winner.
