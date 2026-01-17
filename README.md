# 🌌 Nebula: Decentralized Evidence Management

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.0-363636)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-success)

**Nebula** is a secure, decentralized application (DApp) designed to notarize and store digital evidence on the Ethereum blockchain. It provides immutable proof of existence and timestamping for files, ensuring that critical data cannot be tampered with.

🚀 **Live Demo:** [Click here to view the DApp](https://nebula-evidence-dapp-23i8-r0q84t4vo.vercel.app)

---

## ✨ Key Features

- **🛡️ Immutable Notarization:** Securely hash and store file metadata on the blockchain.
- **⛓️ Blockchain Powered:** Built on Ethereum (Sepolia Testnet) for transparency and security.
- **💼 Wallet Integration:** Seamless login and transaction signing via MetaMask.
- **📊 Live Dashboard:** Real-time analytics and data visualization using Recharts.
- **⚡ Modern UI:** Fast, responsive interface built with Next.js and Tailwind CSS.

---

## 🛠️ Tech Stack

**Frontend:**
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Blockchain Interaction:** Ethers.js v6
- **Charts:** Recharts

**Blockchain:**
- **Smart Contracts:** Solidity
- **Development Environment:** Hardhat
- **Network:** Sepolia Testnet

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18 or higher)
- MetaMask Wallet Extension

### 1. Clone the Repository
```bash
git clone [https://github.com/Aditya-linux/Nebula-evidence-dapp.git](https://github.com/Aditya-linux/Nebula-evidence-dapp.git)
cd Nebula-evidence-dapp
```

### 2. Install Dependencies
This project is divided into the frontend and the smart contract backend.

**Install Frontend Dependencies:**
```bash
cd frontend
npm install
```

**Install Hardhat Dependencies (Root folder):**
```bash
cd ..
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory if you plan to deploy smart contracts locally:

```env
SEPOLIA_URL=your_alchemy_or_infura_url
PRIVATE_KEY=your_metamask_private_key
```

### 4. Run the Application
Start the Next.js development server:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 📜 Smart Contract

The main contract handles the logic for storing evidence hashes.

- **Network:** Sepolia Testnet
- **Contract Address:** `0x39F7FAd97c0cDEAfa0b354dFe7305d8f6CDDf71a`
- **Verified on Etherscan:** [View Contract](https://sepolia.etherscan.io/address/0x39F7FAd97c0cDEAfa0b354dFe7305d8f6CDDf71a)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).