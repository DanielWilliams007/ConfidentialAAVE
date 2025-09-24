// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {ConfidentialFungibleToken} from "new-confidential-contracts/token/ConfidentialFungibleToken.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";

contract ConfidentialETH is ConfidentialFungibleToken, SepoliaConfig {
    constructor() ConfidentialFungibleToken("cETH", "cETH", "") {}

    /// @notice Mint a fixed amount of cETH to the caller
    /// @dev Anyone can call. Amount is encrypted on-chain using trivial encryption.
    /// @return minted The encrypted amount minted
    function faucet() external returns (euint64 minted) {
        // 1 token with 6 decimals
        euint64 amount = FHE.asEuint64(1_000_000);
        minted = _mint(msg.sender, amount);
    }
}
