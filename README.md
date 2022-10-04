# MegaSwapper
the universal swapper interface to 1inch, Paraswap and 0x.

Usage
1. query tx.data with the provider api
2. call `MegaSwapper.swap(address inToken,
        address outToken,
        uint256 inAmount,
        bool isParaswap,
        address recipient,
        address caller,
        bytes calldata txdata)`
   

Examples
1. 1inch -> test/05.VaultRelayer.1inch.test.js
2. Paraswap -> test/06.VaultRelayer.paraswap.test.js
3. 0x -> test/04.VaultRelayer.0x.test.js
