import $ from 'jquery'
import './css/main.less'

import { BigNumber } from 'bignumber.js';
import moment from 'moment';
import snapshot from '../config/snapshot';

BigNumber.config(
    {
        DECIMAL_PLACES: 8,
        FORMAT: {
            decimalSeparator: '.',
            groupSeparator: ',',
            groupSize: 3
        }
    }
)

const circulatingSupply = new BigNumber(181415052);
const unspentAmount = BigNumber(snapshot.totalUnspentAmount);
const currentRoi = circulatingSupply.multipliedBy(5).dividedBy(unspentAmount);
const BonusTimestamps = [1534291200, 1550188800, 1565827200, 1581724800];


$(document).ready(() => {
    $("#results-pane").hide();
    $("#roi .value").text(currentRoi.toFormat(2) + " %");
    $("#latest-block-number").text(snapshot.latestBlockNumber);
    $(".latest-block-timestamp").text(moment.unix(snapshot.latestBlockTimestamp).format('LLL'));
    $("#circulating-supply").text(circulatingSupply.toFormat() + " LGO");
    $("#unspent-amount").text(unspentAmount.toFormat(0) + " LGO");
    
    $("#holders-who-lost-bonus").text(snapshot.holdersWhoLostBonus);
});

$("#send").click(async () => {
    const address = $("#address").val();
    const holder = snapshot.holders[address];

    if (holder !== undefined) {
        const initialAllocation = new BigNumber(holder.initialAllocation);

        $("#results .label").removeClass("green").removeClass("blue").removeClass("red");
        $("#results .icon").removeClass("check").removeClass("medal").removeClass("ban");
        $("#results-pane").show();
        $("#results").hide();
        $("#initial-amount").text(initialAllocation.toFormat(2) + " LGO")
        $("#results").show();
    
        for (let i = 0; i < BonusTimestamps.length; i++) {
            let now = Date.now() / 1000 | 0;
            let bonusDate = BonusTimestamps[i];
            let statusCell = $("#results tbody tr:nth-child(1) td:nth-child(" + (i + 2) + ")");
            let bonusCell = $("#results tbody tr:nth-child(2) td:nth-child(" + (i + 2) + ")");
            let roiCell = $("#results tbody tr:nth-child(3) td:nth-child(" + (i + 2) + ")");
            let headerCell = $("#results thead th:nth-child(" + (i + 2) + ")");
    
            let bonusAmount = getbonusAmount(holder, i);
            let roi;

            if (bonusAmount.isFinite()) {
                roi = bonusAmount.dividedBy(initialAllocation).multipliedBy(100);
                statusCell.find(".label").addClass("green");
                statusCell.find(".icon").addClass("check");
                statusCell.find("span").text("Distributed");
            }
            else {
                if (bonusDate < now) {
                    statusCell.find(".label").addClass("red");
                    statusCell.find(".icon").addClass("ban");
                    statusCell.find("span").text("Lost");
                }
                else {
                    headerCell.addClass("disabled");
                    statusCell.addClass("disabled");
                    bonusCell.addClass("disabled");
                    roiCell.addClass("disabled");

                    if (holder.isEligible) {
                        roi = currentRoi;
                        bonusAmount = initialAllocation.multipliedBy(currentRoi.dividedBy(100));
                        statusCell.find(".label").addClass("blue");
                        statusCell.find(".icon").addClass("medal");
                        statusCell.find("span").text("Eligible");
                    }
                    else {
                        statusCell.find(".label").addClass("red");
                        statusCell.find(".icon").addClass("ban");
                        statusCell.find("span").text("Lost");
                    }
                }
            }
            
            if (bonusAmount && bonusAmount.isFinite()) {
                bonusCell.text(bonusAmount.toFormat(2) + " LGO");
            }
            else {
                bonusCell.html("&mdash;");
            }
            
            if (roi && roi.isFinite()) {
                roiCell.text(roi.toFormat(2) + " %");
            }
            else {
                roiCell.html("&mdash;");
            }
        }
    }

    
});

function getbonusAmount(holder, index) {
    switch (index) {
        case 0: return new BigNumber(holder.firstBonus);
        case 1: return new BigNumber(holder.secondBonus);
        case 2: return new BigNumber(holder.thirdBonus);
        case 3: return new BigNumber(holder.fourthBonus);
    }
}