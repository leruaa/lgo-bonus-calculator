import { getSnapshot } from './snapshotService';
import { saveSnapshot } from './persistanceService';
import { oldTokenContractAddress, oldTokenContractAbi, tokenDecimals } from './settings';
import {BigNumber} from 'bignumber.js';

(async function () {

    BigNumber.config({DECIMAL_PLACES: 8});

    const args = process.argv;
    if (args.length !== 3) {
        console.error ('Usage: npm run start <JSON RPC URL>');
        return;
    }

    const apiUrl = args[2];
    const snapshot = await getSnapshot(oldTokenContractAddress, oldTokenContractAbi, tokenDecimals, apiUrl);

    await saveSnapshot(snapshot);

})()