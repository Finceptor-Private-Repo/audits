// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "contracts/kyc/IKYCProvider.sol";

contract BasicKYCProvider is AccessControl, IKYCProvider {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant KYC_MANAGER = keccak256("KYC_MANAGER");

    EnumerableSet.AddressSet private whitelist;

    /**
     * Tried to access an address at an index that is out of bounds.
     * @param _index The index that was accessed.
     * @param _length The length of the whitelist.
     */
    error OutOfBounds(uint256 _index, uint256 _length);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(KYC_MANAGER, msg.sender);
    }

    function makeManager(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(KYC_MANAGER, _account);
    }

    function revokeManager(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(KYC_MANAGER, _account);
    }

    function isWhitelisted(address _account) external view returns (bool) {
        return whitelist.contains(_account);
    }

    function addToWhitelist(address _account) public onlyRole(KYC_MANAGER) {
        bool added = whitelist.add(_account);
        if (added) {
            emit Whitelisted(_account, block.timestamp);
        }
    }

    function batchAddToWhitelist(address[] memory _accounts) external onlyRole(KYC_MANAGER) {
        for (uint256 i = 0; i < _accounts.length; i++) {
            addToWhitelist(_accounts[i]);
        }
    }

    function removeFromWhitelist(address _account) public onlyRole(KYC_MANAGER) {
        bool removed = whitelist.remove(_account);
        if (removed) {
            emit Blacklisted(_account, block.timestamp);
        }
    }

    function batchRemoveFromWhitelist(address[] memory _accounts) external onlyRole(KYC_MANAGER) {
        for (uint256 i = 0; i < _accounts.length; i++) {
            removeFromWhitelist(_accounts[i]);
        }
    }

    function whitelistCount() external view returns (uint256) {
        return whitelist.length();
    }

    function addressAt(uint256 _index) external view returns (address) {
        if (_index >= whitelist.length()) {
            revert OutOfBounds(_index, whitelist.length());
        }
        return whitelist.at(_index);
    }

    function addressesBetween(uint256 _start, uint256 _end)
        external
        view
        returns (address[] memory)
    {
        if (_start >= _end || _end >= whitelist.length()) {
            revert OutOfBounds(_end, whitelist.length());
        }
        uint256 length = _end - _start;
        address[] memory _whitelist = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            _whitelist[i] = whitelist.at(_start + i);
        }
        return _whitelist;
    }
}
