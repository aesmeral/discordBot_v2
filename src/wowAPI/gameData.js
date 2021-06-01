const { RequestGet } = require('../util/axiosRequest')


async function getItem(item, page, urlBuilder){
    let hostname = urlBuilder.hostName;
    let namespace = urlBuilder.gameDataNamespace;
    let requestURL = `${hostname}/data/wow/search/item${namespace}&name.en_US=${item}&orderby=id&_page=${page}&access_token=${urlBuilder.token}`
    return await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response})
}

async function generateRealms(urlBuilder){
    let returnData = {}
    let uniqueID = new Set();
    let hostname = urlBuilder.hostName;
    let namespace = urlBuilder.gameDataNamespace.replace('static','dynamic') // need to change from static to dynamic namespace
    let requestURL = `${hostname}/data/wow/search/connected-realm${namespace}&orderby=id&access_token=${urlBuilder.token}`;
    let response =  await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response})
    if (response.status > 400) return null;
    else {
        let data = response.data.results;
        data.forEach(e => {
            let realms = e.data.realms;
            let r_id = e.data.id;
            realms.forEach(r => {
                returnData[r.slug] = r_id;
            })
            uniqueID.add(r_id);
        });
    }
    return {returnData , uniqueID};
}

async function generateAuctionHouse(urlBuilder, connectedRealmID){
    let returnData = {}
    let hostname = urlBuilder.hostName;
    let namespace = urlBuilder.gameDataNamespace.replace('static','dynamic')
    let requestURL = `${hostname}/data/wow/connected-realm/${connectedRealmID}/auctions${namespace}&access_token=${urlBuilder.token}`;
    let response = await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response});
    if (response.status > 400) return null;
    else {
        let data = response.data.auctions;
        if(data === undefined) {                                // for some reason the data for this gets cut off?  so we'll reprocess the response.              
            console.log(`${new Date().toLocaleString()} --- re-sending request to ${requestURL} due to data issue.`)
            response = await RequestGet(requestURL)
                .then((response) => {return response})
                .catch((err) => {return err.response})
            data = response.data.auctions
        }
        data.forEach(e => {
            if (returnData[e.item.id] === undefined) {
                returnData[e.item.id] = e.buyout ? e.buyout : e.unit_price;
            }
            else {
                if(returnData[e.item.id] > ( e.buyout || e.unit_price)) returnData[e.item.id] = e.buyout ? e.buyout : e.unit_price;
            }
        })
    }
    return returnData;
}

async function tokenPrice(urlBuilder){
    let hostname = urlBuilder.hostName;
    let namespace = urlBuilder.gameDataNamespace.replace('static','dynamic'); // need to change from static to dynamic namespace
    let requestURL = `${hostname}/data/wow/token/index${namespace}S&access_token=${urlBuilder.token}`;
    return await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response});
}

exports.GetItem = getItem;
exports.GenerateRealms = generateRealms;
exports.GetTokenPrice = tokenPrice;
exports.GenerateAuction = generateAuctionHouse;