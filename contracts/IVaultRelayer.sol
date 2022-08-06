// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;


interface IVaultRelayer {
    function transferFromAccount(address, address, uint256) external;
}
