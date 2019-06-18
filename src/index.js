import $ from 'jquery'
import './css/main.less'

import { getUnspentAmount, getinitialAmount } from './js/lgo'

const CirculatingSupply = 181415052
const BonusTimestamps = [1534291200, 1550188800, 1565827200, 1581724800];

$(document).ready(() => {
    $("#results-pane").hide();

    getUnspentAmount(BonusTimestamps[3]).then((unspentAmount) => {
        let roi = 5 * CirculatingSupply / unspentAmount;
        $("#roi .value").text(formatNumber(roi, 2) + " %");
        $("#roi .value").removeClass("loader");
    });
});

$("#send").click(async () => {

    $("#results-pane").show();
    $("#results").hide();

    let initialAmount = await getinitialAmount($("#address").val());

    $("#circulating-supply").text(formatNumber(CirculatingSupply) + " LGO")
    $("#initial-amount").text(formatNumber(initialAmount, 2) + " LGO")
    $("#loading").hide();
    $("#results").show();

    for (let i = 0; i < BonusTimestamps.length; i++) {
        let now = Date.now() / 1000 | 0;
        let bonusDate = BonusTimestamps[i];
        let unspentCell = $("#results tbody tr:nth-child(1) td:nth-child(" + (i + 2) + ")");
        let bonusCell = $("#results tbody tr:nth-child(2) td:nth-child(" + (i + 2) + ")");
        let roiCell = $("#results tbody tr:nth-child(3) td:nth-child(" + (i + 2) + ")");
        let headerCell = $("#results thead th:nth-child(" + (i + 2) + ")");

        getUnspentAmount(bonusDate).then((unspentAmount) => {
            let bonusAmount = CirculatingSupply / unspentAmount * initialAmount * 0.05;
            let roi = 5 * CirculatingSupply / unspentAmount;

            if (now < bonusDate) {
                headerCell.addClass("disabled");
                unspentCell.addClass("disabled");
                bonusCell.addClass("disabled");
                roiCell.addClass("disabled");
            }

            unspentCell.text(formatNumber(unspentAmount, 2) + " LGO")
            bonusCell.text(formatNumber(bonusAmount, 2) + " LGO");
            roiCell.text(formatNumber(roi, 2) + " %");
        });

    }
});

function formatNumber(val, decimals = 0) {
    const regEx = decimals == 0 ? /\d(?=(\d{3})+$)/g : /\d(?=(\d{3})+\.)/g;
    return val.toFixed(decimals).replace(regEx, '$&,');
}