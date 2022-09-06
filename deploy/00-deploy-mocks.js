const { developmentChains } = require("../helper-hardhat-config")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9 // calculatee value based on the gas price of the chain

module.exports = async function () {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args,
            // waitConfirmations: network.config.blockConfirmations || 1,
        })

        log("Mocks deployed!")
        log("----------------- END DEPLOY MOCKS --------------------")
    }
}

module.exports.tags = ["all", "mocks"]
