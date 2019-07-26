import { BigNumber } from 'bignumber.js';
import Web3 from 'web3';
import { EventLog } from 'web3/types';

export class TokenSnapshot {
    currentBlock: number;
    holders: { [key: string]: Holder };
    totalUnspentAmount: BigNumber;

    constructor() {
        this.holders = {};
    }
}

class Holder {
    initialAllocation: BigNumber;
    currentBalance: BigNumber;
    firstBonus: BigNumber;
    secondBonus: BigNumber;
    thirdBonus: BigNumber;
    fourthBonus: BigNumber;
    isEligible: boolean;

    constructor(initialAllocation: string) {
        this.initialAllocation = new BigNumber(initialAllocation);
        this.currentBalance = new BigNumber(initialAllocation);
        this.isEligible = true;
    }

    decrement(value: BigNumber) {
        this.currentBalance = this.currentBalance.minus(value);
        this.isEligible = this.currentBalance.isGreaterThan(this.getCurrentAllocation());
    }

    increment(value: BigNumber) {
        this.currentBalance = this.currentBalance.plus(value);
        this.isEligible = this.currentBalance.isGreaterThan(this.getCurrentAllocation());
    }

    getCurrentAllocation(): BigNumber {
        return BigNumber.sum(
            this.initialAllocation,
            this.firstBonus || 0,
            this.secondBonus || 0,
            this.thirdBonus || 0,
            this.fourthBonus || 0);
    }
}

const allocations: { [key: string]: string } = require("../config/allocations.json");
const firstBonusFromAddresses = [
    "0x1035a5dd4859a87cf25ed31b0df7436099f7d1c3", 
    "0x808e42cad58f3fdb7bc7c5e4c86620eb2cff22b2",
    "0x50eb15582cfa559affcc8e4aaef065f9b2ea587d",
    "0xbfdb0367caabb88b93eff9f63db26cbc7122cfe4"
];
const secondBonusFromAddresses = ["0xa5025faba6e70b84f74e9b1113e5f7f4e7f4859f"];
const lastBlock = 8166887;
let currentBlock = 5183900;


export async function getSnapshot(tokenContractAddress: string, tokenContractAbi: any[], tokenDecimals: number, apiUrl: string) {
    const web3 = new Web3(new Web3.providers.HttpProvider(apiUrl));
    const contract = new web3.eth.Contract(tokenContractAbi, tokenContractAddress);
    const snapshot = new TokenSnapshot();

    function getPastEvents(key: string, fromBlock: number, toBlock: any): Promise<EventLog[]> {
        return contract.getPastEvents(key, {
            fromBlock: fromBlock,
            toBlock: toBlock
        });
    }

    console.log("Init allocations...");
    for (const address of Object.keys(allocations)) {
        snapshot.holders[address] = new Holder(allocations[address]);
    }

    console.log("Getting transfers...");
    while (currentBlock < lastBlock) {
        const toBlock = Math.min(currentBlock + 10000, lastBlock);
        const transferEvents: EventLog[] = await getPastEvents('Transfer', currentBlock, toBlock);

        for (const transferEvent of transferEvents) {
            const fromAddress = transferEvent.returnValues._from.toLowerCase();
            const toAddress = transferEvent.returnValues._to.toLowerCase();
            const fromHolder = snapshot.holders[fromAddress];
            const toHolder = snapshot.holders[toAddress];
            const value = new BigNumber(transferEvent.returnValues._value).dividedBy(10**tokenDecimals);

            if (fromHolder && fromHolder.isEligible) {
                fromHolder.decrement(value);
            }

            if (toHolder && toHolder.isEligible) {
                toHolder.increment(value);
            }

            if (firstBonusFromAddresses.indexOf(fromAddress) > -1) {
                toHolder.firstBonus = value;
            }
            else if (secondBonusFromAddresses.indexOf(fromAddress) > -1) {
                toHolder.secondBonus = value;
            }
        }

        console.log("Current block: " + currentBlock);
        currentBlock = toBlock;
    }

    return snapshot;
}

