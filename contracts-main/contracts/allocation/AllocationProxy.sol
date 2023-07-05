// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/allocation/IAllocationProxy.sol";
import "contracts/allocation/IAllocationProvider.sol";

contract AllocationProxy is IAllocationProxy, Ownable {
    IAllocationProvider private immutable _creditProvider;
    IAllocationProvider private immutable _directProvider;
    IAllocationProvider private immutable _relativeProvider;

    uint256 private _totalAllocation;
    uint256 private _remainingAllocation;

    constructor(address creditProvider, address directProvider, address relativeProvider, uint256 newTotalAllocation) {
        require(creditProvider != address(0), "AllocationProxy: must have a credit provider");
        require(directProvider != address(0), "AllocationProxy: must have a direct provider");
        require(relativeProvider != address(0), "AllocationProxy: must have a relative provider");
        
        _creditProvider = IAllocationProvider(creditProvider);
        _directProvider = IAllocationProvider(directProvider);
        _relativeProvider = IAllocationProvider(relativeProvider);
        _setAllocation(newTotalAllocation);
    }

    function resetAllocation(uint256 _newAllocation) external onlyOwner {
        _setAllocation(_newAllocation);
    }

    function allocationOf(address account) external view override returns (uint256) {
        uint256 _allocation = 0;
        _allocation += _creditProvider.allocationOf(account);
        _allocation += _directProvider.allocationOf(account);
        
        if(_relativeProvider.totalAllocation() == 0) {
            return _allocation;
        }
        _allocation +=
            (_relativeProvider.allocationOf(account) * _remainingAllocation) /
            _relativeProvider.totalAllocation();
        return _allocation;
    }

    function creditAllocationOf(address account) external view returns (uint256) {
        return _creditProvider.allocationOf(account);
    }

    function directAllocationOf(address account) external view returns (uint256) {
        return _directProvider.allocationOf(account);
    }

    function relativeAllocationOf(address account) external view returns (uint256) {
        if(_relativeProvider.totalAllocation() == 0) {
            return 0;
        }
        return _relativeProvider.allocationOf(account) * _remainingAllocation / _relativeProvider.totalAllocation();
    }

    function totalAllocation() external view override returns (uint256) {
        return _totalAllocation;
    }

    function _setAllocation(uint256 newTotalAllocation) internal {
        uint256 _allocation = 0;
        _allocation += _creditProvider.totalAllocation();
        _allocation += _directProvider.totalAllocation();
        _totalAllocation = newTotalAllocation;
        require(_totalAllocation >= _allocation, "AllocationProxy: Snapshot balances exceeds allocation.");
        _remainingAllocation = _totalAllocation - _allocation;
    }
}
