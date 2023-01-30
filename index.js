import {getDatabase,ref,set,child,get,onValue,remove} from 'firebase/database'
import express from 'express'
import bodyParser from 'body-parser'
import fbApp from './firebase-config.js'
import {getUser,getRandom,getRandomName} from './randomCode.js'
import _ from 'lodash'
import path from 'path'
import {fileURLToPath} from 'url'

// gameCode => game code
// playerId => player Id
const database = getDatabase(fbApp);

const PORT = process.env.PORT || 3001;

const gameCodeLen = 7;
const playerIDLen = 5;
const maxRemovalTimeOut = 600000;
const completedGameRemoveTimeout = 120000;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

//  activeGames -> an object which keeps active games information. Mainly if updateIsObserverd
// {
//     gameCode : {
//         snapshot : {
//             Players : {}
//         }
//         updateObserved : true/false,
//         winner : playerId / undefined,
//         deleteCode : mainTimerDelete,
//         completed : false / true
//     }
// }

// Cleanup ==>
//      Delete games after 5 min
//      When server starts clear the database
//      After game is complete delete game within 2 minutes

// also keep latest game snapshot val
let activeGames = {};

const clearDatabase = async () => {
    await remove(child(ref(getDatabase()),"Games/")).then(() => console.log("Reset complete !"));
}

const clearGame = async (gameCode) => {
    await remove(child(ref(getDatabase()),"Games/"+gameCode)).then(() => console.log(`Game ${gameCode} completed !`));
    activeGames[gameCode] = undefined;
}

const verifyGameCode = async (gameCode) => {
    const dbref = ref(getDatabase());
    let result = false;
    await get(child(dbref,"Games/")).then((snapshot) => {
        if(snapshot.exists()){
            const games = snapshot.val();
            if(Object.keys(games).indexOf(gameCode) != -1){
                result = true;
            }
        }
    });
    return result;
}

app.post("/api/getIp",(req,res) => {
    console.log(req.socket.remoteAddress);
    res.json({resp : true});
});

app.route("/api/newGame")
.post(async (req,res) => {
    let dbref = ref(getDatabase());
    let gameCode = getRandom(gameCodeLen);
    const player = await getUser(playerIDLen);

    // Set game code which doesn't exist in database
    get(child(dbref,"Games/")).then((snapshot) => {
        if(snapshot.exists()){
            while(Object.keys(snapshot.val()).indexOf(gameCode) != -1){
                gameCode = getRandom(gameCodeLen);
            }
        }else{
            console.log("No data available !");
        }
    }).catch((err) => {
        console.log(err);
    });

    // Set game properties with current playerId
    set(ref(database,"Games/"+gameCode+"/Players/"+player.playerID),{
        Selection : -1,
        name : player.name
    });

    // Set local game object keeping track of active games
    const deleteGameCode = setTimeout(async () => {
        await clearGame(gameCode);
    },maxRemovalTimeOut);
    
    activeGames[gameCode] ={
         won : undefined,
         deleteCode : deleteGameCode,
         completed : false,
         maxCount : +req.body.playerCount
    };
    console.log(activeGames);
    // Set onUpdate method for this active game
    dbref = ref(getDatabase(),"Games/"+gameCode); // Reference to players of game
    onValue(dbref,async (snapshot) => {
        console.log(`Update ${gameCode} !`);
        if(snapshot.exists()){
            let ready = true;
            for(let p of Object.keys(snapshot.val().Players)){
                if(snapshot.val().Players[p].Selection === -1) ready = false;
            }
            if(Object.keys(snapshot.val().Players).length !== activeGames[gameCode].maxCount) ready = false;
            if(ready){
                set(ref(database,"Games/"+gameCode),{
                    Players : snapshot.val().Players,
                    ready : true
                });
                snapshot = await get(dbref);
                activeGames[gameCode].completed = true;
                
                // Set 2min timeout to delete this game !
                setTimeout(() => {
                    if(activeGames[gameCode] != undefined){
                        clearTimeout(activeGames[gameCode].deleteCode);
                        clearGame(gameCode);
                    }
                },completedGameRemoveTimeout);
                console.log("ready !");
            }
            activeGames[gameCode]["snapshot"] = snapshot.val();
            activeGames[gameCode]["updateObserved"] = true;
            console.log(activeGames[gameCode].snapshot);
        }
    });
    let gameResponse = {
        gameCode : gameCode,
        playerId : player.playerID,
        name : player.name,
        count : activeGames[gameCode].maxCount
    }
    res.json(gameResponse);
})

app.route("/api/joinGame")
.post((req,res) => {
    let dbref = ref(getDatabase());
    get(child(dbref,"Games/")).then(async (snapshot) => {
        if(snapshot.exists()){
            let games = snapshot.val();
            if(Object.keys(games).indexOf(req.body.gameCode) != -1){    
                let players = games[req.body.gameCode].Players;
                if(Object.keys(players).length == +activeGames[req.body.gameCode].maxCount){
                    res.json({resp : false,message : "Game players limit reached !"});
                }else{
                    // let playerId = getRandom(playerIDLen);
                    let player = await getUser(playerIDLen);
                    while(_.find(players,(p) => p.name == player.name) != undefined){
                        player = await getUser(playerIDLen);
                    }
                    set(ref(database,"Games/"+req.body.gameCode+"/Players/"+player.playerID),{
                        Selection : -1,
                        name : player.name
                    })
                    res.json({
                        resp : true,
                        gameCode : req.body.gameCode,
                        playerId : player.playerID,
                        name : player.name
                    });
                }
            }else{
                res.json({resp : false,message : "No live game found !"});
            }
        }
    });
});

app.route("/api/updates/:gameCode")
.get(async (req,res) => {

    // Now trying timer inverval model !   --> Currently using 

    // res.setHeader("Content-Type","text/event-stream");
    // res.setHeader("Access-Control-Allow-Origin","*");


    if(await verifyGameCode(String(req.params.gameCode))){
        // if(activeGames[req.params.gameCode].updateObserved){

        // Checking the state of players on front-end directly !
        // get(child(dbref))
        if(activeGames[req.params.gameCode].snapshot.ready) res.json({resp : true,players : activeGames[req.params.gameCode].snapshot.Players,message:"ready"});
        else res.json({resp : true,players : activeGames[req.params.gameCode].snapshot.Players});

            // res.write("data:"+JSON.stringify({resp : true,data : activeGames[req.params.gameCode].snapshot.Players})+"\n\n");
            // activeGames[req.params.gameCode].updateObserved = false;
        // }else{
        //     res.json({resp : false});
        //     // res.write("data:"+JSON.stringify({resp : false})+"\n\n");
        // }
    }else{
        res.json({resp : false,message : "No valid game found !"});
        // res.write("data:"+JSON.stringify({resp : false,message : "No valid game found !"})+"\n\n");
        // res.end(); // To end the write....otherwise writing will not end
    }
    res.end();
}); 

app.route("/api/cardSelect")
.post((req,res) => {
    let dbref = ref(getDatabase());
    get(child(dbref,"Games/")).then(snapshot => {
        if(snapshot.exists()){
            let games = snapshot.val();
            if(Object.keys(games).indexOf(req.body.gameCode) != -1){
                if(Object.keys(games[req.body.gameCode].Players).indexOf(req.body.playerId) != -1){
                    let same = _.find(games[req.body.gameCode].Players,pl => {
                        return pl.Selection == req.body.selection;
                    });
                    if(same == undefined){
                        if(games[req.body.gameCode].Players[req.body.playerId].Selection == -1){
                            set(ref(database,"Games/"+req.body.gameCode+"/Players/"+req.body.playerId),{
                                Selection : req.body.selection,
                                name : games[req.body.gameCode].Players[req.body.playerId].name
                            });
                            res.json({resp : true});
                        }else{
                            res.json({resp : false,message : "Can select only once !"});
                        }
                    }else{
                        res.json({res : false,message : "Card selected by another player !"});
                    }
                    // console.log(snapshot.val()[req.body.gameCode].Players[req.body.playerId]);
                }else{
                    res.json({res : false,message : "No player found !"});
                }
            }else{
                res.json({res : false,message : "No valid game found !"});
            }
        }
    })
});

app.route("/api/validate")
.post((req,res) => {
    let dbref = ref(getDatabase());
    get(child(dbref,"Games/")).then(snapshot => {
        if(snapshot.exists()){
            let games = snapshot.val();
            let validation = {
                isValid : false,
                isValidPlayer : false,
                players : null
            }
            // console.log(req.body);
            if(Object.keys(games).indexOf(String(req.body.gameCode)) != -1){
                validation.isValid = true;
                if(Object.keys(games[String(req.body.gameCode)].Players).indexOf(String(req.body.playerId)) != -1){
                    validation.isValidPlayer = true;
                    validation.players = games[String(req.body.gameCode)].Players;
                }
            }
            res.json(validation);
        }else{
            console.log("Error occured !");
        }
    });
});

app.route("/api/change")
.post(async (req,res) => {
    const newName = await getRandomName();
    const dbref = ref(getDatabase());
    const path = `Games/${req.body.gameCode}/Players/${req.body.playerId}`;
    get(child(dbref,path)).then((snapshot) => {
        if(snapshot.exists()){
            set(ref(database,path),{
                Selection : snapshot.val().Selection,
                name : newName
            });
            console.log(`Changed ${req.body.playerId} : ${newName}`);
        }
    });
    get(child(dbref,`Games/${req.body.gameCode}`)).then((snapshot) => {
        if(snapshot.exists()){
            res.json({players : snapshot.val().Players})
        }
    });
});

app.route("/api/winner")
.post((req,res) => {
    if(activeGames[req.body.gameCode]){
        if(activeGames[req.body.gameCode].completed){
            if(activeGames[req.body.gameCode].won==undefined){
                let win = Math.round(Math.random()*(activeGames[+req.body.gameCode].maxCount-1));
                const out = _.shuffle(activeGames[req.body.gameCode].snapshot.Players);
                win = Object.keys(activeGames[req.body.gameCode].snapshot.Players).find(key => activeGames[req.body.gameCode].snapshot.Players[key] == out[win]);
                res.json({playerId : win});
                activeGames[req.body.gameCode].won = win;
            }else{
                res.json({playerId : activeGames[req.body.gameCode].won,name:activeGames[req.body.gameCode].snapshot.Players[activeGames[req.body.gameCode].won].name});
            }
        }else{
            res.json({message : "Game is not completed !"});
        }
    }else{
        res.json({message : "Invalid game !"});
    }
});

app.get("/api/maxPlayers/:gameCode",(req,res) => {
    if(activeGames[+req.params.gameCode]){
        if(activeGames[+req.params.gameCode].maxCount) res.json({maxPlayers : activeGames[+req.params.gameCode].maxCount});
        else res.json({message : "maxPlayer lximit not set !"});
    }else{
        res.json({message : "Game not found !"});
    }
});

if(process.env.NODE_ENV === "production"){
    app.use(express.static('./client/build/'));
    app.get("*",(req,res) => {
        res.sendFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'client','build','index.html'));
    });
}

app.listen(PORT,async ()=> {
    await clearDatabase();
    console.log(`Server started on port ${PORT}!`);
});