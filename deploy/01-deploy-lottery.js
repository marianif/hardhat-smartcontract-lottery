// scripts that allows us to deploy our contract
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("0.5")

module.exports = async function () {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const entranceFee = networkConfig[chainId]["entranceFee"].toString()
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    let vrfCoordinatorV2, subscriptionId, vrfCoordinatorAddress

    log("----------------- START DEPLOY LOTTERY --------------------")
    if (developmentChains.includes(network.name)) {
        const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress = VRFCoordinatorV2Mock.address

        // on a local enviroment creating subscription is a bit more complex:
        const txResponse = await VRFCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
        // inside txReceipt is emitted and event with our subscriptionId
        subscriptionId = txReceipt.events[0].args.subId.toString()

        // Now fund the subscription
        // on a real newtwork you need the LINK token
        await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2 = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const args = [
        vrfCoordinatorAddress,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    const lottery = await deploy("Lottery", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("Contract deployed!")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying contract...")
        await verify(lottery.address, args)
        log("Contract verified!")
    }

    log("----------------- END DEPLOY LOTTERY --------------------")
}

module.exports.tags = ["all", "raffle"]
