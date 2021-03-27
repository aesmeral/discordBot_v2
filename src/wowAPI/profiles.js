const { RequestGet } = require('../util/axiosRequest')


async function getArena(type, server, name, urlBuilder){
    let hostName = urlBuilder.hostName;
    let namespace = urlBuilder.profileNamespace + urlBuilder.token;
    let requestURL = `${hostName}/profile/wow/character/${server}/${name}/pvp-bracket/${type}${namespace}`
    
    return await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response})
}

async function getCharacter(server, name, urlBuilder){
    let hostName = urlBuilder.hostName;
    let namespace = urlBuilder.profileNamespace + urlBuilder.token;
    let requestURL = `${hostName}/profile/wow/character/${server}/${name}${namespace}`;

    return await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response})
}

async function getAvatar(server, name, urlBuilder){
    let hostname = urlBuilder.hostName;
    let namespace = urlBuilder.profileNamespace + urlBuilder.token;
    let requestURL = `${hostname}/profile/wow/character/${server}/${name}/character-media${namespace}`;

    return await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response})
}

exports.GetArena = getArena;
exports.GetCharacter = getCharacter;
exports.GetAvater = getAvatar;
