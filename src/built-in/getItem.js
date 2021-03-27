const { FetchItems } = require("./fetchItems");
//const { NearMatchRatio } = require("./LevinshteinDistance");
fuzz = require('fuzzball');

async function userRequestedItems(item, urlBuilder){
    let itemList = await FetchItems(item, urlBuilder)
    item = item.join(' ');
    let returnData = [];
    for(let i in itemList){
        let ratio = fuzz.token_sort_ratio(item.toLowerCase(), i.toLowerCase());
        if (ratio > 70){
            returnData.push({'name': i, 'id': itemList[i], 'ratio' : ratio});
        }
    }

    returnData.sort((a,b) =>{
        return parseFloat(b.ratio) - parseFloat(a.ratio);
    })
    
    return returnData.slice(0,5);
}

exports.RequestedItems = userRequestedItems;