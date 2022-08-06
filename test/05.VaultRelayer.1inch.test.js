const hre = require('hardhat')
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

const fastMove = async (moveBlockNum) => {
    var res
    for (let i = 0; i < moveBlockNum; i++) {
      res = await hre.network.provider.send("evm_mine");
    }
    return res
  }

const apiCaller = async (url) => {
  let temp = await axios
    .get(url)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      if (error.response) {
        console.log(error.response.status);
      }
      console.log("Error", error.message);
    });
  let result = temp.data.tx;

  delete result.gasPrice;
  delete result.gas;
  const hexValue = ethers.BigNumber.from(result["value"])._hex;
  result["value"] = hexValue;
  return result;
}

 const getTxdata = async (chainId, fromToken, toToken, amount, signer) => {
            const swapParams = {
            fromTokenAddress: fromToken,
            toTokenAddress: toToken,
            amount: amount,
            fromAddress: signer.address,
            destReceiver: signer.address,
            slippage: 3,
            disableEstimate: true,
          };
            const url = `https://api.1inch.io/v4.0/${chainId}/swap?fromTokenAddress=${swapParams.fromTokenAddress}&toTokenAddress=${swapParams.toTokenAddress}&amount=${swapParams.amount}&fromAddress=${swapParams.fromAddress}&destReceiver=${swapParams.destReceiver}&slippage=${swapParams.slippage}&disableEstimate=${swapParams.disableEstimate}`;
            let txdata = await apiCaller(url)
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
        toke_address = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94"
        wbtc_address = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
        impersonateAddress = "0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2"


        usdc = await ethers.getContractAt('IERC20', usdc_address)
        weth = await ethers.getContractAt('IERC20', weth_address)
        dai = await ethers.getContractAt('IERC20', dai_address)
        toke = await ethers.getContractAt('IERC20', toke_address)
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
        vaultrelayer = await (await ethers.getContractFactory('VaultRelayer')).deploy(megaswapper.address)
        await megaswapper.setVault(vaultrelayer.address)

        await usdc.connect(signer).approve(vaultrelayer.address, MAX)
        console.log('before btc balance', (await wbtc.balanceOf(signer.address))/1e8)
        txdata = await getTxdata(chainId, usdc_address, wbtc_address, decimalStrUSDT("1000"), signer)
        executor_address = txdata.to
        executor_data = txdata.data
        console.log("executor_address", executor_address, "executor_data", executor_data)
        await megaswapper.connect(bob).swap(usdc_address, wbtc_address, decimalStrUSDT("1000"), false, signer.address, executor_address, executor_data)
        console.log('after btc balance', (await wbtc.balanceOf(signer.address))/1e8)
        // btc decimal is 8

    })
    //

    
    it("swapToETH", async function () {
        megaswapper = await (await ethers.getContractFactory('MegaSwapper')).deploy()
        vaultrelayer = await (await ethers.getContractFactory('VaultRelayer')).deploy(megaswapper.address)
        await megaswapper.setVault(vaultrelayer.address)
        await usdc.connect(signer).approve(vaultrelayer.address, MAX)

        console.log('before eth balance', (await ethers.provider.getBalance(signer.address))/1e18)
        txdata = await getTxdata(chainId, usdc_address, eth_address, decimalStrUSDT("1000"), signer)
        executor_address = txdata.to
        executor_data = txdata.data
        console.log("executor_address", executor_address, "executor_data", executor_data)
        await megaswapper.connect(alice).swap(usdc_address, eth_address, decimalStrUSDT("1000"), false, signer.address, executor_address, executor_data)
        console.log('after eth balance', (await ethers.provider.getBalance(signer.address))/1e18)
    })



})
