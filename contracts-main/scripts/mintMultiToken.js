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

    // transfer(to, amount)
    console.log('Initiating minting...');
    const recipientAddress1 = "0x040e81CCCa478A1e6F61046AD89f761dCB76B520";
    const recipientAddress2 = "0x70dA97d12fC7135D6098AF260025ee45887e690b";
    const recipientAddress3 = "0x692fE0c33B1066358acFcb086db473018EAc3Ce2";
    const recipientAddress4 = "0x6e5f3b13fd58345d7aa59f4ed98be620113a7cb5";
    const recipientAddress5 = "0x498f7c65C6DBAf51ff5afA1379bA47e5Ad203F83";

    const transferAmount = 10;

    console.log(`Minting ${transferAmount} ${symbol} tokens to ${recipientAddress1}`);
    await oct.mint(recipientAddress1, ethers.utils.parseUnits(transferAmount.toString(), decimals));
    console.log('Mint 1 completed');

    console.log(`Minting ${transferAmount} ${symbol} tokens to ${recipientAddress2}`);
    await oct.mint(recipientAddress2, ethers.utils.parseUnits(transferAmount.toString(), decimals));
    console.log('Mint 2 completed');

    console.log(`Minting ${transferAmount} ${symbol} tokens to ${recipientAddress3}`);
    await oct.mint(recipientAddress3, ethers.utils.parseUnits(transferAmount.toString(), decimals));
    console.log('Mint 3 completed');

    console.log(`Minting ${transferAmount} ${symbol} tokens to ${recipientAddress4}`);
    await oct.mint(recipientAddress4, ethers.utils.parseUnits(transferAmount.toString(), decimals));
    console.log('Mint 4 completed');

    console.log(`Minting ${transferAmount} ${symbol} tokens to ${recipientAddress5}`);
    await oct.mint(recipientAddress5, ethers.utils.parseUnits(transferAmount.toString(), decimals));
    console.log('Mint 5 completed');

    let recipientBalance1 = await oct.balanceOf(recipientAddress1);
    let recipientBalance2 = await oct.balanceOf(recipientAddress2);
    console.log(`Balance of recipient (${recipientAddres1}): ${ethers.utils.formatUnits(recipientBalance1, decimals)} ${symbol}\n`);
    console.log(`Balance of recipient (${recipientAddres2}): ${ethers.utils.formatUnits(recipientBalance2, decimals)} ${symbol}\n`);
    console.log(`Balance of recipient (${recipientAddres3}): ${ethers.utils.formatUnits(recipientBalance3, decimals)} ${symbol}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });