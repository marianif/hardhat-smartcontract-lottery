/**
 * @notice this script allows to automatically update constants folder in our frontend
 * @dev this will update frontend only if a .env variable is specified
 */

const fs = require("fs")
const { ethers, network } = require("hardhat")

const FRONT_END_ADDRESSES_FILE = "../nextjs-smartcontract-lottery/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-lottery/constants/abi.json"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updatint front end")
        await updateContractAddresses()
        await updateContractAbi()
    }
}

const updateContractAddresses = async () => {
    const lottery = await ethers.getContract("Lottery")
    const frontendAddresses = fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8")
    const currentAddresses = JSON.parse(frontendAddresses)
    // const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))
    const chainId = network.config.chainId.toString()

    // console.log({
    //     // lottery,
    //     _currentAddresses: typeof _currentAddresses,
    //     typeof_currentAddresses: typeof currentAddresses,
    //     currentAddresses,
    //     // chainId,
    // })

    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(lottery.address)) {
            currentAddresses[chainId].push(lottery.address)
        }
    } else {
        // if we are developing on a new chain that's not listed
        currentAddresses[chainId] = [lottery.address]
    }
    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

const updateContractAbi = async () => {
    const lottery = await ethers.getContract("Lottery")
    const abi = lottery.interface.format(ethers.utils.FormatTypes.json)

    fs.writeFileSync(FRONT_END_ABI_FILE, abi)
}
