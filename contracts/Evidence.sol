// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Evidence is Ownable {

    // Enum to define the different types of evidence.
    enum EvidenceType { DigitalFile, PhysicalItem, Cloud }

    // Struct for the main evidence record.
    struct EvidenceRecord {
        uint id;
        string fileHash;
        uint timestamp;
        address uploader;
        address owner;
        string metadata;
        EvidenceType recordType;
    }
    
    // --- NEW: Struct to store the details of a single transfer event. ---
    struct TransferLog {
        address from;
        address to;
        uint timestamp;
    }

    uint private recordCounter;
    
    // Using a mapping is more gas-efficient for direct lookups by ID than an array.
    mapping(uint => EvidenceRecord) public evidenceRecords;
    
    // --- NEW: Mapping from an evidence ID to its array of transfer logs. ---
    mapping(uint => TransferLog[]) public transferHistory;

    // --- EVENTS ---
    event EvidenceAdded(uint id, string fileHash, uint timestamp, address uploader, EvidenceType recordType);
    
    // --- NEW: Upgraded event to include a timestamp for better off-chain tracking. ---
    event EvidenceTransferred(uint indexed id, address indexed from, address indexed to, uint timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Adds a new evidence record.
     */
    function addEvidence(string memory _fileHash, string memory _metadata, EvidenceType _recordType) public onlyOwner {
        uint newId = recordCounter;
        
        evidenceRecords[newId] = EvidenceRecord({
            id: newId,
            fileHash: _fileHash,
            timestamp: block.timestamp,
            uploader: msg.sender,
            owner: msg.sender,
            metadata: _metadata,
            recordType: _recordType
        });
        
        // --- NEW: Create the initial "mint" record in the transfer history. ---
        transferHistory[newId].push(TransferLog({
            from: address(0), // The "zero address" signifies creation/minting.
            to: msg.sender,
            timestamp: block.timestamp
        }));

        emit EvidenceAdded(newId, _fileHash, block.timestamp, msg.sender, _recordType);
        recordCounter++;
    }

    /**
     * @dev Transfers ownership and records the event in the history log.
     */
    function transferEvidence(uint _recordId, address _newOwner) public {
        require(_recordId < recordCounter, "Evidence record does not exist.");
        EvidenceRecord storage record = evidenceRecords[_recordId];
        require(record.owner == msg.sender, "Only the current owner can transfer this evidence.");
        
        address oldOwner = record.owner;
        record.owner = _newOwner;
        
        // --- NEW: Record this transfer in the history log. ---
        transferHistory[_recordId].push(TransferLog({
            from: oldOwner,
            to: _newOwner,
            timestamp: block.timestamp
        }));

        emit EvidenceTransferred(_recordId, oldOwner, _newOwner, block.timestamp);
    }

    /**
     * @notice Retrieves the total number of evidence records.
     * @return The current value of the record counter.
     */
    function getRecordCount() public view returns (uint) {
        return recordCounter;
    }
    
    /**
     * @notice --- NEW: Retrieves the full transfer history for a given evidence ID. ---
     * @param _id The ID of the evidence record.
     * @return An array of TransferLog structs.
     */
    function getTransferHistory(uint _id) external view returns (TransferLog[] memory) {
        return transferHistory[_id];
    }
}
