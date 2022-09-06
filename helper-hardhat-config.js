/* 
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
*/

const { ethers } = require("hardhat")

/**
 * @notice entrance fee may change accordingly to the network
 * some are more expensive then others
 */

const networkConfig = {
    5: {
        name: "goerli",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        entranceFee: ethers.utils.parseEther("0.1"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId: "1069",
        callbackGasLimit: "50000",
        interval: "30", // 30 seconds
    },
    // 31337: {
    //     name: "hardhat",
    //     entranceFee: ethers.utils.parseEther("0.01"),
    //     gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    //     callbackGasLimit: "50000",
    //     interval: "30", // 30 seconds
    // },
    31337: {
        name: "localhost",
        // subscriptionId: "588",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30",
        entranceFee: ethers.utils.parseEther("2"),
        callbackGasLimit: "500000", // 500,000 gas
        interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
