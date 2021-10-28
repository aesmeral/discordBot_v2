const warcraftItems = require("../../warcraftItems.json")
//const { NearMatchRatio } = require("./LevinshteinDistance");
fuzz = require('fuzzball');

// async function createRatio(item, userItem) {
//     let itemName = Object.keys(item)[0];
//     let ratio = fuzz.token_sort_ratio(itemName.toLowerCase(), userItem.toLowerCase());
//     if (ratio > 70) return {'name': itemName, 'id': item[itemName], 'ratio': ratio}
//     else return {'ratio': 0}
// }


async function userRequestedItems(item, urlBuilder){
    //let itemList = await FetchItems(item, urlBuilder)
    item = item.join(' ');
    let returnData = [];
    let dataArray = Object.keys(warcraftItems).map((key) => [key, warcraftItems[key]]);
    //console.time("findItem");
    for(let i = 0; i < dataArray.length; i++){
        let ratio = fuzz.token_sort_ratio(item.toLowerCase(), dataArray[i][0].toLowerCase());           // this function is the bottleneck, this is a question of accuracy vs speed. 
        if(ratio > 70){
            returnData.push({'name': dataArray[i][0], 'id': dataArray[i][1], 'ratio': ratio})
        }
    }
    //console.timeEnd("findItem");
    // returnData = await Promise.all(warcraftData.map(e => createRatio(e, item))); 
    // returnData = warcraftData.map(e => createRatio(e, item))
    returnData.sort((a,b) =>{
        return parseFloat(b.ratio) - parseFloat(a.ratio);
    })
    return returnData.slice(0,5);
}

exports.RequestedItems = userRequestedItems;