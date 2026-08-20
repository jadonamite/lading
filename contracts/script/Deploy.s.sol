// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Lading} from "../src/Lading.sol";

/// @notice Deploys Lading to BOT Chain (chain 677).
/// @dev    The constructor takes nothing and the contract has no owner, so there is no
///         post-deploy configuration step and nothing to get wrong between deploy and use.
///         The chain-id assertion is deliberate: a mainnet requirement plus a single RPC is
///         exactly how a submission ends up verified on the wrong network.
///
///         forge script script/Deploy.s.sol:Deploy \
///           --rpc-url botchain --broadcast --verify --verifier blockscout \
///           --verifier-url https://scan.botchain.ai/api --private-key $DEPLOYER_KEY
contract Deploy is Script {
    uint256 internal constant BOT_CHAIN = 677;
    uint256 internal constant BOT_TESTNET = 968;

    function run() external returns (Lading lading) {
        // 677 is mainnet, 968 the Bohr testnet. Anything else is a misconfigured
        // RPC, and the guard exists because a mainnet requirement plus a single
        // endpoint is exactly how a submission ends up verified on the wrong chain.
        require(
            block.chainid == BOT_CHAIN || block.chainid == BOT_TESTNET,
            "Deploy: wrong chain, expected 677 or 968"
        );

        vm.startBroadcast();
        lading = new Lading();
        vm.stopBroadcast();

        console.log("Lading deployed:", address(lading));
        console.log("chainid:", block.chainid);
        console.log("nextId:", lading.nextId());
        console.log("MAX_FIELDS:", lading.MAX_FIELDS());
    }
}
