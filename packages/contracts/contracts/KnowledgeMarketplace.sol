// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KnowledgeMarketplace
 * @dev Smart contract for tracking micropayment revenue in the A2A Knowledge Marketplace
 * @notice Only the authorized server can record payments, ensuring data integrity
 */
contract KnowledgeMarketplace is Ownable, ReentrancyGuard {
    // ============ State Variables ============
    
    /// @notice Address authorized to record payments (API server)
    address public server;
    
    /// @notice Total revenue accumulated per creator address
    mapping(address => uint256) public creatorRevenue;
    
    /// @notice Total revenue accumulated per API key
    mapping(bytes32 => uint256) public apiKeyRevenue;
    
    /// @notice Total number of requests processed
    uint256 public totalRequests;
    
    /// @notice Total revenue across all creators
    uint256 public totalRevenue;
    
    // ============ Events ============
    
    /// @notice Emitted when a payment is recorded
    event PaymentReceived(
        address indexed creator,
        bytes32 indexed apiKey,
        uint256 amount,
        string endpoint,
        uint256 timestamp
    );
    
    /// @notice Emitted when a creator withdraws their revenue
    event RevenueWithdrawn(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );
    
    /// @notice Emitted when the authorized server address is updated
    event ServerUpdated(
        address indexed oldServer,
        address indexed newServer,
        uint256 timestamp
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when a non-server address tries to record a payment
    error OnlyServerCanCall();
    
    /// @notice Thrown when there's no revenue to withdraw
    error NoRevenueToWithdraw();
    
    /// @notice Thrown when the withdrawal transfer fails
    error WithdrawalFailed();
    
    /// @notice Thrown when trying to set server to zero address
    error InvalidServerAddress();
    
    // ============ Modifiers ============
    
    /// @notice Restricts function access to the authorized server only
    modifier onlyServer() {
        if (msg.sender != server) {
            revert OnlyServerCanCall();
        }
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @dev Initializes the contract with an owner and authorized server
     * @param _server Address of the API server authorized to record payments
     */
    constructor(address _server) Ownable(msg.sender) {
        if (_server == address(0)) {
            revert InvalidServerAddress();
        }
        server = _server;
        emit ServerUpdated(address(0), _server, block.timestamp);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Updates the authorized server address
     * @dev Only callable by the contract owner
     * @param _newServer New server address
     */
    function setServer(address _newServer) external onlyOwner {
        if (_newServer == address(0)) {
            revert InvalidServerAddress();
        }
        address oldServer = server;
        server = _newServer;
        emit ServerUpdated(oldServer, _newServer, block.timestamp);
    }
    
    /**
     * @notice Records a micropayment for an API request
     * @dev Only callable by the authorized server
     * @param creator Address of the content creator
     * @param apiKey Hashed API key identifier
     * @param amount Payment amount in smallest unit (e.g., wei for USDC)
     * @param endpoint API endpoint that was accessed
     */
    function recordPayment(
        address creator,
        bytes32 apiKey,
        uint256 amount,
        string calldata endpoint
    ) external onlyServer {
        creatorRevenue[creator] += amount;
        apiKeyRevenue[apiKey] += amount;
        totalRevenue += amount;
        totalRequests += 1;
        
        emit PaymentReceived(creator, apiKey, amount, endpoint, block.timestamp);
    }
    
    /**
     * @notice Allows a creator to withdraw their accumulated revenue
     * @dev Uses reentrancy guard for safety
     */
    function withdrawRevenue() external nonReentrant {
        uint256 amount = creatorRevenue[msg.sender];
        
        if (amount == 0) {
            revert NoRevenueToWithdraw();
        }
        
        creatorRevenue[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert WithdrawalFailed();
        }
        
        emit RevenueWithdrawn(msg.sender, amount, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Gets the total revenue for a creator
     * @param creator Creator's address
     * @return Revenue amount
     */
    function getCreatorRevenue(address creator) external view returns (uint256) {
        return creatorRevenue[creator];
    }
    
    /**
     * @notice Gets the total revenue for an API key
     * @param apiKey Hashed API key
     * @return Revenue amount
     */
    function getApiKeyRevenue(bytes32 apiKey) external view returns (uint256) {
        return apiKeyRevenue[apiKey];
    }
    
    /**
     * @notice Gets marketplace statistics
     * @return _totalRequests Total number of requests
     * @return _totalRevenue Total revenue accumulated
     */
    function getStats() external view returns (uint256 _totalRequests, uint256 _totalRevenue) {
        return (totalRequests, totalRevenue);
    }
    
    // ============ Receive Function ============
    
    /// @notice Allows contract to receive ETH (for revenue distribution)
    receive() external payable {}
}
