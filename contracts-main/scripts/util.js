const fs = require("fs/promises");
const path = require("path");

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms milliseconds to sleep
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Write a new address to the contracts.json file
 * @param {string} contractsFile file to write to
 * @param {object} addresses
 */
async function writeNewAddresses(contractsFile, addresses) {
    const resolved = path.resolve(contractsFile);
    console.log(`Writing new address to ${resolved}`);

    const contents = await fs.readFile(resolved, "utf-8");
    const contracts = JSON.parse(contents);
    const newContracts = { ...contracts, ...addresses };

    await fs.writeFile(resolved, JSON.stringify(newContracts, null, 4));
}

async function readAddresses(contractsFile) {
    const resolved = path.resolve(contractsFile);
    console.log(`Reading addresses from ${resolved}`);

    const json = await fs.readFile(resolved, "utf-8");
    return JSON.parse(json);
}

module.exports = {
    sleep,
    writeNewAddresses,
    readAddresses,
};
