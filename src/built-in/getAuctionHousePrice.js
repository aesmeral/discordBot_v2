
function itemPrice(auctionHouseData, itemID) {
    return auctionHouseData[itemID.id]; 
}


exports.GetItemPrice = itemPrice;