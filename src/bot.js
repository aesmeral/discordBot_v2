require('dotenv').config();
const { Passport } = require('./wowAPI/setup')
const { Client, MessageEmbed } = require('discord.js');
const { GetArena, GetCharacter, GetAvater } = require('./wowAPI/profiles');
const { ResponseType } = require('./util/cmdType');
const { GetRaider, GetAffix } = require('./rioAPI/requestData');
const { FetchItems } = require('./built-in/fetchItems');
const { RequestedItems } = require('./built-in/getItem');
const { GenerateRealms } = require('./wowAPI/gameData');

const client = new Client();
const PREFIX = "!"
const _discordToken = process.env.DISCORD_TOKEN;
const minutes = parseInt(process.env.IntervalTime);
var token;
var mappedRealms;

var BnetUrlBuilder = {
    'hostName': process.env.BnetHost,
    'profileNamespace': process.env.BnetProfileNameSpace,
    'gameDataNamespace': process.env.BnetGameDataNameSpace
}

var RaiderIOUrlBuilder = {
    'hostName': process.env.RaiderIOHost,
    'namespace': process.env.RaiderIORegion,
    'currentRaid': process.env.RaiderIOCurrentRaid
}

function deleteMessage(message){
    message.delete({timeout : 3000})
        .then(console.log(`${new Date().toLocaleString()} --- ${message} successfully deleted`))
        .catch(console.error)
}

async function collectMappedRealms(){
    return await GenerateRealms(BnetUrlBuilder);
}

  /*
        list of commands

        io {server} {character}                 <- returns raider io score, best dungeon run, and latest dungeon run (raider.io API)    -- completed
        aotc {server} {character}               <- returns aotc or not aotc                                          (raider.io API)    -- completed
        affix                                   <- tells you this week's affix for M+                                (raider.io API)    -- completed
        char {server} {character}               <- returns information on character                                  (Blizzard API)     -- completed    
        arena {bracket} {server} {character}    <- gets arena rating details                                         (Blizzard API)     -- completed
        roll {number}                           <- roll from 1 - {number}. if we're pugging this is helpful          (built in)         -- completed    


        TODO: NOTES --- Need to implement these functions (Need to make python scripts to get data because it would take forever if we kept rerunning jobs to search..)

        itemPrice {server} {string/id}          <- gets auction house price from your server                         (built in)
        item  {item string}                     <- provides a link (multiple if applicable) to your item             (Blizzard API)     -- completed
        class {spec} {class}                    <- get a specific wowhead guide                                      (built-in)         
        class {class/spec}                      <- if given a class, provide multiple spec. if given a spec ^^       (built-in)
        help                                    <- display all the commands                                          (built in)         -- completed
    */

client.setInterval(() => {
    console.log(`${new Date().toLocaleString()} --- running every ${minutes} minute.`);
}, minutes * 60 * 1000);

client.on('ready', async () => {
    console.log(`${new Date().toLocaleString()} --- ${client.user.username} has logged in...`)
    // obtaining auth token for world of warcraft api
    await Passport(process.env.BnetID, process.env.BnetSecret)
    .then((response) => {
        token = response.access_token;
        console.log(`${new Date().toLocaleString()} --- World of Warcraft API token configured...`)
    });
    BnetUrlBuilder['token'] = token;
    // mapping realms to connected realms id.
    mappedRealms = await collectMappedRealms();
    console.log(`${new Date().toLocaleString()} --- Realms have been mapped to connected realm ID`)
});

client.on('message', async (message) => {
    if(message.author.bot) return;
    if(message.content.startsWith(PREFIX)){
        const [cmd, ...args] = message.content
        .trim()
        .substring(PREFIX.length)
        .split(" ");

        // commands start here 
        console.log(`${new Date().toLocaleString()} --- ${message.author.username} requested: ${message.content.trim().substring(PREFIX.length)}`)
        let botResponses = "Placeholder Response";
        let response; 
        switch(cmd.toLowerCase()){
            case 'help':
                botResponses = ResponseType.HELP.RESPONSE;
                break;
            case 'io':
                if (args.length != 2) botResponses = ResponseType.ERR.RESPONSE;
                else {
                    response = await GetRaider(args[0], args[1], RaiderIOUrlBuilder);
                    if(response.status < 400){
                        const embedMessage = new MessageEmbed();
                        let thumbnail = response.data.thumbnail_url;
                        let ioScore = response.data.mythic_plus_scores_by_season[0].scores.all
                        let bestRun = response.data.mythic_plus_best_runs[0];
                        let recentRun = response.data.mythic_plus_recent_runs[0];
                        let profileURL = response.data.profile_url;
                        ResponseType.IO.RESPONSE(args[1].toUpperCase(), ioScore, recentRun, bestRun, profileURL, thumbnail, embedMessage)
                        botResponses = embedMessage;
                    } else botResponses = ResponseType.ERR.RESPONSE;
                }
                break; 
            case 'aotc':
                if(args.length !== 2) botResponses = ResponseType.ERR.RESPONSE;
                else {
                    response = await GetRaider(args[0], args[1], RaiderIOUrlBuilder);
                    if(response.status < 400) botResponses = ResponseType.AOTC.RESPONSE(args[1].toUpperCase(), response.data.raid_achievement_curve, RaiderIOUrlBuilder.currentRaid.split('-').join(" ").toUpperCase());
                    else botResponses = ResponseType.ERR.RESPONSE;
                }
                break;
            case 'affix':
                response = await GetAffix(RaiderIOUrlBuilder)
                let affixes = response.data.affix_details;
                botResponses = ResponseType.AFFIX.RESPONSE(affixes);
                break;
            case 'arena':
                if(args.length !== 3) botResponses = ResponseType.ERR.RESPONSE;
                else {
                    response = await GetArena(args[0],args[1],args[2],BnetUrlBuilder);
                    if(response.status < 400){
                        let rating = response.data.rating;
                        let season_stat = {
                            played: response.data.season_match_statistics.played,
                            wins: response.data.season_match_statistics.won,
                            lost: response.data.season_match_statistics.lost
                        }
                        let weekly_stat = {
                            played: response.data.weekly_match_statistics.played,
                            wins: response.data.weekly_match_statistics.won,
                            lost: response.data.weekly_match_statistics.lost
                        }
                        if(season_stat.played === 0) season_stat[`ratio`] = 0;
                        else { 
                            let ratio = season_stat.wins/season_stat.played
                            season_stat['ratio'] = ratio.toFixed(3) * 100;
                        }
                        if(weekly_stat.played === 0) weekly_stat[`ratio`] = 0;
                        else {
                            let ratio = weekly_stat.wins/weekly_stats.played;
                            weekly_stats['ratio'] = ratio.toFixed(3) * 100;
                        }
                        botResponses = ResponseType.ARENA.RESPONSE(rating, args[0], weekly_stat, season_stat, response.data.character.name)
                    }
                    else botResponses = ResponseType.ERR.RESPONSE;
                }
                break;
            case 'char':
                if(args.length !== 2) botResponses = ResponseType.ERR.RESPONSE;
                else {
                    response = await GetCharacter(args[0], args[1], BnetUrlBuilder);
                    if(response.status < 400) {
                        let AvatarResponse = await GetAvater(args[0], args[1], BnetUrlBuilder);
                        if (AvatarResponse.status < 400){
                            const embedMessage = new MessageEmbed();
                            ResponseType.CHAR.RESPONSE(response.data, AvatarResponse.data.assets[0].value, embedMessage);
                            botResponses = embedMessage;
                        } else botRespones = ResponseType.ERR.RESPONSE;
                    } else botResponses = ResponseType.ERR.RESPONSE;
                }
                break;
            case 'roll':
                if (args.length != 1) botResponses = ResponseType.ERR.RESPONSE;
                else {
                    deleteMessage(message);
                    let rollValue = Math.floor(Math.random() * args[0]) + 1;
                    botResponses = (ResponseType.ROLL.RESPONSE(message.author.username, rollValue, args[0]));
                }
                break;
            case 'item':
                if (args.length < 1) botResponses = ResponseType.ERR.RESPONSE;
                else {
                    let data = await RequestedItems(args, BnetUrlBuilder);
                    if(data.length > 0){
                        botResponses = ResponseType.ITEM.RESPONSE(data[0]);
                    } else {
                        botResponses = "```No item could be found```"
                    }
                }
                break;
            default:
                botResponses = ResponseType.ERR.RESPONSE;
        }
        try {
            if (botResponses.fields.length > 0) message.channel.send(botResponses);
        } catch {
            if(cmd === `item`){
                message.channel.send(botResponses);
                if(botResponses === "```No item could be found```"){
                    setTimeout(() => message.channel.bulkDelete(2), 1000);
                }
            }
            else message.channel.send("```" +botResponses + "```");
        }
        if(botResponses === ResponseType.ERR.RESPONSE){
            console.log(`ERROR: ${new Date().toLocaleString()} --- ${message.author.username} requested: ${message.content.trim().substring(PREFIX.length)}`)
            setTimeout(() => message.channel.bulkDelete(2), 1000);
        }
    }
})


client.login(_discordToken);
