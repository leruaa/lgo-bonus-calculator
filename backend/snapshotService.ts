import { BigNumber } from 'bignumber.js';
import { EventLog } from 'web3/types';
import Contract from 'web3/eth/contract';
import { Block } from 'web3/eth/types';

export class TokenSnapshot {
    latestBlockNumber: number;
    latestBlockTimestamp: number;
    holders: { [key: string]: Holder };
    totalUnspentAmount: BigNumber;
    holdersWhoLostBonus: number;

    constructor() {
        this.holders = {};
        this.totalUnspentAmount = new BigNumber(181415052);
        this.holdersWhoLostBonus = 0;
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
        this.isEligible = this.currentBalance.isGreaterThanOrEqualTo(this.initialAllocation);
    }

    increment(value: BigNumber) {
        this.currentBalance = this.currentBalance.plus(value);
        this.isEligible = this.currentBalance.isGreaterThanOrEqualTo(this.initialAllocation);
    }


}

const allocations: { [key: string]: string } = require("../config/allocations.json");
const firstBonusFromAddresses = [
    "0x1035a5dd4859a87cf25ed31b0df7436099f7d1c3", 
    "0x808e42cad58f3fdb7bc7c5e4c86620eb2cff22b2",
    "0x50eb15582cfa559affcc8e4aaef065f9b2ea587d",
    "0xbfdb0367caabb88b93eff9f63db26cbc7122cfe4",
    "0xcd1b6113945a80ebd42c1ea40a1b93d6fbff199a"
];
const secondBonusFromAddresses = ["0xa5025faba6e70b84f74e9b1113e5f7f4e7f4859f"];
let currentBlock = 5183918;


export async function getSnapshot(contract: Contract, tokenDecimals: number, lastBlock: Block) {
    const snapshot = new TokenSnapshot();

    function getPastEvents(key: string, fromBlock: number, toBlock: any): Promise<EventLog[]> {
        return contract.getPastEvents(key, {
            fromBlock: fromBlock,
            toBlock: toBlock
        });
    }

    for (const address of Object.keys(allocations)) {
        snapshot.holders[address] = new Holder(allocations[address]);
    }

    console.log("Getting transfers...");
    while (currentBlock < lastBlock.number) {
        console.log("Current block: " + currentBlock);
        const toBlock = Math.min(currentBlock + 10000, lastBlock.number);
        const transferEvents: EventLog[] = await getPastEvents('Transfer', currentBlock, toBlock);

        for (const transferEvent of transferEvents) {        
            const fromAddress = transferEvent.returnValues._from.toLowerCase();
            const toAddress = transferEvent.returnValues._to.toLowerCase();
            const fromHolder = snapshot.holders[fromAddress];
            const toHolder = snapshot.holders[toAddress];
            const value = new BigNumber(transferEvent.returnValues._value).dividedBy(10**tokenDecimals);
            const fromHolderWasEligible = fromHolder && fromHolder.isEligible;
            const toHolderWasEligible = toHolder && toHolder.isEligible

            if (fromHolderWasEligible) {
                fromHolder.decrement(value);
            }

            if (toHolderWasEligible) {
                toHolder.increment(value);
            }

            if (fromHolderWasEligible && !fromHolder.isEligible && fromHolder.initialAllocation.isGreaterThan(0)) {
                snapshot.holdersWhoLostBonus++;
                snapshot.totalUnspentAmount = snapshot.totalUnspentAmount.minus(fromHolder.initialAllocation);
            }

            if (toHolderWasEligible && !toHolder.isEligible && toHolder.initialAllocation.isGreaterThan(0)) {
                snapshot.holdersWhoLostBonus++;
                snapshot.totalUnspentAmount = snapshot.totalUnspentAmount.minus(toHolder.initialAllocation);
            }

            if (firstBonusFromAddresses.indexOf(fromAddress) > -1) {
                toHolder.firstBonus = value;
            }
            else if (secondBonusFromAddresses.indexOf(fromAddress) > -1) {
                toHolder.secondBonus = value;
            }
        }

        currentBlock = toBlock + 1;
    }

    snapshot.latestBlockNumber = lastBlock.number;
    snapshot.latestBlockTimestamp = lastBlock.timestamp;

    return snapshot;
}

