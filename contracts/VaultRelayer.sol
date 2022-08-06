// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;


import "./utils/Ownable.sol";
import "./utils/SaftMath.sol";
import "./utils/SafeERC20.sol";
import "./IVaultRelayer.sol";
import "hardhat/console.sol";


contract VaultRelayer is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public swapper;

    constructor (address _swapper) {
        swapper = _swapper;
    }

    modifier onlySwapper() {
        require(swapper == msg.sender, "VaultRelayer: caller is not the swapper");
        _;
    }

    function transferFromAccount(
        address token,
        address from,
        uint256 amount
    ) external onlySwapper {
        IERC20(token).safeTransferFrom(from, swapper, amount);
    }

}