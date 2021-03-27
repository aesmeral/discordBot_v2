const axios = require('axios')

async function passport(BnetID, BnetSecret){
    let url = "https://us.battle.net/oauth/token?grant_type=client_credentials";
    let parameters = {
        auth : { username : BnetID, password: BnetSecret}
    };
    var sendBack = -2;
    await axios.post(url, {}, parameters)
    .then((response) => {sendBack = response.data})
    .catch((err) => {sendBack = -1})
    return sendBack
}


exports.Passport = passport;
