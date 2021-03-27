const { RequestGet } = require('../util/axiosRequest')


async function getItem(item, page, urlBuilder){
    let hostname = urlBuilder.hostName;
    let namespace = urlBuilder.gameDataNamespace;
    let requestURL = `${hostname}/data/wow/search/item${namespace}&name.en_US=${item}&orderby=id&_page=${page}&access_token=${urlBuilder.token}`
    return await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response})
}


exports.GetItem = getItem;