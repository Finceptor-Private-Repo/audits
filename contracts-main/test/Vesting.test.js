const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
    loadFixture,
    time,
} = require("@nomicfoundation/hardhat-network-helpers");

async function returnTimestamp() {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return Math.round(blockBefore.timestamp);
}

describe("Project Vesting Contract Tests", function () {
    async function deployModifyEnvironment() {
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("DemoToken");
        const token = await Token.deploy();
        await token.deployed();

        const cliff = await returnTimestamp() + 100;
        const duration = 1000;
        const periodInSec = 100;
        console.log("Start Timestamp: " + cliff);

        const Vesting = await ethers.getContractFactory("Vesting");

        const vestingError = await expect(Vesting.deploy('0x0000000000000000000000000000000000000000', cliff, duration, periodInSec)).to.be.revertedWith("Token address cannot be 0");
        const vestingError2 = await expect(Vesting.deploy(token.address, 0, duration, periodInSec)).to.be.revertedWith("Cliff cannot be in the past");
        const vestingError3 = await expect(Vesting.deploy(token.address, cliff, 0, periodInSec)).to.be.revertedWith("Duration cannot be 0");
        const vestingContract = await Vesting.deploy(token.address, cliff, duration, periodInSec);
        await vestingContract.deployed();

        await expect(await vestingContract.getTokenAddress()).to.equal(token.address);

        const Releaser = await ethers.getContractFactory("Releaser");
        const releaser = await Releaser.attach(
            vestingContract.getReleaser()
        );

        await expect(await releaser.periods()).to.equal(periodInSec);

        return {
            owner,
            addr1,
            addr2,
            addr3,
            addr4,
            token,
            vestingContract,
        };
    }

    it("Releaser should revert on invalid arguments", async function () {
        const {
            owner,
            token,
        } = await loadFixture(deployModifyEnvironment);

        const cliff = await returnTimestamp() + 100;
        const duration = 1000;
        const periodInSec = 100;

        const Releaser = await ethers.getContractFactory("Releaser");
        const releaserError1 = await expect(Releaser.deploy("0x0000000000000000000000000000000000000000", token.address, cliff, duration, periodInSec)).to.be.revertedWith("Releaser: beneficiary is zero address");
        const releaserError2 = await expect(Releaser.deploy(owner.address,"0x0000000000000000000000000000000000000000", cliff, duration, periodInSec)).to.be.revertedWith("Releaser: token cannot be the zero address");
        const releaserError3 = await expect(Releaser.deploy(owner.address, token.address, 0, duration, periodInSec)).to.be.revertedWith("Releaser: start is before current time");
        const releaserError4 = await expect(Releaser.deploy(owner.address, token.address, cliff, 0, periodInSec)).to.be.revertedWith("Releaser: duration should be larger than 0");
    });

    it("Should add shares correctly", async function () {
        const {
            addr1,
            addr2,
            addr3,
            vestingContract,
        } = await loadFixture(deployModifyEnvironment);

        const initialShares = await vestingContract.shares(addr1.address);
        const amount = "100";
        
        await vestingContract.addShares(addr1.address, amount);
        
        const updatedShares = await vestingContract.shares(addr1.address);
        expect(updatedShares).to.equal(initialShares.add(amount));

        const initialShares2 = await vestingContract.shares(addr2.address);
        const amount2 = "200";
        
        await vestingContract.addShares(addr2.address, amount2);
        
        const updatedShares2 = await vestingContract.shares(addr2.address);
        expect(updatedShares2).to.equal(initialShares2.add(amount2));

        const initialShares3 = await vestingContract.shares(addr3.address);
        const amountError = "0";

        const vestingError = await expect(vestingContract.addShares(addr3.address, amountError)).to.be.revertedWith("Vesting: shares are 0");
        const vestingError2 = await expect(vestingContract.addShares("0x0000000000000000000000000000000000000000", amount2)).to.be.revertedWith("Vesting: account is the zero address");
    });

    it("should set shares correctly", async function () {
        const {
            addr1,
            addr2,
            addr3,
            vestingContract,
        } = await loadFixture(deployModifyEnvironment);

        const newShares = "200";
        await vestingContract.setShares(addr1.address, newShares);
        
        const updatedShares = await vestingContract.shares(addr1.address);
        expect(updatedShares).to.equal(newShares);

        const newShares2 = "200";
        await vestingContract.setShares(addr2.address, newShares2);
        
        const updatedShares2 = await vestingContract.shares(addr2.address);
        expect(updatedShares2).to.equal(newShares2);

        const newSharesError = "0";
        const vestingError = await expect(vestingContract.setShares(addr3.address, newSharesError)).to.be.revertedWith("Vesting: shares are 0");
        const vestingError2 = await expect(vestingContract.setShares("0x0000000000000000000000000000000000000000", newShares2)).to.be.revertedWith("Vesting: account is the zero address");
    });

    it("should remove shares correctly", async function () {
        const {
            addr1,
            addr2,
            addr3,
            vestingContract,
        } = await loadFixture(deployModifyEnvironment);

        const newShares = "200";
        await vestingContract.setShares(addr1.address, newShares);

        const newShares2 = "200";
        await vestingContract.setShares(addr2.address, newShares2);
        
        await vestingContract.removeShares(addr1.address);
        
        const updatedShares = await vestingContract.shares(addr1.address);
        expect(updatedShares).to.equal(0);

        const vestingError = await expect(vestingContract.removeShares("0x0000000000000000000000000000000000000000")).to.be.revertedWith("Vesting: account is the zero address");
    });

    it("should release tokens correctly, when not paused", async function () {
        const {
            addr1,
            addr2,
            addr3,
            addr4,
            token,
            vestingContract,
        } = await loadFixture(deployModifyEnvironment);

        const newShares = ethers.utils.parseUnits("500", 0);
        await vestingContract.setShares(addr1.address, newShares);
        const newShares2 = ethers.utils.parseUnits("200", 0);;
        await vestingContract.setShares(addr2.address, newShares2);
        const newShares3 = ethers.utils.parseUnits("300", 0);;
        await vestingContract.setShares(addr3.address, newShares3);

        const amount = ethers.utils.parseUnits("1000", 18);
        await token.mint(vestingContract.getReleaser(), amount);
        
        // Invalid claims
        await vestingContract.pause();
        await expect(vestingContract.connect(addr1).claim()).to.be.revertedWith("Pausable: paused");
        await vestingContract.unpause();
        await expect(vestingContract.connect(addr1).claim()).to.be.revertedWith("Vesting: account is not due payment");
        await expect(vestingContract.connect(addr4).claim()).to.be.revertedWith("Vesting: account has no shares");

        // Valid claims
        await time.increase(200);
        const balanceBefore1 = await token.balanceOf(addr1.address);
        const balanceBefore2 = await token.balanceOf(addr2.address);
        const balanceBefore3 = await token.balanceOf(addr3.address);

        const claimable1 = await vestingContract.claimableOf(addr1.address);
        const claimable2 = await vestingContract.claimableOf(addr2.address);
        const claimable3 = await vestingContract.claimableOf(addr3.address);

        await vestingContract.connect(addr1).claim();
        await vestingContract.connect(addr2).claim();
        await vestingContract.connect(addr3).claim();

        const balanceAfter1 = await token.balanceOf(addr1.address);
        const balanceAfter2 = await token.balanceOf(addr2.address);
        const balanceAfter3 = await token.balanceOf(addr3.address);

        expect(balanceAfter1).to.equal(balanceBefore1.add(newShares.mul(amount).div(10000)));
        expect(balanceAfter2).to.equal(balanceBefore2.add(newShares2.mul(amount).div(10000)));
        expect(balanceAfter3).to.equal(balanceBefore3.add(newShares3.mul(amount).div(10000)));

        expect(balanceAfter1).to.equal(balanceBefore1.add(claimable1));
        expect(balanceAfter2).to.equal(balanceBefore2.add(claimable2));
        expect(balanceAfter3).to.equal(balanceBefore3.add(claimable3));

        // Valid claims
        await time.increase(200);
        const balanceBefore12 = await token.balanceOf(addr1.address);
        const balanceBefore22 = await token.balanceOf(addr2.address);
        const balanceBefore32 = await token.balanceOf(addr3.address);

        await vestingContract.connect(addr1).claim();
        await vestingContract.connect(addr2).claim();
        await vestingContract.connect(addr3).claim();

        const balanceAfter12 = await token.balanceOf(addr1.address);
        const balanceAfter22 = await token.balanceOf(addr2.address);
        const balanceAfter32 = await token.balanceOf(addr3.address);

        expect(balanceAfter12).to.equal(balanceBefore12.add(newShares.mul(amount).mul(2).div(10000)));
        expect(balanceAfter22).to.equal(balanceBefore22.add(newShares2.mul(amount).mul(2).div(10000)));
        expect(balanceAfter32).to.equal(balanceBefore32.add(newShares3.mul(amount).mul(2).div(10000)));

        // Valid claims
        await time.increase(2000);

        const claimable12 = await vestingContract.claimableOf(addr1.address);
        const claimable22 = await vestingContract.claimableOf(addr2.address);
        const claimable32 = await vestingContract.claimableOf(addr3.address);

        await vestingContract.connect(addr1).claim();
        await vestingContract.connect(addr2).claim();
        await vestingContract.connect(addr3).claim();

        const balanceAfter13 = await token.balanceOf(addr1.address);
        const balanceAfter23 = await token.balanceOf(addr2.address);
        const balanceAfter33 = await token.balanceOf(addr3.address);

        expect(balanceAfter13).to.equal(balanceBefore1.add(newShares.mul(amount).div(1000)));
        expect(balanceAfter23).to.equal(balanceBefore2.add(newShares2.mul(amount).div(1000)));
        expect(balanceAfter33).to.equal(balanceBefore3.add(newShares3.mul(amount).div(1000)));

        expect(balanceAfter13).to.equal(balanceAfter12.add(claimable12));
        expect(balanceAfter23).to.equal(balanceAfter22.add(claimable22));
        expect(balanceAfter33).to.equal(balanceAfter32.add(claimable32));
    });

    it("should refund correctly", async function () {
        const {
            owner,
            addr1,
            addr2,
            addr3,
            addr4,
            token,
            vestingContract,
        } = await loadFixture(deployModifyEnvironment);

        const newShares = ethers.utils.parseUnits("500", 0);
        await vestingContract.setShares(addr1.address, newShares);
        const newShares2 = ethers.utils.parseUnits("200", 0);;
        await vestingContract.setShares(addr2.address, newShares2);
        const newShares3 = ethers.utils.parseUnits("300", 0);;
        await vestingContract.setShares(addr3.address, newShares3);

        const amount = ethers.utils.parseUnits("1000", 18);
        await token.mint(vestingContract.getReleaser(), amount);
    
        // Valid claims
        await time.increase(200);

        await vestingContract.connect(addr1).claim();
        await vestingContract.connect(addr2).claim();
        await vestingContract.connect(addr3).claim();

        const initialBalance = await token.balanceOf(owner.address);
        
        await expect(vestingContract.refundUser(addr1.address)).to.be.revertedWith("Refund is not open");
        await vestingContract.allowRefund();
        await vestingContract.refundUser(addr1.address);
        await vestingContract.disallowRefund();
        
        const accountBalance = await token.balanceOf(owner.address);
        const balanceLeft = (newShares.mul(amount).div(1000)).sub(newShares.mul(amount).div(10000));

        await expect(accountBalance).to.equal(initialBalance.add(balanceLeft));

        const sharesAfter = await vestingContract.shares(addr1.address);
        await expect(sharesAfter).to.equal(ethers.utils.parseUnits("0", 0));

        await expect(vestingContract.refundUser(addr2.address)).to.be.revertedWith("Refund is not open");
    });

});