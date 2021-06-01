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
    for(let i in warcraftItems){
        let ratio = fuzz.token_sort_ratio(item.toLowerCase(), i.toLowerCase());
        if (ratio > 70){
            returnData.push({'name': i, 'id': warcraftItems[i], 'ratio' : ratio});
        }
    }
    // returnData = await Promise.all(warcraftData.map(e => createRatio(e, item))); 
    // returnData = warcraftData.map(e => createRatio(e, item))
    returnData.sort((a,b) =>{
        return parseFloat(b.ratio) - parseFloat(a.ratio);
    })
    return returnData.slice(0,5);
}

exports.RequestedItems = userRequestedItems;