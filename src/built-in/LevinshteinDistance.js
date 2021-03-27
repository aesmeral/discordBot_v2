// reference = https://www.datacamp.com/community/tutorials/fuzzy-string-python

function levenshteinDistanceRatio(str1, str2){
    const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));

    for(let i = 0; i <= str1.length; i += 1) track[0][i] = i;
    for(let j = 0; j <= str2.length; j += 1 ) track[j][0] = j;
    
    
    for(let j = 1; j <= str2.length; j+=1){
        for(let i = 1; i <= str1.length; i += 1){
            const indicator = str1[i-1] === str2[j - 1] ? 0 : 1;            // using 2 because we want to find ratio, not distance; if using distance we use 1.
            track[j][i] = Math.min(
                track[j][i-1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator,
            );
        }
    }
    return ((str2.length + str1.length) - track[str2.length][str1.length]) / (str2.length + str1.length);
}

exports.NearMatchRatio = levenshteinDistanceRatio;

