require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/FynGuXjaH8X50T3IOC4Ux",
      accounts: ["c29cbb547e6a304a63a68892979aaa94846aa38811a9e0215ee22d08c0c86ef8"]
    }
  },
  etherscan: {
    apiKey: "B6ZF5K7TNIG315NURAU66YFYXID5MVC89C"
  },
};