const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("OPN Allocation Contract", function () {
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


		await stakingContract.connect(addr1).stake(mintAmountS);
		await stakingContract.connect(addr2).stake(mintAmountS);
		await stakingContract.connect(addr3).stake(mintAmountS);
		await stakingContract.connect(addr4).stake(mintAmountS);
		await stakingContract.connect(addr5).stake(mintAmountS);
		await stakingContract.connect(addr6).stake(mintAmountS);
		await stakingContract.connect(addr7).stake(mintAmountS);
		await stakingContract.connect(addr8).stake(mintAmountS);
		await stakingContract.connect(addr9).stake(mintAmountS);
		await stakingContract.connect(addr10).stake(mintAmountS);

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
        it("Should fail because of invalid multiplier values", async function () {
            const { stakingContract, opnToken, owner } = await loadFixture(
                deployTokenFixture
            );

            const alfa = 100;
            const beta = 100;
            const teta = 100;

            //Try to deploy StakingAllocatioProvider
            const StakingAllocationProvider = await ethers.getContractFactory(
                "StakingAllocationProvider"
            );
            const stakingAllocation = await expect(
                StakingAllocationProvider.deploy(
                    stakingContract.address,
                    alfa,
                    beta,
                    teta
                )
            ).to.be.revertedWith(
                "StakingAllocationProvider: Alfa, beta and teta must sum 1 ether"
            );
        });

        it("Should take correct snapshot", async function () {
            const { stakingContract, opnToken, owner, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(
                deployTokenFixture
            );

            const alfa = ethers.utils.parseUnits("0.8", 18);
            const beta = ethers.utils.parseUnits("0.1", 18);
            const teta = ethers.utils.parseUnits("0.1", 18);

            //Try to deploy StakingAllocatioProvider
            const StakingAllocationProvider = await ethers.getContractFactory(
                "StakingAllocationProvider"
            );
            const stakingAllocation = await StakingAllocationProvider.deploy(
                stakingContract.address,
                alfa,
                beta,
                teta
            );
			await stakingAllocation.deployed();

			await stakingAllocation.takeSnapshot([addr1.address, addr2.address, addr3.address, addr4.address, addr5.address]);
			console.log("Snapshot taken");
			await expect(await stakingAllocation.allocationOf(addr1.address)).to.not.equal(0);
			await expect(await stakingAllocation.allocationOf(addr2.address)).to.not.equal(0);
			await expect(await stakingAllocation.allocationOf(addr3.address)).to.not.equal(0);
			await expect(await stakingAllocation.allocationOf(addr4.address)).to.not.equal(0);
			await expect(await stakingAllocation.allocationOf(addr5.address)).to.not.equal(0);
		});	
    });
});
