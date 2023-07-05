// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract BatchSendNative is Ownable, ReentrancyGuard {
    event FundsReceived(address sender, uint256 amount);

    function batchSend(address[] memory recipients, uint256[] memory amounts)
        external
        onlyOwner
        nonReentrant
    {
        require(
            recipients.length == amounts.length,
            "BatchSend: recipients and amounts length mismatch"
        );
        string memory errorText;
        string memory errorMessage = "Failed to send funds to address number ";

        for (uint256 i = 0; i < recipients.length; i++) {
            (bool sent, ) = payable(recipients[i]).call{value: amounts[i]}("");
            errorText = string.concat(errorMessage, Strings.toString(i));
            require(sent, errorText);
        }
    }

    function withdraw() external onlyOwner {
        (bool sent, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(sent, "Failed to send funds");
    }

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}
