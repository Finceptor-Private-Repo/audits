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

describe("OPN Staking Contract", async function () {
    async function deployTokenFixture() {
        const [
            owner,
            addr1,
            addr2,
            addr3,
            addr4,
            addr5,
            addr6,
            addr7,
            addr8,
            addr9,
            addr10,
            addr11,
            addr12,
            addr13,
            addr14,
            addr15,
            addr16,
            addr17,
            addr18,
        ] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("OpenPad");
        const opnToken = await Token.deploy();
        await opnToken.deployed();

        const decimals = await opnToken.decimals();
        const mintAmountOwner = 1000;
        const mintAmount = 100;
        const mintAmountS = ethers.utils.parseUnits(
            mintAmount.toString(),
            decimals
        );
        const rewardRate = 10000;

        await opnToken.batchMint(
            [
                addr1.address,
                addr2.address,
                addr3.address,
                addr4.address,
                addr5.address,
                addr6.address,
                addr7.address,
                addr8.address,
                addr9.address,
                addr10.address,
                addr11.address,
                addr12.address,
                addr13.address,
                addr14.address,
                addr15.address,
                addr16.address,
                addr17.address,
                addr18.address,
            ],
            [
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
                mintAmountS,
            ]
        );
        await opnToken.mint(
            owner.address,
            ethers.utils.parseUnits(mintAmountOwner.toString(), decimals)
        );

        const StakingCompound = await ethers.getContractFactory(
            "StakingCompound"
        );

        const stakingContract = await StakingCompound.deploy(
            opnToken.address,
            owner.address,
            rewardRate
        );
        await stakingContract.deployed();

        await opnToken.approve(
            stakingContract.address,
            ethers.utils.parseUnits(mintAmount.toString(), decimals)
        );
        await opnToken
            .connect(addr1)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr2)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr3)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr4)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr5)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr6)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr7)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr8)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr9)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr10)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr11)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr12)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr13)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr14)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr15)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr16)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr17)
            .approve(stakingContract.address, mintAmountS);
        await opnToken
            .connect(addr18)
            .approve(stakingContract.address, mintAmountS);

        return {
            Token,
            StakingCompound,
            opnToken,
            stakingContract,
            rewardRate,
            owner,
            addr1,
            addr2,
            addr3,
            addr4,
			addr5,
			addr6,
			addr7,
			addr8,
			addr9,
			addr10,
			addr11,
			addr12,
			addr13,
			addr14,
			addr15,
			addr16,
			addr17,
			addr18,
        };
    }

    describe("Deployment", function () {
        it("Should be reverted because of zero address", async function () {
            const { opnToken , owner} =
                await loadFixture(deployTokenFixture);

            const StakingCompound2 = await ethers.getContractFactory(
                "StakingCompound"
            );

            console.log("opnToken.address", opnToken.address);
    
            const stakingContract2 = await expect(StakingCompound2.deploy(
                opnToken.address,
                ethers.constants.AddressZero,
                10000
            )).to.be.revertedWith("Staking bank address cannot be 0");

            const stakingContract3 = await expect(StakingCompound2.deploy(
                ethers.constants.AddressZero,
                owner.address,
                10000
            )).to.be.revertedWith("Staking token address cannot be 0");
        });
    });

    describe("Staking,  claiming, and withdrawing", function () {
        it("Should stake the right amounts", async function () {
            const { stakingContract, opnToken, addr1, addr2, addr3, addr4 } =
                await loadFixture(deployTokenFixture);
            const balanceBefore = await opnToken.balanceOf(addr1.address);

            await expect(stakingContract.connect(addr1).stake(balanceBefore))
                .to.emit(stakingContract, "Staked")
                .withArgs(addr1.address, balanceBefore);

            expect(await opnToken.balanceOf(addr1.address)).to.equal(0);
            expect(await stakingContract.stakedOf(addr1.address)).to.equal(
                balanceBefore
            );
        });

        it("Should withdraw the right amounts", async function () {
            const { stakingContract, opnToken, addr1, addr2, addr3, addr4 } =
                await loadFixture(deployTokenFixture);
            const balanceBefore = await opnToken.balanceOf(addr1.address);

            await stakingContract.connect(addr1).stake(balanceBefore);

            await expect(stakingContract.connect(addr1).withdraw(balanceBefore))
                .to.emit(stakingContract, "Withdrawn")
                .withArgs(addr1.address, balanceBefore);

            expect(await opnToken.balanceOf(addr1.address)).to.equal(
                balanceBefore
            );
            expect(await stakingContract.stakedOf(addr1.address)).to.equal(0);
        });

        it("Should claim the right reward amounts", async function () {
            const {
                stakingContract,
                opnToken,
                rewardRate,
                addr1,
                addr2,
                addr3,
                addr4,
            } = await loadFixture(deployTokenFixture);
            const balanceBefore = await opnToken.balanceOf(addr1.address);

            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;

            await stakingContract.connect(addr1).stake(balanceBefore);
            expect(await opnToken.balanceOf(addr1.address)).to.equal(0);

            await time.increase(1000);
            const blockNumAfter = await ethers.provider.getBlockNumber();
            const blockAfter = await ethers.provider.getBlock(blockNumAfter);
            const timestampAfter = blockAfter.timestamp;

            const totalStaked = await stakingContract.totalStaked();
            const claimAmount =
                ((await stakingContract.stakedOf(addr1.address)) *
                    (timestampAfter - timestampBefore) *
                    rewardRate) /
                totalStaked;

            await expect(stakingContract.connect(addr1).claimReward())
                .to.emit(stakingContract, "RewardClaimed")
                .withArgs(addr1.address, claimAmount);

            expect(await opnToken.balanceOf(addr1.address)).to.equal(
                claimAmount
            );
        });

        it("Should claim the right reward amounts for multiple stakers", async function () {
            const { stakingContract, opnToken, rewardRate, addr1, addr2 } =
                await loadFixture(deployTokenFixture);
            const balanceBefore = await opnToken.balanceOf(addr1.address);
            const balanceBefore2 = await opnToken.balanceOf(addr2.address);

            const timestampBefore = await returnTimestamp();

            await stakingContract.connect(addr1).stake(balanceBefore);
            const totalStaked1 = await stakingContract.totalStaked();
            await stakingContract.connect(addr2).stake(balanceBefore2);

            await time.increase(1000);
            const timestampAfter = await returnTimestamp();

            const totalStaked2 = await stakingContract.totalStaked();
            const claimAmount =
                ((await stakingContract.stakedOf(addr1.address)) *
                    1 *
                    rewardRate) /
                    totalStaked1 +
                ((await stakingContract.stakedOf(addr2.address)) *
                    (timestampAfter - timestampBefore - 1) *
                    rewardRate) /
                    totalStaked2;

            await expect(stakingContract.connect(addr1).claimReward())
                .to.emit(stakingContract, "RewardClaimed")
                .withArgs(addr1.address, Math.round(claimAmount));

            const timestampAfter2 = await returnTimestamp();
            const claimAmount2 =
                ((await stakingContract.stakedOf(addr2.address)) *
                    (timestampAfter2 - timestampBefore - 1) *
                    rewardRate) /
                totalStaked2;

            await expect(stakingContract.connect(addr2).claimReward())
                .to.emit(stakingContract, "RewardClaimed")
                .withArgs(addr2.address, Math.round(claimAmount2));

            expect(await opnToken.balanceOf(addr1.address)).to.equal(
                claimAmount
            );
            expect(await opnToken.balanceOf(addr2.address)).to.equal(
                claimAmount2
            );
        });

        it("Should set the reward rate right", async function () {
            const { stakingContract, addr1 } =
                await loadFixture(deployTokenFixture);

            await expect(stakingContract.connect(addr1).updateRewardRate(1000)).to.be.revertedWith("Ownable: caller is not the owner");
            console.log("denem 1");
            await stakingContract.updateRewardRate(1000);

            expect(await stakingContract.rewardRate()).to.equal(1000);
        });
    });

    describe("Auto compound", function () {
        it("Should auto compound multiple addresses", async function () {
            const {
                stakingContract,
                opnToken,
                addr1,
                addr2,
                addr3,
                addr4,
                addr5,
                addr6,
                addr7,
                addr8,
                addr9,
                addr10,
				addr11,
				addr12,
				addr13,
				addr14,
				addr15,
				addr16,
				addr17,
				addr18,
            } = await loadFixture(deployTokenFixture);

			await stakingContract.updateIterationNumber(100);

            const balanceBefore1 = await opnToken.balanceOf(addr1.address);
            const balanceBefore2 = await opnToken.balanceOf(addr2.address);
            const balanceBefore3 = await opnToken.balanceOf(addr3.address);
            const balanceBefore4 = await opnToken.balanceOf(addr4.address);
			const balanceBefore5 = await opnToken.balanceOf(addr5.address);
			const balanceBefore6 = await opnToken.balanceOf(addr6.address);
			const balanceBefore7 = await opnToken.balanceOf(addr7.address);
			const balanceBefore8 = await opnToken.balanceOf(addr8.address);
			const balanceBefore9 = await opnToken.balanceOf(addr9.address);
			const balanceBefore10 = await opnToken.balanceOf(addr10.address);
			const balanceBefore11 = await opnToken.balanceOf(addr11.address);
			const balanceBefore12 = await opnToken.balanceOf(addr12.address);
			const balanceBefore13 = await opnToken.balanceOf(addr13.address);
			const balanceBefore14 = await opnToken.balanceOf(addr14.address);
			const balanceBefore15 = await opnToken.balanceOf(addr15.address);
			const balanceBefore16 = await opnToken.balanceOf(addr16.address);
			const balanceBefore17 = await opnToken.balanceOf(addr17.address);
			const balanceBefore18 = await opnToken.balanceOf(addr18.address);

            await stakingContract.connect(addr1).stake(balanceBefore1);
            await stakingContract.connect(addr2).stake(balanceBefore2);
            await stakingContract.connect(addr3).stake(balanceBefore3);
            await stakingContract.connect(addr4).stake(balanceBefore4);
			await stakingContract.connect(addr5).stake(balanceBefore5);
			await stakingContract.connect(addr6).stake(balanceBefore6);
			await stakingContract.connect(addr7).stake(balanceBefore7);
			await stakingContract.connect(addr8).stake(balanceBefore8);
			await stakingContract.connect(addr9).stake(balanceBefore9);
			await stakingContract.connect(addr10).stake(balanceBefore10);
			await stakingContract.connect(addr11).stake(balanceBefore11);
			await stakingContract.connect(addr12).stake(balanceBefore12);
			await stakingContract.connect(addr13).stake(balanceBefore13);
			await stakingContract.connect(addr14).stake(balanceBefore14);
			await stakingContract.connect(addr15).stake(balanceBefore15);
			await stakingContract.connect(addr16).stake(balanceBefore16);
			await stakingContract.connect(addr17).stake(balanceBefore17);
			await stakingContract.connect(addr18).stake(balanceBefore18);

            expect(await opnToken.balanceOf(addr1.address)).to.equal(0);
            expect(await opnToken.balanceOf(addr2.address)).to.equal(0);
            expect(await opnToken.balanceOf(addr3.address)).to.equal(0);
            expect(await opnToken.balanceOf(addr4.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr5.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr6.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr7.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr8.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr9.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr10.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr11.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr12.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr13.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr14.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr15.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr16.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr17.address)).to.equal(0);
			expect(await opnToken.balanceOf(addr18.address)).to.equal(0);

            await time.increase(1000);
			await stakingContract.autoCompound();
			condition = await stakingContract.checkUpkeep(0x00);
			while (condition[0]) {
				await stakingContract.performUpkeep(0x00);
				condition = await stakingContract.checkUpkeep(0x00);
				console.log(condition[0]);
			}
			

            expect(await stakingContract.stakedOf(addr1.address)).to.not.equal(balanceBefore1);
            expect(await stakingContract.stakedOf(addr2.address)).to.not.equal(balanceBefore2);
            expect(await stakingContract.stakedOf(addr3.address)).to.not.equal(balanceBefore3);
            expect(await stakingContract.stakedOf(addr4.address)).to.not.equal(balanceBefore4);
			expect(await stakingContract.stakedOf(addr5.address)).to.not.equal(balanceBefore5);
			expect(await stakingContract.stakedOf(addr6.address)).to.not.equal(balanceBefore6);
			expect(await stakingContract.stakedOf(addr7.address)).to.not.equal(balanceBefore7);
			expect(await stakingContract.stakedOf(addr8.address)).to.not.equal(balanceBefore8);
			expect(await stakingContract.stakedOf(addr9.address)).to.not.equal(balanceBefore9);
			expect(await stakingContract.stakedOf(addr10.address)).to.not.equal(balanceBefore10);
			expect(await stakingContract.stakedOf(addr11.address)).to.not.equal(balanceBefore11);
			expect(await stakingContract.stakedOf(addr12.address)).to.not.equal(balanceBefore12);
			expect(await stakingContract.stakedOf(addr13.address)).to.not.equal(balanceBefore13);
			expect(await stakingContract.stakedOf(addr14.address)).to.not.equal(balanceBefore14);
			expect(await stakingContract.stakedOf(addr15.address)).to.not.equal(balanceBefore15);
			expect(await stakingContract.stakedOf(addr16.address)).to.not.equal(balanceBefore16);
			expect(await stakingContract.stakedOf(addr17.address)).to.not.equal(balanceBefore17);
			expect(await stakingContract.stakedOf(addr18.address)).to.not.equal(balanceBefore18);
        });
    });
});
