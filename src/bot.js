require('dotenv').config();
const { Passport } = require('./wowAPI/setup')
const pLimit = require("p-limit")
const { Client, MessageEmbed } = require('discord.js');
const { GetArena, GetCharacter, GetAvater } = require('./wowAPI/profiles');
const { ResponseType } = require('./util/cmdType');
const { GetRaider, GetAffix } = require('./rioAPI/requestData');
const { RequestedItems } = require('./built-in/getItem');
const { GenerateRealms, GetTokenPrice, GenerateAuction } = require('./wowAPI/gameData');
const { GetItemPrice } = require('./built-in/getAuctionHousePrice');

const client = new Client();
const PREFIX = "!"
const _discordToken = process.env.DISCORD_TOKEN;
const minutes = parseInt(process.env.IntervalTime);
// limit to 10 requests for auction house data to keep CPU and network traffic low. (instead of making 83 request at once)
const limit = pLimit(10);


var mappedRealms;               // cacheed 
var connectedRealmsID;          // cached this becasue its easier to init auction house data.
var auctionHouseData = {};      // want to cache auction house data for all realms


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

function deleteMessage(message) {
    message.delete({ timeout: 3000 })
        .then(console.log(`${new Date().toLocaleString()} --- ${message} successfully deleted`))
        .catch(console.error)
}

async function collectMappedRealms() {
    return await GenerateRealms(BnetUrlBuilder);
}

async function collectedAuctionData(connectedID) {
    auctionHouseData[connectedID] = await GenerateAuction(BnetUrlBuilder, connectedID);
}

// Implementation for classes ... { class: [spec] , ... } AND { spec: class, ... } <- assuming all spec is unique.

/*
      list of commands

      io {server} {character}                 <- returns raider io score, best dungeon run, and latest dungeon run (raider.io API)    -- completed
      aotc {server} {character}               <- returns aotc or not aotc                                          (raider.io API)    -- completed
      affix                                   <- tells you this week's affix for M+                                (raider.io API)    -- completed
      char {server} {character}               <- returns information on character                                  (Blizzard API)     -- completed    
      arena {bracket} {server} {character}    <- gets arena rating details                                         (Blizzard API)     -- completed
      roll {number}                           <- roll from 1 - {number}. if we're pugging this is helpful          (built in)         -- completed    

      itemPrice {server} {string}             <- gets auction house price from your server                         (built in)         -- completed
      item  {item string}                     <- provides a link (multiple if applicable) to your item             (Blizzard API)     -- completed
      token                                   <- provides current wow token price                                  (Blizzard API)     -- completed
      class {spec} {class}                    <- get a specific wowhead guide                                      (built-in)          
      class {class/spec}                      <- if given a class, provide multiple spec. if given a spec ^^       (built-in)
      help                                    <- display all the commands                                          (built in)         -- completed

      kanye                                   <- get a random quote from kanye (https://kanye.rest/)              (hidden-feature)    
  */


client.setInterval(async () => {
    console.log(`${new Date().toLocaleString()} --- Hourly Auction House Data update.`);
    let realmIDs = Array.from(connectedRealmsID);
    let actions = realmIDs.map(id => { return limit(() => collectedAuctionData(id)) });
    Promise.all(actions)
    console.log(`${new Date().toLocaleString()} --- Hourly Auction House Data update complete.`);
}, minutes * 60 * 1000);

client.on('ready', async () => {
    console.log(`${new Date().toLocaleString()} --- ${client.user.username} has logged in...`)
    // obtaining auth token for world of warcraft api
    await Passport(process.env.BnetID, process.env.BnetSecret)
        .then((response) => {
            BnetUrlBuilder['token'] = response.access_token;
            console.log(`${new Date().toLocaleString()} --- World of Warcraft API token configured...`)
        });
    // mapping realms to connected realms id.
    let realms = await collectMappedRealms();
    mappedRealms = realms.returnData;
    connectedRealmsID = realms.uniqueID;

    console.log(`${new Date().toLocaleString()} --- Realms have been mapped to connected realm ID`)
    console.log(`${new Date().toLocaleString()} --- Allocating Auction House Data between all connected realms`);
    // let actions = Array.from(connectedRealmsID).map(collectedAuctionData);
    // Promise.all(actions)
    let realmIDs = Array.from(connectedRealmsID);
    let actions = realmIDs.map(id => { return limit(() => collectedAuctionData(id)) });
    Promise.all(actions)
});

client.on('message', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(PREFIX)) {
        const [cmd, ...args] = message.content
            .trim()
            .substring(PREFIX.length)
            .split(" ");

        // commands start here 
        // TODO Refactor this code
        console.log(`${new Date().toLocaleString()} --- ${message.author.username} requested: ${message.content.trim().substring(PREFIX.length)}`)
        let botResponses = `PlaceHolder`;
        let response;
        let noRequest = false
        try {            // catch any errors I miss from within the switch statement to ensure availability.
            switch (cmd.toLowerCase()) {
                case 'help':
                    botResponses = ResponseType.HELP.RESPONSE;
                    break;
                case 'io':
                    if (args.length != 2) botResponses = ResponseType.ERR.RESPONSE;
                    else {
                        response = await GetRaider(args[0], args[1], RaiderIOUrlBuilder);
                        if (response.status < 400) {
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
                    if (args.length !== 2) botResponses = ResponseType.ERR.RESPONSE;
                    else {
                        response = await GetRaider(args[0], args[1], RaiderIOUrlBuilder);
                        if (response.status < 400) botResponses = ResponseType.AOTC.RESPONSE(args[1].toUpperCase(), response.data.raid_achievement_curve, RaiderIOUrlBuilder.currentRaid.split('-').join(" ").toUpperCase());
                        else botResponses = ResponseType.ERR.RESPONSE;
                    }
                    break;
                case 'affix':
                    response = await GetAffix(RaiderIOUrlBuilder);
                    if (response.status < 400) {
                        let affixes = response.data.affix_details;
                        botResponses = ResponseType.AFFIX.RESPONSE(affixes);
                    }
                    else botResponses = ResponseType.ERR.RESPONSE;
                    break;
                case 'arena':
                    if (args.length !== 3) botResponses = ResponseType.ERR.RESPONSE;
                    else {
                        response = await GetArena(args[0], args[1], args[2], BnetUrlBuilder);
                        if (response.status < 400) {
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
                            if (season_stat.played === 0) season_stat[`ratio`] = 0;
                            else {
                                let ratio = season_stat.wins / season_stat.played
                                season_stat['ratio'] = ratio.toFixed(3) * 100;
                            }
                            if (weekly_stat.played === 0) weekly_stat[`ratio`] = 0;
                            else {
                                let ratio = weekly_stat.wins / weekly_stats.played;
                                weekly_stats['ratio'] = ratio.toFixed(3) * 100;
                            }
                            botResponses = ResponseType.ARENA.RESPONSE(rating, args[0], weekly_stat, season_stat, response.data.character.name)
                        }
                        else botResponses = ResponseType.ERR.RESPONSE;
                    }
                    break;
                case 'char':
                    if (args.length !== 2) botResponses = ResponseType.ERR.RESPONSE;
                    else {
                        response = await GetCharacter(args[0], args[1], BnetUrlBuilder);
                        if (response.status < 400) {
                            let AvatarResponse = await GetAvater(args[0], args[1], BnetUrlBuilder);
                            if (AvatarResponse.status < 400) {
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
                        botResponses = ResponseType.ROLL.RESPONSE(message.author.username, rollValue, args[0]);
                    }
                    break;
                case 'item':
                    if (args.length < 1) botResponses = ResponseType.ERR.RESPONSE;
                    else {
                        let data = await RequestedItems(args, BnetUrlBuilder);
                        if (data.length > 0) {
                            botResponses = ResponseType.ITEM.RESPONSE(data[0]);
                        } else {
                            botResponses = "```No item could be found```";
                        }
                    }
                    break;
                case 'itemprice':
                    // args[0] = server, args[1] = item
                    if (args.length < 2) botResponses = ResponseType.ERR.RESPONSE;
                    else {
                        let data = await RequestedItems(args.slice(1), BnetUrlBuilder);
                        if (data.length > 0) {
                            let item = data[0];
                            let realmID = mappedRealms[args[0]];
                            let itemPrice = GetItemPrice(auctionHouseData[realmID], item);
                            if (itemPrice === undefined) botResponses = ResponseType.ITEMPRICE.SPECIALRESPONSE(item);
                            else botResponses = ResponseType.ITEMPRICE.RESPONSE(item, args[0], itemPrice);
                        } else {
                            botResponses = "```No item could be found```";
                        }
                    }
                    break;
                case 'token':
                    response = await GetTokenPrice(BnetUrlBuilder);
                    if (response.status < 400) {
                        let price = parseInt(response.data.price);
                        let lastUpdated = parseInt(response.data.last_updated_timestamp);
                        botResponses = ResponseType.TOKEN.RESPONSE(price, lastUpdated);
                    }
                    else {
                        botResponses = ResponseType.ERR.RESPONSE;
                    }
                    break;
                case 'realmcheck':
                    let realmID = mappedRealms[args[0]];
                    console.log(auctionHouseData[realmID]);
                    break;
                default:
                    noRequest = true;
                    break;
            }
            try {
                if (botResponses.fields.length > 0) message.channel.send(botResponses);
            } catch {
                if (cmd === `item`) {
                    message.channel.send(botResponses);
                    if (botResponses === "```No item could be found```") {
                        setTimeout(() => message.channel.bulkDelete(2), 1000);
                    }
                }
                else if (noRequest == false) message.channel.send("```" + botResponses + "```");
            }
        } catch {
            botResponses = ResponseType.ERR.RESPONSE
            message.channel.send("```" + botResponses + "```");
        }
        if (botResponses === ResponseType.ERR.RESPONSE) {
            console.log(`ERROR: ${new Date().toLocaleString()} --- ${message.author.username} requested: ${message.content.trim().substring(PREFIX.length)}`)
            setTimeout(() => message.channel.bulkDelete(2), 1000);
        }
    }
})

console.log("testing -- main")
client.login(_discordToken);
console.log("Im from working")
client.login(_discordToken);
