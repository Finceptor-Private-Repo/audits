// scripts/sendToken.js
const { ethers } = require("hardhat");

async function main() {
    console.log('Getting the OpenpaCreditToken contract...');
    const contractAddress = '0x270F52607aa5FE47f5F47bedf3925Ea85ea3FEAd';
    const oct = await ethers.getContractAt('OpenpadCreditToken', contractAddress);

    // name()
    console.log('Querying token name...');
    const name = await oct.name();
    console.log(`Token Name: ${name}\n`);

    // symbol()
    console.log('Querying token symbol...');
    const symbol = await oct.symbol();
    console.log(`Token Symbol: ${symbol}\n`);

    // decimals()
    console.log('Querying decimals...');
    const decimals = await oct.decimals();
    console.log(`Token Decimals: ${decimals}\n`);

    // balanceOf(address account)
    console.log('Getting the balance of contract owner...');
    const ownerAddress = "0xbf1345f1b27a711eb3128288db1783db19027da2";
    let ownerBalance = await oct.balanceOf(ownerAddress);
    console.log(`Contract owner at ${ownerAddress} has a ${symbol} balance of ${ethers.utils.formatUnits(ownerBalance, decimals)}\n`);

    // transfer(to, amount)
    console.log('Initiating minting...');
    const recipientAddress10 = "0x0D65a648105727c00C03D89D719d905BD4f8D538";
    const transferAmount2 = 200;

    console.log(`Minting ${transferAmount2} ${symbol} tokens to ${recipientAddress10}`);
    await oct.mint(recipientAddress10, ethers.utils.parseUnits(transferAmount2.toString(), decimals));
    console.log('Mint 1 completed');

    let recipientBalance10 = await oct.balanceOf(recipientAddress10);
    console.log(`Balance of recipient (${recipientAddress10}): ${ethers.utils.formatUnits(recipientBalance10, decimals)} ${symbol}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });