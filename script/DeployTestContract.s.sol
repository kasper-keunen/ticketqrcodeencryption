// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "../contracts/ConditionalTicketBurnV2.sol";

/**
forge script script/DeployTestContract.s.sol:DeployTestContract --sig "runDeployContract()" --rpc-url base_sepolia --chain-id 84532 --broadcast  --verify --slow --delay 15 --etherscan-api-key 7MGFD34AITGUD7GWJRNACV37SVJYKFFRPT
 */

contract DeployTestContract is Test {
    ConditionalTicketBurnV2 public cts;

    address public owner = address(0x87071D30C42fae32Cccb7396C5f10FE458612471);

    function runDeployContract() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY_DEPLOYER");
        vm.startBroadcast(privateKey);
        console.log("Deploying test contract");

        cts = new ConditionalTicketBurnV2(owner, 1000, address(0), "ConditionalTicketBurnV2", "CTSB");
        console.log("Deployed test contract", address(cts));

        vm.stopBroadcast();
    }
}
