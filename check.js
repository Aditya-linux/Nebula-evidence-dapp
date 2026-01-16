const { Wallet } = require("ethers");

// This is the key you keep getting (The WRONG one)
const key = "c29cbb547e6a304a63a68892979aaa94846aa38811a9e0215ee22d08c0c86ef8";

console.log("--------------------------------------------------");
console.log("🛑 THE KEY IN YOUR CLIPBOARD BELONGS TO:");
console.log(new Wallet(key).address);
console.log("\n✅ THE ADDRESS YOU ACTUALLY WANT IS:");
console.log("0x6B44A5CC62E76b5529Fe17F88DC4d96187A41780");
console.log("--------------------------------------------------");