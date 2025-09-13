// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ConfidentialTestCoin} from "./ConfidentialTestCoin.sol";

contract ConfidentialAAVE is SepoliaConfig {
    ConfidentialTestCoin public immutable token;
    
    mapping(address => euint64) private _balances;
    euint64 private _totalSupply;
    
    struct LastError {
        euint64 error;
        uint256 timestamp;
    }
    
    mapping(address => LastError) private _lastErrors;
    
    euint64 internal NO_ERROR;
    euint64 internal INSUFFICIENT_BALANCE;
    euint64 internal INVALID_AMOUNT;
    
    event Deposited(address indexed user, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 timestamp);
    event ErrorChanged(address indexed user);
    
    constructor(address _tokenAddress) {
        token = ConfidentialTestCoin(_tokenAddress);
        
        NO_ERROR = FHE.asEuint64(0);
        INSUFFICIENT_BALANCE = FHE.asEuint64(1);
        INVALID_AMOUNT = FHE.asEuint64(2);
        
        _totalSupply = FHE.asEuint64(0);
    }
    
    function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        
        ebool isZero = FHE.eq(amount, FHE.asEuint64(0));
        euint64 errorCode = FHE.select(isZero, INVALID_AMOUNT, NO_ERROR);
        _setLastError(errorCode, msg.sender);
        
        euint64 depositAmount = FHE.select(isZero, FHE.asEuint64(0), amount);
        
        _balances[msg.sender] = FHE.add(_balances[msg.sender], depositAmount);
        _totalSupply = FHE.add(_totalSupply, depositAmount);
        
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_totalSupply);
        
        emit Deposited(msg.sender, block.timestamp);
    }
    
    function withdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        
        ebool isZero = FHE.eq(amount, FHE.asEuint64(0));
        ebool hasSufficientBalance = FHE.le(amount, _balances[msg.sender]);
        ebool canWithdraw = FHE.and(FHE.not(isZero), hasSufficientBalance);
        
        euint64 errorCode = FHE.select(
            isZero,
            INVALID_AMOUNT,
            FHE.select(hasSufficientBalance, NO_ERROR, INSUFFICIENT_BALANCE)
        );
        _setLastError(errorCode, msg.sender);
        
        euint64 withdrawAmount = FHE.select(canWithdraw, amount, FHE.asEuint64(0));
        
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], withdrawAmount);
        _totalSupply = FHE.sub(_totalSupply, withdrawAmount);
        
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_totalSupply);
        
        emit Withdrawn(msg.sender, block.timestamp);
    }
    
    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }
    
    function totalSupply() external view returns (euint64) {
        return _totalSupply;
    }
    
    function getLastError(address user) external view returns (euint64, uint256) {
        LastError memory lastError = _lastErrors[user];
        return (lastError.error, lastError.timestamp);
    }
    
    function _setLastError(euint64 error, address user) private {
        _lastErrors[user] = LastError(error, block.timestamp);
        emit ErrorChanged(user);
    }
}