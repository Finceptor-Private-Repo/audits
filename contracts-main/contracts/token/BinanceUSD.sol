// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "contracts/token/DummyERC20.sol";

contract BinanceUSD is DummyERC20 {
    constructor() DummyERC20("Binance USD", "BUSD") {}
}
