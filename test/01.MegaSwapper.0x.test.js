const hre = require('hardhat')
const qs = require('qs');
const { expect } = require('chai')
const BigNumber = require("bignumber.js");
const axios = require('axios');

const fs = require("fs");
const file = fs.createWriteStream("../deploy-logger.js", { 'flags': 'w'});
let logger = new console.Console(file, file);

const decimalStr = (value) => {
  return new BigNumber(value).multipliedBy(10 ** 18).toFixed(0, BigNumber.ROUND_DOWN)
}

const decimalStrUSDT = (value) => {
  return new BigNumber(value).multipliedBy(10 ** 6).toFixed(0, BigNumber.ROUND_DOWN)
}
// rescale
function one(value=1, left=0, right=18) {
    let from = ethers.BigNumber.from('1' + '0'.repeat(left))
    let to = ethers.BigNumber.from('1' + '0'.repeat(right))
    return ethers.BigNumber.from(value).mul(to).div(from)
}

function neg(value) {
    return value.mul(-1)
}

async function getTxdata(sellToken, buyToken, sellAmount) {

    let queryParams = {
        sellToken: sellToken,
        buyToken: buyToken,
        sellAmount: sellAmount,
    }

    let responseBestRate = await axios.get('https://api.0x.org/swap/v1/quote', {params: queryParams}); // get best rate from paraswap
    let txdata = responseBestRate.data
    return txdata
}




const MAX = ethers.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEADLINE = parseInt(Date.now() / 1000) + 86400

describe('MegaSwapper', function () {
    let chainId
    let deployer
    let alice
    let bob

    let usdc
    let weth
    let dai
    let toke
    let wbtc

    let signer
    let eth_address
    let usdc_address
    let weth_address
    let dai_address
    let toke_address
    let wbtc_address


    before(async function() {
        [deployer, alice, bob] = await ethers.getSigners()
        deployer.name = 'deployer'
        alice.name = 'alice'
        bob.name = 'bob'

        chainId = 1
        eth_address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        usdc_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
        weth_address = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        dai_address = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
        wbtc_address = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
        impersonateAddress = "0xa205fd7344656c72fdc645b72faf5a3de0b3e825"

        // chainId = 56
        // eth_address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        // usdc_address = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
        // weth_address = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" // wbnb
        // dai_address = "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3"
        // wbtc_address = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
        // impersonateAddress = "0xe2fc31f816a9b94326492132018c3aecc4a93ae1"

        usdc = await ethers.getContractAt('IERC20', usdc_address)
        weth = await ethers.getContractAt('IERC20', weth_address)
        dai = await ethers.getContractAt('IERC20', dai_address)
        wbtc = await ethers.getContractAt('IERC20', wbtc_address)

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [impersonateAddress],
        });
        signer = await ethers.getSigner(impersonateAddress)

        await deployer.sendTransaction({to: signer.address, value: "0x8AC7230489E80000"}) // 存入10ETH


    })



    it('swap', async function () {
        megaswapper = await (await ethers.getContractFactory('MegaSwapper')).deploy()
        await usdc.connect(signer).approve(megaswapper.address, MAX)
        console.log('before btc balance', (await wbtc.balanceOf(signer.address))/1e8)
        txdata = await getTxdata(usdc_address, wbtc_address, decimalStrUSDT("1000"))
        // txdata = await getTxdata(usdc_address, 18, wbtc_address, 18, decimalStr("1000"), chainId, megaswapper.address, signer)
        executor_address = txdata.to
        executor_data = txdata.data
        console.log("executor_address", executor_address, "executor_data", executor_data)
        await megaswapper.connect(signer).swap(usdc_address, wbtc_address, decimalStrUSDT("1000"), false, executor_address, executor_data)
        console.log('after btc balance', (await wbtc.balanceOf(signer.address))/1e8)

    })







})
