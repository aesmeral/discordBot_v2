
// minimize as much coding as possible.
// the main point of this file and enum is to produce responses that the robot will respond with.

const responseType = Object.freeze({
    ERR: {
        ID: -1,
        RESPONSE: "There was an error while processing your request." 
    },
    HELP: {
        ID: 0,
        RESPONSE: "1.io {server} {character}: Retrieves characters raiderio score, best timed dungeon, and recent run dungeon.\n" +
                  "2.aotc {server} {character}: Proivdes information if the character has obtained AOTC.\n" +
                  "3.affix: Retrieves this week's affixes.\n" + 
                  "4.char {server} {character}: Provides information of the character such as ilvl, class, race, gender.\n" +
                  "5.arena {bracket} {server} {character}: Provides information on the characters arena rating, weekly, and season statistics in the specific bracket.\n" + 
                  "6.item {item name}: Provides the best matches to requested item name and output's wowhead link for more information.\n" +
                  "7.itemprice {server} {item name}: Provides the price of the item requested on a specific server. (NOT IMPLEMENTED YET)\n" +
                  "8.class {spec} {class}: provides a wowhead guide for your class and spec\n" +
                  "9.roll {number}: Roll from 1 to n.\n\n" +
                  "Example Request: !io tichondrius qaintwo" 
    },   
    IO: {
        ID: 1,
        RESPONSE: (character, ioScore, recentRun, bestRun, profileURL, thumbnail, embedMessage) => {
                    embedMessage.setTitle(`${character} Raider IO Profile`);
                    embedMessage.setURL(`${profileURL}`);
                    embedMessage.setDescription(`Character Breakdown`);
                    embedMessage.setThumbnail(`${thumbnail}`);
                    embedMessage.addFields(
                        { name: 'Raider IO Score: ', value : `${ioScore}`},
                        { name: 'Recent Run', value : `Mythic ${recentRun.mythic_level} ${recentRun.short_name}`, inline: true },
                        { name: 'Best Run', value: `Mythic ${bestRun.mythic_level} ${bestRun.short_name}`, inline: true }
                    )
        }
    },
    AOTC: {
        ID: 2,
        RESPONSE: (character, aotcData, raid) => {
            if (aotcData.length !== 0) {
                return `${character} has Ahead of The Curve for ${raid}.`
            } else {
                return `${character} does not have Ahead of The Curve for ${raid}.`
            }
        }
    },
    AFFIX: {
        ID: 3,
        RESPONSE: (affixData) => {
            let stringBuilder = ``;
            for(let key in affixData){
                stringBuilder += `${affixData[key].name}: ${affixData[key].description}\n`;
            }
            return stringBuilder
        }
    },
    CHAR: {
        ID: 4,
        RESPONSE: (data, avatarData,  embedMessage) => {
            embedMessage.setTitle(`${data.name} Character Breakdown`);
            embedMessage.setURL(`https://worldofwarcraft.com/en-us/character/us/${data.realm.name}/${data.name}`);              // current only supports en-us. 
            embedMessage.setDescription(`Character Stat Sheet`);
            embedMessage.setThumbnail(`${avatarData}`)
            embedMessage.addFields(
                {name: `Guild`, value: `${data.guild.name}`},
                {name: 'Equipped/Average ilvl', value : `${data.equipped_item_level}/${data.average_item_level}`},
                {name: `Class`, value : `${data.character_class.name}`, inline: true},
                {name: `Active Spec`, value : `${data.active_spec.name}`, inline: true},
                {name: `Covenant`, value : `${data.covenant_progress.chosen_covenant.name}`, inline: true}
            )
        } 
    },
    ARENA: {
        ID: 5,
        RESPONSE: (rating, bracket, dataWeek, dataSeason, characterName) => {
            return  `${characterName} ${bracket} Statistics\n\n` +
                    `Rating: ${rating}\n` +
                    `Weekly Statistics: ${dataWeek.wins}-${dataWeek.lost} -- ${dataWeek.ratio}% Win Rate\n` +
                    `Season Statistics: ${dataSeason.wins}-${dataSeason.lost} -- ${dataSeason.ratio}% Win Rate`
        } 
    },
    ITEM: {
        ID: 6,
        RESPONSE: (item) => {
            let stringBuilder = `Heres what I can find -- https://www.wowhead.com/item=${item.id}`;
            return stringBuilder;
        }
    },
    ITEMPRICE: {
        ID: 7,
        RESPONSE: "PLACEHOLDER"
    },
    ROLL: {
        ID: 8,
        RESPONSE: (author, value, maxValue) => {return `${author} rolls a ${value} (1-${maxValue}).`}
    },
})

exports.ResponseType = responseType;