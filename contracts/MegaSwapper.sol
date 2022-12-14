// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;


import "./utils/Ownable.sol";
import "./utils/SaftMath.sol";
import "./utils/SafeERC20.sol";
import "./utils/RevertReasonParser.sol";
import "./IVaultRelayer.sol";
import "hardhat/console.sol";


contract MegaSwapper is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IVaultRelayer public vaultRelayer;

    mapping (address => bool) private authorized;
    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public constant ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
    address private TokenTransferProxy = 0x216B4B4Ba9F3e719726886d34a177484278Bfcae;

    event Swap(address indexed inToken, address indexed outToken, uint256 inAmount, uint256 outAmount, address recipient, bytes data);

    modifier onlyAuthorized() {
        require(authorized[msg.sender], "onlyAuthorized: caller is not autherized");
        _;
    }

    function setVault(address _vaultRelayer) external onlyOwner {
        vaultRelayer = IVaultRelayer(_vaultRelayer);
    }

    function setAuthorized(address _authorizeAddress) external onlyOwner {
        authorized[_authorizeAddress] = true;
    }

    function isETH(address token) internal pure returns (bool) {
        return (token == ZERO_ADDRESS || token == ETH_ADDRESS) ;
    }


    function swap(
        address inToken,
        address outToken,
        uint256 inAmount,
        bool isParaswap,
        address recipient,
        address caller,
        bytes calldata data
    )
        onlyAuthorized external
    {

        vaultRelayer.transferFromAccount(inToken, recipient, inAmount);
        if (isParaswap) {
            IERC20(inToken).safeApprove(TokenTransferProxy, type(uint256).max);
        } else {
            IERC20(inToken).safeApprove(caller, type(uint256).max);
        }

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory result) = address(caller).call(data);
        if (!success) {
            revert(RevertReasonParser.parse(result, "callBytes failed: "));
        }

        if (isParaswap) {
            IERC20(inToken).safeApprove(TokenTransferProxy, 0);
        } else {
            IERC20(inToken).safeApprove(caller, 0);
        }

        bool outETH = isETH(outToken);
        uint256 outAmount;
        if (!outETH) {
            outAmount = IERC20(outToken).balanceOf(address(this));
            IERC20(outToken).transfer(recipient, outAmount);
        } else
        {
            outAmount = address(this).balance;
            payable(recipient).transfer(outAmount);
        }
         emit Swap(inToken, outToken, inAmount, outAmount, recipient, result);
    }

    receive() external payable {
        // solhint-disable-next-line avoid-tx-origin
        require(msg.sender != tx.origin, "ETH deposit rejected");
    }

}