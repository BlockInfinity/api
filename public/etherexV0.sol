pragma solidity ^0.4.2;

// the contract version which is currently deployed
contract etherexV0 {

    // ########################## Variables for user management  #########################################################

    // users' money balances
    mapping(uint256 => int256) colleteral;
    mapping(address => uint256) identities;
    // 1: CA, 2: producer, 3: consumer  
    uint256[] userType;
    uint256 currentUserId;
    uint256 numUsers;

    // ########################## Variables for state/period management  ##################################################

    uint256 currentPeriod;
    uint8 currState;
    uint256 startBlock;

    function getStartBlock() constant returns(uint256){
        return startBlock;
    }
    // ########################## Variables for saveorder function  #######################################################

    struct Order {
        uint256 id;
        uint256 next;
        address owner;
        uint256 volume;
        int256 price;
    }

    struct ReserveOrder {
        uint256 id;
        uint256 next;
        uint256 volume;
    }

    // contains all orders 
    Order[] orders;

    // pointers to the best prices 
    uint256 minAsk;
    uint256 maxBid;
    uint256 orderIdCounter;

    // ########################## Variables for matching function  ########################################################  

    mapping(uint256 => mapping(address => uint256)) matchedAskOrders;
    mapping(uint256 => mapping(address => uint256)) matchedBidOrders;
    mapping(uint256 => int256) matchingPrices;
    uint256[] currMatchedAskOrderMapping;
    uint256[] currmatchedBidOrders;

    // ########################## Variables for reserve function  ########################################################

    uint256 MIN_RESERVE_ASK_VOLUME = 1000;  
    uint256 MIN_RESERVE_BID_VOLUME = 1000; 
    mapping (uint256 => mapping (address =>  uint256)) public matchedAskReserveOrders;   // maps volume to currentPeriod and owner
    mapping (uint256 => mapping (address =>  uint256)) public matchedBidReserveOrders;   // maps volume to currentPeriod and owner
    mapping (uint256 => int256) public askReservePrices;                        // maps reserveprice to currentPeriod
    mapping (uint256 => int256) public bidReservePrices;

    // ########################## Variables for settle function  #########################################################

    struct SettleUserData {
        address user;
        uint256 smVolume;
    }
    struct settleData{
        mapping(address => bool) alreadySettled;
        uint256 settleCounter;
        uint256 sumProduced;
        uint256 sumConsumed;
        uint256 excess;
        uint256 lack;
        SettleUserData[] askSmData;
        SettleUserData[] bidSmData;
    }
    mapping(uint256 => settleData) public settleMapping;


    // ###################################################################################################################
    // ########################## Access Modifiers #######################################################################
    // ###################################################################################################################

    // todo modifiers do not work as expected
    modifier onlyCertificateAuthorities() {
        if (userType[identities[msg.sender]] != 0 ) throw;
        _;
    }
    modifier onlyProducers() {
        if (userType[identities[msg.sender]] != 2 ) throw;
        _;
    }
    modifier onlyConsumers() {
        if (userType[identities[msg.sender]] != 1 ) throw;
        _;
    }
    modifier onlyUsers() {
        if (userType[identities[msg.sender]] != 1 && userType[identities[msg.sender]] != 2 ) throw;
        _;
    }


    // ###################################################################################################################
    // ########################## Constructor ############################################################################
    // ###################################################################################################################

    function Etherex() {
        currentUserId = 0;
        numUsers = 0;
        currentPeriod = 0;
        startBlock = block.number;
        currState = 0;
        minAsk = 0;
        maxBid = 0;
        Order memory blankOrder = Order(0, 0, 0, 0, 0);
        orders.push(blankOrder);
        orderIdCounter = 1;
    }


    // ###################################################################################################################
    // ########################## Registration  ##########################################################################
    // ###################################################################################################################

    // todo (mg) should only be callable by creator of contract
    function registerCertificateAuthority(address _user) {
        identities[_user] = currentUserId++;
        userType.push(0);
    }

    function registerProducer(address _user) onlyCertificateAuthorities() {
        identities[_user] = currentUserId++;
        userType.push(2);
        numUsers++;
    }

    function registerConsumer(address _user) onlyCertificateAuthorities() {
        identities[_user] = currentUserId++;
        userType.push(1);
        numUsers++;
    }


    // ###################################################################################################################
    // ########################## state management  ######################################################################
    // ###################################################################################################################

    function init() /*internal*/ {
        currState = 0;
        minAsk = 0;
        maxBid = 0;
        // reset orders
        delete orders;
        Order memory blankOrder = Order(0, 0, 0, 0, 0);
        orders.push(blankOrder); // insert blanko order into orders because idx=0 is a placeholder
        orderIdCounter = 1;
        // increment period
        currentPeriod++;
        // update start block
        startBlock = block.number;
    }

    
    event StateChangedEvent(uint8 _state);
    /*
        Should be called in every block, called directly from modifier onlyInState.
        Every third of period lasts for 25 blocks. The period is updated at the 75. block.
        On the beginning of the 2/3 of the period is matching called.
    */
    modifier updateState()  {
        /*
            Update state based on current block, no need for 1/3 currentPeriod condition because
            it is covered with the other 3
        */
        if(currState == 0 && ((block.number - startBlock) >= 5 && (block.number - startBlock) < 10)) {
            //Matching should start
            matching();
            minAsk = 0;
            maxBid = 0;
            // move on to state 1
            currState = 1;
            StateChangedEvent(1);
          
        } else if (currState == 1 && ((block.number - startBlock) >= 10)){
            //3/3 of the currentPeriod
            determineReserveAskPrice();
            determineReserveBidPrice();
            init();
            currState = 0;
            StateChangedEvent(0);

        } else if (currState == 0 && ((block.number - startBlock) > 30)) {  // sometimes this situation happens and needs to be dealt with, dunno why
            init();    
            StateChangedEvent(0);
        }
        _;
    }

    // test functions 
 
    function testUpdateState() updateState() {
        
    }

    function getCollateral(address _owner) constant returns(int256) {
        uint256 userId = identities[_owner];
        return colleteral[userId];
    }


    function getCurrState() constant returns(uint8){
        return currState;
    }

    function getCurrPeriod() constant returns(uint256){
        return currentPeriod;
    }

    function getMatchingPrice(uint256 _period) constant returns(int256) {
        return matchingPrices[_period];
    }

    function isMatchedForBidReserve(address _user,uint256 _period) constant returns (bool){
        if (matchedBidReserveOrders[_period][_user] != 0){
            return true;
        } else {
            return false;
        }
    }

    function isMatchedForAskReserve(address _user,uint256 _period) constant returns (bool){
        if (matchedAskReserveOrders[_period][_user] != 0){
            return true;
        } else {
            return false;
        }
    }


    function getSumOfColleteral() constant returns(int256) {
        int256 sum = 0;
        for (uint256 i=0; i<numUsers; i++) {
            sum += colleteral[i];
        }
        return sum;
    }


    // ###################################################################################################################
    // ########################## user interface  #########################################################################
    // ###################################################################################################################

    event OrderEvent(bytes32 _type, int256 _price, uint256 _volume);

    function submitBid(int256 _price, uint256 _volume) updateState() onlyConsumers() {
        saveOrder("BID", _price, _volume);
        OrderEvent("BID", _price, _volume);
    }

    function submitAsk(int256 _price, uint256 _volume) updateState() onlyProducers() {
        saveOrder("ASK", _price, _volume);
        OrderEvent("ASK", _price, _volume);
    } 


    // ###################################################################################################################
    // ########################## CORE LOGIC  ############################################################################
    // ###################################################################################################################
    

    function saveOrder(bytes32 _type, int256 _price, uint256 _volume) internal {
        if (!(_type == "ASK" || _type == "BID")) {
            throw;
        }
        if (_volume == 0) {
            throw;
        }

        // allocate new order
        Order memory currOrder = Order(orderIdCounter++, 0, msg.sender, _volume, _price);
 
        // store maxBid or minAsk
        uint256 bestOrder;

        // type = ask -> ascending
        // type = bid -> descending
        int8 ascending = 0;

        if (_type == "ASK") {
            bestOrder = minAsk;
            ascending = 1;  
        } else if (_type == "BID") {
            bestOrder = maxBid;
            ascending = -1;
        } else {
            throw;
        }

        // save and return if this the first bid
        if (bestOrder == 0) {
            orders.push(currOrder);
            bestOrder = currOrder.id;
            
        } else {
            // iterate over list till same price encountered
            uint256 curr = bestOrder;
            uint256 prev = 0;
            while ((ascending * currOrder.price) > (ascending * orders[curr].price) && curr != 0) {
                prev = curr;
                curr = orders[curr].next;
            }

            // update pointer 
            currOrder.next = curr;
    
            // insert order
            orders.push(currOrder);
    
            // curr_order added at the end
            if (currOrder.next == bestOrder) {
                bestOrder = currOrder.id;
                
            // at least one prev order exists
            } else {
                orders[prev].next = currOrder.id;
            }
        }
        
        // update maxBid or minAsk
        if (_type == "ASK") {
            minAsk = bestOrder;      
        } else if (_type == "BID") {
            maxBid = bestOrder;        
        }
    }

    // match bid and ask orders 
    // todo (mg) needs to be internal
    function matching() returns(bool) {
        // no orders submitted at all or at least one ask and bid missing
        // return if no orders or no match possible since minAsk greater than maxBid
        if (orders.length == 1) {
            matchingPrices[currentPeriod] = 2**128-1;
            return true;
        }
        if (minAsk == 0 || maxBid == 0 || (orders[minAsk].price > orders[maxBid].price)) {
            matchingPrices[currentPeriod] = 2**128-1;
            return true;
        }

        uint256 cumAskVol = 0;
        uint256 cumBidVol = 0;

        int256 matchingPrice = orders[minAsk].price;
        bool isMatched = false;
        bool outOfAskOrders = false;

        uint256 currAsk = minAsk;
        uint256 currBid = maxBid;

        uint256 next;

        delete currMatchedAskOrderMapping;
        delete currmatchedBidOrders;

        while (!isMatched) {
            // cumulates ask volume for fixed price level
            // Todo(ms): Optimize: Precompute cumulated volume for orders with same same price,
            // then use here instead of iterating over it
            while (currAsk != 0 && orders[currAsk].price == matchingPrice) {
                cumAskVol += orders[currAsk].volume;
                currMatchedAskOrderMapping.push(orders[currAsk].id);
                next = orders[currAsk].next;
                if (next != 0) {
                    currAsk = next;
                } else {
                    outOfAskOrders = true;
                    break;
                }
            }

            // cumulates ask volume for order price greater then or equal to matching price
            // Todo(ms): Optimize: Precompute cumulated volume for orders with same same price,
            // then use here instead of iterating over it
            while (orders[currBid].price >= matchingPrice) {
                cumBidVol += orders[currBid].volume;
                currmatchedBidOrders.push(orders[currBid].id);
                currBid = orders[currBid].next;
                if (currBid == 0) {
                    break;
                }
            }

            // enough ask volume sufficient to satisfy bids or no more asks left at all
            if (cumAskVol >= cumBidVol || outOfAskOrders) {
                isMatched = true;
                // set the matching price
                matchingPrices[currentPeriod] = matchingPrice;
            // need another iteration, get more ask volume, also increase matching price
            } else {
                matchingPrice = orders[currAsk].price;
                currBid = maxBid;
                cumBidVol = 0;
                // Todo(ms): do not delete, just traverse in reverse order and reuse existing array
                delete currmatchedBidOrders;
            }
        }

        // calculates how much volume each producer can release into 
        // the grid within the next interval
        if (cumBidVol < cumAskVol) {
            for (uint256 i=0; i<currMatchedAskOrderMapping.length; i++) {

                matchedAskOrders[currentPeriod][orders[currMatchedAskOrderMapping[i]].owner] 
                = (cumBidVol * orders[currMatchedAskOrderMapping[i]].volume) / cumAskVol;
            }
            for (uint256 ii=0; ii<currmatchedBidOrders.length; ii++) {
                matchedBidOrders[currentPeriod][orders[currmatchedBidOrders[ii]].owner] 
                = orders[currmatchedBidOrders[ii]].volume;
            }
        } else {
            for (uint256 j=0; j<currmatchedBidOrders.length; j++) {
                matchedBidOrders[currentPeriod][orders[currmatchedBidOrders[j]].owner] 
                = (cumAskVol * orders[currmatchedBidOrders[j]].volume) / cumBidVol;
            }
            for (uint256 jj=0; jj<currMatchedAskOrderMapping.length; jj++) {
                matchedAskOrders[currentPeriod][orders[currMatchedAskOrderMapping[jj]].owner] 
                = orders[currMatchedAskOrderMapping[jj]].volume;
            }
        }

        return true;
    }
    
    event reservePriceEvent(bytes32 _type, int256 _price);

    // determines price till volume of MIN_RESERVE_ASK_VOLUME is accumulated  
    function determineReserveBidPrice() internal returns(bool) {
        if (maxBid == 0) {
            bidReservePrices[currentPeriod] = 2**128-1;
            return false;
        }
        uint256 cumBidReserveVol = 0;
        int256 reserveBidPrice = orders[maxBid].price;
        bool isFound = false;
        uint256 bidIterId = maxBid;

        while (!isFound) {
            while (orders[bidIterId].price == reserveBidPrice) {
                uint256 volume = orders[bidIterId].volume;
                address owner = orders[bidIterId].owner;

                cumBidReserveVol += volume;
                matchedBidReserveOrders[currentPeriod][owner] = volume;

                uint256 nextOrder = orders[bidIterId].next;

                if (nextOrder != 0) {
                    bidIterId = nextOrder;
                } else {
                    isFound = true;
                    break;
                }
            }

            if (cumBidReserveVol >= MIN_RESERVE_BID_VOLUME) {
                isFound = true;
            } else {
                reserveBidPrice = orders[bidIterId].price;
            }
        }
        bidReservePrices[currentPeriod] = reserveBidPrice;
        reservePriceEvent("Bid",reserveBidPrice);
        return true;
    }

    // determines price till volume of MIN_RESERVE_BID_VOLUME is accumulated  
    function determineReserveAskPrice() internal returns(bool) {
        if (minAsk == 0) {
            askReservePrices[currentPeriod] = 2**128-1;
            return false;
        }
        uint256 cumAskReserveVol = 0;
        int256 reserveAskPrice = orders[minAsk].price;
        bool isFound = false;
        uint256 ask_id_iter = minAsk;

        while (!isFound) {
            while (orders[ask_id_iter].price == reserveAskPrice) {
                uint256 volume = orders[ask_id_iter].volume;     // redundant, aber übersichtlicher
                address owner = orders[ask_id_iter].owner;

                cumAskReserveVol += volume;
                matchedAskReserveOrders[currentPeriod][owner] = volume;

                uint256 next_order = orders[ask_id_iter].next;
                if (next_order != 0) {
                    ask_id_iter = next_order;
                } else {
                    isFound = true;
                    break;     // Mindestmenge an Energie konnten nicht erreicht werden, da selbst beim höchsten Preis nicht ausreichend Energie vorhanden war
                }
            }

            if (cumAskReserveVol >= MIN_RESERVE_ASK_VOLUME) {
              isFound = true;            
              }  else {
              reserveAskPrice = orders[ask_id_iter].price;
            }        
        }
        askReservePrices[currentPeriod] = reserveAskPrice; 
        reservePriceEvent("Ask",reserveAskPrice);
        return true;     
    }

    event SettleEvent(int8 _type, uint256 _usedVolume, uint256 _orderedVolume, address _user);
    // todo (mg) function needs to be called by smart meters instead of users
    function settle( int8 _type, uint256 _volume, uint256 _period, address _user) updateState() onlyCertificateAuthorities() {

        // currentPeriod needs to be greater than the _period that should be settled 
        if (!(currentPeriod > _period)) {
            return;    
        }

        // smart meter has already sent data for this particular user
        if (settleMapping[_period].alreadySettled[_user]) {
            return;
        }

        // increment settle counter
        settleMapping[_period].settleCounter += 1;

        // for debug purposes not defined here
        uint256 ordered = 0;
        uint256 offered = 0;
        uint256 diff = 0;
        uint256 userId = identities[_user];
    
        // producer 
        if (_type == 1) {
            // case 1: reserve ask guy
            if (matchedAskReserveOrders[_period][_user] != 0) {          // TODO: matchedReserveOrders needs to be splitted in matchedAskReserveOrders and matchedBidReserveOrders
                // Smart Meter Daten werden vorerst gespeichert für die spätere Abrechnung in der endSettle Funktion
                settleMapping[_period].askSmData.push(SettleUserData(_user,_volume));
                settleMapping[_period].sumProduced += _volume; 
    
            // case 2: normal ask order guy
            } else if (matchedAskOrders[_period][_user] != 0) {
                offered = matchedAskOrders[_period][_user];

                SettleEvent(_type, _volume, offered , _user);

                 // _user hat zu wenig Strom eingespeist
                if (_volume < offered) {
                      // für den eingespeisten Strom bekommt er den matching preis bezahlt
                    colleteral[userId] += int256(_volume) * matchingPrices[_period];
                    // die Differenzt muss er nachkaufen für den teuren reserveAskPrice
                    diff = offered - _volume;
                    colleteral[userId] -= (int256(diff) * askReservePrices[_period]);
                    // rechnerisch ist nun -diff strom zu wenig im netz
                    settleMapping[_period].lack += diff; 

                } else if (_volume > offered) {
                    // Für das Ordervolumen bekommt er den matchingpreis bezahlt
                    colleteral[userId] += int256(offered) * matchingPrices[_period];
                    // Für die Differenz bekommt er den niedrigen reserveBidPrice bezahlt
                    diff = _volume - offered;
                    colleteral[userId] += int256(diff) * bidReservePrices[_period];
                    // rechnerisch ist diff strom zu viel im Netz
                    settleMapping[_period].excess += diff;

    
                    // _user hat genau so viel strom eingepeist wie abgemacht
                } else {
                    colleteral[userId] += int256(_volume) * matchingPrices[_period];
                }

                // Volumen was von den normalen _usern erzeugt wurde
                settleMapping[_period].sumProduced += _volume;
    

            // case 3: no order emitted
            } else {
                // track collaterial
                colleteral[userId] += int256(_volume) * bidReservePrices[_period];
                // track excess
                settleMapping[_period].excess += _volume;
                // volumen was von den normalen _usern erzeugt wurde
                settleMapping[_period].sumProduced += _volume;
            }
        }
    
        // consumer
        if (_type == 2) {
            // case 1: reserve bid guy
            if (matchedBidReserveOrders[_period][_user] != 0) {
                // smart meter daten werden vorerst gespeichert für die spätere Abrechnung in der endSettle Funktion
                ordered = matchedBidReserveOrders[_period][_user];
                // process later
                settleMapping[_period].bidSmData.push(SettleUserData(_user, _volume));
                // Volumen was von den reserve Leute vom Netz genommen wurde, weil zu viel Strom vorhanden war
                settleMapping[_period].sumConsumed += _volume; 
              
            // case 2: normal bid order guy 
            } else if (matchedBidOrders[_period][_user] != 0) {
                ordered = matchedBidOrders[_period][_user];

                SettleEvent(_type, _volume, ordered , _user);

                // user hat zu viel Strom verbraucht
                if (_volume > ordered) {
                    // das Ordervolumen kann noch zum matching price bezahlt werden
                    colleteral[userId] -= int256(ordered) * matchingPrices[_period];
                    // die Differenz muss für den höheren reserveAskPrice bezahlt werden
                    diff = _volume - ordered;
                    colleteral[userId] -= (int256(diff) * askReservePrices[_period]);
                    // rechnerisch ist nun -diff Strom zu wenig im Netz
                    settleMapping[_period].lack += diff; 
    
                // user hat zu wenig Strom verbraucht
                } else if (_volume < ordered) {
                    // das Ordervolumen muss bezahlt werden für den matching price
                    colleteral[userId] -= (int256(ordered) * matchingPrices[_period]);
                    // die differenz kann für den schlechten reserveBidPrice verkauft werden
                    diff = ordered - _volume;
                    colleteral[userId] += (int256(diff) * bidReservePrices[_period]);
                    // recherisch ist nun +diff zu viel Strom im Netz
                    settleMapping[_period].excess += diff;
    
                // user hat genau so viel verbraucht wie zuvor vereinbart
                } else {
                    colleteral[userId] -= (int256(_volume) * matchingPrices[_period]);
                }
                // was die normalen user verbaucht haben
                settleMapping[_period].sumConsumed += _volume;
                // wird auf undefined gesetzt damit selbiger user nicht nochmals settlen kann

            // case 3: No Order emitted
            } else {
                // track collaterial
                colleteral[userId] -= (int256(_volume) * askReservePrices[_period]);
                // track lack
                settleMapping[_period].lack += _volume;
                // volumen was die normalen usern verbraucht haben
                settleMapping[_period].sumConsumed += _volume;
            }
        }
    
        // set user as settled for currentPeriod
        settleMapping[_period].alreadySettled[_user] = true;

        // todo: endSettle Funktion muss beim Eingang des letzten smart meter datensatzes automatisch ausgeführt werden
        if (settleMapping[_period].settleCounter == numUsers) {
            endSettle(_period);
        }  
        
    }

  
   event EndSettleEvent(uint256 _period);

    function endSettle(uint256 _period) internal {
        int256 diff = int256(settleMapping[_period].excess) - int256(settleMapping[_period].lack);
        int256 smVolume = 0;
        address user;
        uint256 userId;
        int256 shareOfEachUser; 
        
        if (diff >= 0) {
            for (uint256 i = 0; i<settleMapping[_period].bidSmData.length; i++) {   
                smVolume = int256(settleMapping[_period].bidSmData[i].smVolume);
                if (smVolume == 0) continue;
                user = settleMapping[_period].bidSmData[i].user;
                userId = identities[user];
                if (smVolume <= diff) {
                    colleteral[userId] -= smVolume * bidReservePrices[_period];
                    diff -= smVolume;
                } else {
                    colleteral[userId] -= diff * bidReservePrices[_period];
                    colleteral[userId] -= (smVolume - diff) * askReservePrices[_period];
                    diff = 0;
                }
            }
        }
    
        smVolume = 0;
        
        if (diff < 0) {
            diff = -1 * diff;
            for (uint256 j = 0;j<settleMapping[_period].askSmData.length;j++) {           
                    smVolume = int256(settleMapping[_period].askSmData[j].smVolume);
                    if (smVolume == 0) continue;
                    user = settleMapping[_period].askSmData[j].user;
                    userId = identities[user];
                    if (smVolume <= diff) {
                        colleteral[userId] += smVolume * askReservePrices[_period];
                        diff -= smVolume;
                    } else {
                        colleteral[userId] += diff * askReservePrices[_period];
                        colleteral[userId] += (smVolume - diff) * bidReservePrices[_period];
                        diff = 0;
                    }
            }
        }
    
        int256 moneyLeft = 0;
        for (uint256 k=0; k<numUsers; k++) {
            moneyLeft += colleteral[k];   
        }
        shareOfEachUser = moneyLeft / int256(numUsers);
        shareOfEachUser = shareOfEachUser * -1;
        
        for (uint256 l=0; l<numUsers; l++) {  
            colleteral[l] += shareOfEachUser;     
        }

        EndSettleEvent(_period);
    }


    // ###################################################################################################################
    // ########################## Constant Functions  ####################################################################
    // ###################################################################################################################

    int256[] bidQuotes;
    uint256[] bidAmounts;
    function getBidOrders() constant returns (int256[] rv1, uint256[] rv2) {
        uint256 id_iter_bid = maxBid;
        bidQuotes = rv1;
        bidAmounts = rv2;
        while (orders[id_iter_bid].volume != 0) {
            bidAmounts.push(orders[id_iter_bid].volume);
            bidQuotes.push(orders[id_iter_bid].price);
            id_iter_bid = orders[id_iter_bid].next;
        }
        return (bidQuotes, bidAmounts);
    }


    int256[] askQuotes;
    uint256[] askAmounts;
    function getAskOrders() constant returns (int256[] rv1, uint256[] rv2) {
        uint256 id_iter_ask = minAsk;
        askQuotes = rv1;
        askAmounts = rv2;
        while (orders[id_iter_ask].volume != 0) {
            askQuotes.push(orders[id_iter_ask].price);
            askAmounts.push(orders[id_iter_ask].volume);
            id_iter_ask = orders[id_iter_ask].next;
        }
        return (askQuotes, askAmounts);
    }

}
    