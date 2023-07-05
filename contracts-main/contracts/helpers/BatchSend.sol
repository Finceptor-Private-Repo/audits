// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BatchSend is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    function batchSend(
        address token,
        address[] memory recipients,
        uint256[] memory amounts
    ) external onlyOwner nonReentrant {
        require(
            recipients.length == amounts.length,
            "BatchSend: recipients and amounts length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(token).safeTransfer(recipients[i], amounts[i]);
        }
    }

    function withdraw(address token) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }
}
