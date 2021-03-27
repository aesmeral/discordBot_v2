const { GetItem } = require("../wowAPI/gameData");


async function fetchItems(item, urlBuilder){
    item = item.join(`%20`);
    let response = await GetItem(item, 1, urlBuilder);
    let data = {};
    let pageCount = response.data.pageCount;
    let results = response.data.results;
    if(pageCount > 1){
        results.forEach(element =>{
            data[element.data.name.en_GB] = element.data.media.id
        })
        for(let i = 2; i <= pageCount; i++){
            response = await GetItem(item, i, urlBuilder);
            results = response.data.results;
            results.forEach(element => {
                data[element.data.name.en_GB] = element.data.media.id;
            })
        }
    }
    return data;
}



exports.FetchItems = fetchItems;