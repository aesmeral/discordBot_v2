const axios = require('axios')


async function GET(url) {
    let response = await axios.get(url);
    return response;
}



exports.RequestGet = GET