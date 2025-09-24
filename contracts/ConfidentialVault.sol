// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {IConfidentialFungibleToken} from "new-confidential-contracts/interfaces/IConfidentialFungibleToken.sol";
import {FHESafeMath} from "new-confidential-contracts/utils/FHESafeMath.sol";

/// @title Confidential Vault (AAVE-like) for cETH
/// @notice Stores users' deposits privately and enables confidential withdraws
contract ConfidentialVault is SepoliaConfig {
    IConfidentialFungibleToken public immutable cETH;

    mapping(address => euint64) private _balances;

    event Deposited(address indexed user, euint64 amount, euint64 newBalance);
    event Withdrawn(address indexed user, euint64 amount, euint64 newBalance);

    constructor(address cEthAddress) {
        cETH = IConfidentialFungibleToken(cEthAddress);
    }

    /// @notice Return the encrypted balance of a user
    function balanceOf(address user) external view returns (euint64) {
        return _balances[user];
    }

    /// @notice Deposit cETH into the vault with encrypted amount
    /// @dev Caller must set this vault as operator on cETH before calling
    function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external returns (euint64 deposited) {
        // Validate external input in the Vault, then use non-proof transfer from cETH
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        // cETH will perform arithmetic with 'amount', grant it access
        FHE.allow(amount, address(cETH));

        // Pull tokens from user to this vault (no proof variant, allowed for caller Vault)
        euint64 transferred = cETH.confidentialTransferFrom(msg.sender, address(this), amount);

        // Update user balance safely
        (ebool success, euint64 updated) = FHESafeMath.tryIncrease(_balances[msg.sender], transferred);
        _balances[msg.sender] = updated;

        // Allow viewing by this contract and the user
        FHE.allowThis(updated);
        FHE.allow(updated, msg.sender);

        // Select actually deposited (either transferred or 0 if failed)
        deposited = FHE.select(success, transferred, FHE.asEuint64(0));
        FHE.allowThis(deposited);
        FHE.allow(deposited, msg.sender);

        emit Deposited(msg.sender, deposited, updated);
    }

    /// @notice Withdraw cETH from the vault with encrypted amount
    function withdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external returns (euint64 withdrawn) {
        euint64 requested = FHE.fromExternal(encryptedAmount, inputProof);

        // Compute new balance safely
        (ebool success, euint64 newBalance) = FHESafeMath.tryDecrease(_balances[msg.sender], requested);

        // Update storage and ACL
        _balances[msg.sender] = newBalance;
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);

        // Withdraw the allowed amount (0 if not enough balance)
        euint64 toSend = FHE.select(success, requested, FHE.asEuint64(0));
        // cETH will perform arithmetic with 'toSend', grant it access
        FHE.allow(toSend, address(cETH));
        withdrawn = cETH.confidentialTransfer(msg.sender, toSend);

        emit Withdrawn(msg.sender, withdrawn, newBalance);
    }
}
