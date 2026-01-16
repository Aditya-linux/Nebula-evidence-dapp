const { expect } = require("chai");
const { ethers } = require("hardhat");

// 'describe' groups tests for our "Evidence" contract
describe("Evidence Contract", function () {
  
  // 'it' describes a specific thing we are testing
  it("Should let a user add a record and verify its contents", async function () {
    // ARRANGE: Set up the environment
    // ===================================

    // Get a test account (a "Signer") to represent our user
    const [owner, user] = await ethers.getSigners();
    
    // Get the contract code (the "Factory") and deploy a new instance
    const EvidenceFactory = await ethers.getContractFactory("Evidence");
    const evidenceContract = await EvidenceFactory.deploy();
    
    // Define the sample data we'll use for the test
    const testHash = "QmXo9bbQ2u3Y4a5b6c7d8e9f0a1b2c3d4e5f6g7h8";
    const testMetadata = "Case #789: Photo of the scene";

    
    // ACT: Perform the action we want to test
    // ========================================

    // Call the `addEvidence` function, simulating the call from our test 'user'.
    // We also check that this action emits the 'EvidenceAdded' event.
    await expect(evidenceContract.connect(user).addEvidence(testHash, testMetadata))
      .to.emit(evidenceContract, "EvidenceAdded");


    // ASSERT: Check if the outcome is correct
    // ========================================

    // Retrieve the first record (at index 0) from the public `evidenceRecords` array
    const storedRecord = await evidenceContract.evidenceRecords(0);

    // Check if the data stored on the blockchain matches the data we sent
    expect(storedRecord.id).to.equal(0);
    expect(storedRecord.fileHash).to.equal(testHash);
    expect(storedRecord.metadata).to.equal(testMetadata);
    expect(storedRecord.uploader).to.equal(user.address); // Make sure the uploader is correct
    
    // Finally, check if the total count of records is now 1
    expect(await evidenceContract.getRecordCount()).to.equal(1);
  });
});