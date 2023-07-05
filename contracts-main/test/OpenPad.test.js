const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("OPN Token contract", function () {
  async function deployTokenFixture() {
    const Token = await ethers.getContractFactory("OpenPad");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const opnToken = await Token.deploy();
    await opnToken.deployed();

    const decimals = await opnToken.decimals();
    const mintAmount = 1000;

    await opnToken.mint(owner.address, ethers.utils.parseUnits(mintAmount.toString(), decimals));

    return { Token, opnToken, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { opnToken, owner } = await loadFixture(deployTokenFixture);

      expect(await opnToken.owner()).to.equal(owner.address);
    });

    it("Should mint 1000 tokens to the an address", async function () {
      const { opnToken, owner, addr1} = await loadFixture(deployTokenFixture);

      const decimals = await opnToken.decimals();
      const mintAmount = 1000;

      await opnToken.mint(addr1.address, ethers.utils.parseUnits(mintAmount.toString(), decimals));
      const addr1Balance = await opnToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseUnits(mintAmount.toString(), decimals));
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { opnToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await opnToken.balanceOf(owner.address);
      expect(await opnToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { opnToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );
      // Transfer 50 tokens from owner to addr1
      await expect(
        opnToken.transfer(addr1.address, 50)
      ).to.changeTokenBalances(opnToken, [owner, addr1], [-50, 50]);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await expect(
        opnToken.connect(addr1).transfer(addr2.address, 50)
      ).to.changeTokenBalances(opnToken, [addr1, addr2], [-50, 50]);
    });

    it("Should emit Transfer events", async function () {
      const { opnToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      // Transfer 50 tokens from owner to addr1
      await expect(opnToken.transfer(addr1.address, 50))
        .to.emit(opnToken, "Transfer")
        .withArgs(owner.address, addr1.address, 50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await expect(opnToken.connect(addr1).transfer(addr2.address, 50))
        .to.emit(opnToken, "Transfer")
        .withArgs(addr1.address, addr2.address, 50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { opnToken, owner, addr1 } = await loadFixture(
        deployTokenFixture
      );
      const initialOwnerBalance = await opnToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner.
      // `require` will evaluate false and revert the transaction.
      await expect(
        opnToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Owner balance shouldn't have changed.
      expect(await opnToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });
});
