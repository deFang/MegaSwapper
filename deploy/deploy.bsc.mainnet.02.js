require('@nomiclabs/hardhat-ethers')
const hre = require('hardhat')
const BigNumber = require("bignumber.js");

const decimalStr = (value) => {
  return new BigNumber(value).multipliedBy(10 ** 18).toFixed(0, BigNumber.ROUND_DOWN)
}

function one(value=1, left=0, right=18) {
    let from = ethers.BigNumber.from('1' + '0'.repeat(left))
    let to = ethers.BigNumber.from('1' + '0'.repeat(right))
    return ethers.BigNumber.from(value).mul(to).div(from)
}

const MAX = ethers.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEADLINE = parseInt(Date.now() / 1000) + 86400

let network
let deployer

async function logTransaction(title, transaction) {
    let receipt = await transaction.wait()
    if (receipt.contractAddress != null) {
        title = `${title}: ${receipt.contractAddress}`
    }
    let gasEthers = transaction.gasPrice.mul(receipt.gasUsed)
    console.log('='.repeat(80))
    console.log(title)
    console.log('='.repeat(80))
    console.log(receipt)
    console.log(`Gas: ${ethers.utils.formatUnits(transaction.gasPrice, 'gwei')} GWei / ${receipt.gasUsed} / ${ethers.utils.formatEther(gasEthers)}`)
    console.log('')
    await new Promise(resolve => setTimeout(resolve, 2000))
}

async function getNetwork() {
    network = await ethers.provider.getNetwork()
    if (network.chainId === 97)
        network.name = 'bsctestnet'
    else if (network.chainId === 256)
        network.name = 'hecotestnet'
    deployer = (await ethers.getSigners())[0]

    console.log('='.repeat(80))
    console.log('Network and Deployer')
    console.log('='.repeat(80))
    console.log('Network:', network.name, network.chainId)
    console.log('Deployer:', deployer.address)
    console.log('Deployer Balance:', ethers.utils.formatEther(await deployer.getBalance()))
    console.log('')
}



async function deployMegaSwapper() {
    MegaSwapper = await (await ethers.getContractFactory('MegaSwapper')).deploy()
    await logTransaction('MegaSwapper', MegaSwapper.deployTransaction)
    await new Promise(resolve => setTimeout(resolve, 30000))
    await hre.run('verify:verify', {
        address: MegaSwapper.address,
        constructorArguments: []
    })

    VaultRelayer = await (await ethers.getContractFactory('VaultRelayer')).deploy(MegaSwapper.address)
    await logTransaction('VaultRelayer', VaultRelayer.deployTransaction)
    await new Promise(resolve => setTimeout(resolve, 30000))
    await hre.run('verify:verify', {
        address: VaultRelayer.address,
        constructorArguments: [MegaSwapper.address]
    })

    tx = await MegaSwapper.setVault(VaultRelayer.address)
    await logTransaction('setVault', tx)

}



async function main() {
    await getNetwork()
    await deployMegaSwapper()

}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});


