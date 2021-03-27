const { RequestGet } = require('../util/axiosRequest')

async function getRaiderProfile(server, name, urlBuilder){
    let hostName = urlBuilder.hostName;
    let namespace = urlBuilder.namespace;
    let currentRaid = urlBuilder.currentRaid;
    let requestURL = `${hostName}api/v1/characters/profile?${namespace}&realm=${server}&name=${name}&fields=mythic_plus_best_runs%2Cmythic_plus_recent_runs%2Cmythic_plus_scores_by_season%3Acurrent%2Craid_achievement_curve%3A${currentRaid}`

    return await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response})
}

async function getCurrentAffix(urlBuilder){
    let hostName = urlBuilder.hostName;
    let namespace = urlBuilder.namespace;
    let requestURL = `${hostName}api/v1/mythic-plus/affixes?${namespace}&locale=en`

    return await RequestGet(requestURL)
        .then((response) => {return response})
        .catch((err) => {return err.response})
}



exports.GetRaider = getRaiderProfile;
exports.GetAffix = getCurrentAffix;