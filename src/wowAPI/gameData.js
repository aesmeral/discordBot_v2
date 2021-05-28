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
            //console.log(e)
            let realms = e.data.realms;
            realms.forEach(r => {
                returnData[r.slug] = r.id;
            })
        });
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