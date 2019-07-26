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

    decrement(value: any) {
        this.currentBalance.minus(value);
        this.isEligible == this.currentBalance.isLessThan(this.getCurrentAllocation());
    }

    increment(value: any) {
        this.currentBalance.plus(value);
        this.isEligible == this.currentBalance.isLessThan(this.getCurrentAllocation());
    }

    getCurrentAllocation(): BigNumber {
        return BigNumber.sum(
            this.initialAllocation,
            this.firstBonus,
            this.secondBonus,
            this.thirdBonus,
            this.fourthBonus);
    }
}

const allocations: { [key: string]: string } = require("../config/allocations.json");
const firstBonusFromAddress = "0x1035a5dd4859a87cf25ed31b0df7436099f7d1c3";
const secondBonusFromAddress = "0xa5025faba6e70b84f74e9b1113e5f7f4e7f4859f";
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
            const value = transferEvent.returnValues._value;

            if (fromHolder && fromHolder.isEligible) {
                fromHolder.decrement(value);
            }

            if (toHolder && toHolder.isEligible) {
                toHolder.increment(value);
            }

            if (fromAddress === firstBonusFromAddress) {
                toHolder.firstBonus = new BigNumber(value);
            }
            else if (fromAddress === secondBonusFromAddress) {
                toHolder.secondBonus = new BigNumber(value);
            }
        }

        console.log("Current block: " + currentBlock);
        currentBlock = toBlock;
    }

    return snapshot;
}