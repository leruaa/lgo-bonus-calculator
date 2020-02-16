import { updateSnapshot, TokenSnapshot, Holder } from './snapshotService';
import { saveSnapshot } from './persistanceService';
import { newTokenContractAddress, newTokenContractAbi, tokenDecimals } from './settings';
import Web3 from 'web3';
import { BigNumber } from 'bignumber.js';

(async function () {

    BigNumber.config({DECIMAL_PLACES: tokenDecimals});

    const args = process.argv;
    if (args.length !== 3) {
        console.error ('Usage: yarn run updateSnapshot <JSON RPC URL>');
        return;
    }

    const apiUrl = args[2];
    const web3 = new Web3(new Web3.providers.HttpProvider(apiUrl));
    const contract = new web3.eth.Contract(newTokenContractAbi, newTokenContractAddress);
    let latestBlock = await web3.eth.getBlock("latest");
    let snapshot = require("../config/snapshot.json") as TokenSnapshot;

    snapshot.totalUnspentAmount = new BigNumber(snapshot.totalUnspentAmount);

    for (let address of Object.keys(snapshot.holders)) {
        snapshot.holders[address] = Holder.instanciate(snapshot.holders[address]);
    }

    if (latestBlock.number > 9490743) {
        latestBlock = await web3.eth.getBlock(9490743);
    }

    snapshot = await updateSnapshot(snapshot, contract, latestBlock, tokenDecimals);

    await saveSnapshot(snapshot);

})()