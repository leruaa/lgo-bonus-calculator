import $ from 'jquery'

let EthNode = "https://main-rpc.linkpool.io";
let LgoContractAddress = "0x123ab195dd38b1b40510d467a6a359b201af056f";


export function getUnspentAmount(timestamp) {
    let unspentAmounts = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [
            {
                "to": LgoContractAddress,
                "data": "0xf181f396" + timestamp.toString(16).padStart(64, "0")
            },
            "latest"
        ]
    };

    return new Promise(function (resolve, reject) {
        $.ajax({
            url: EthNode,
            type: "POST",
            data: JSON.stringify(unspentAmounts),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        }).done(function (data) {
            resolve(parseInt(data.result, 16) / 10**8);
        })
    });
}

export function getinitialAmount(address) {
    let initialAmounts = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [
            {
                "to": LgoContractAddress,
                "data": "0xd821b9f9" + address.slice(2).padStart(64, "0")
            },
            "latest"
        ]
    };

    return new Promise(function (resolve, reject) {
        $.ajax({
            url: EthNode,
            type: "POST",
            data: JSON.stringify(initialAmounts),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        }).done(function (data) {
            resolve(parseInt(data.result, 16) / 10**8);
        })
    });
}