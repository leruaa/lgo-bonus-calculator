import { getSnapshot } from './snapshotService';
import { saveSnapshot } from './persistanceService';
import { oldTokenContractAddress, oldTokenContractAbi, tokenDecimals } from './settings';
import Web3 from 'web3';
import { BigNumber } from 'bignumber.js';

(async function () {

    BigNumber.config({DECIMAL_PLACES: 8});

    const args = process.argv;
    if (args.length !== 3) {
        console.error ('Usage: npm run start <JSON RPC URL>');
        return;
    }

    const apiUrl = args[2];
    const web3 = new Web3(new Web3.providers.HttpProvider(apiUrl));
    const contract = new web3.eth.Contract(oldTokenContractAbi, oldTokenContractAddress);
    const latestBlock = await web3.eth.getBlock(8166887);

    const snapshot = await getSnapshot(contract, tokenDecimals, latestBlock);

    await saveSnapshot(snapshot);

})()