import React from "react";
import Card from "./Card";
import {useParams} from 'react-router-dom';
import { useState, useEffect } from "react";
import _ from 'lodash'

let updateIntervalId = 0;
let timerId = 0;

function Deck(){
    let {gameCode,playerId} = useParams();

    const [isValid, setisValid] = useState(false);
    const [isValidPlayer, setisValidPlayer] = useState(false);

    const [players, setPlayers] = useState({});

    const [maxPlayers,setmaxPlayers] = useState(0);

    useEffect(() => {
      fetch(`/api/maxPlayers/${gameCode}`).then(res => res.json()).then(res => {
        if(res.message) alert(`Error : ${res.message}`);
        else setmaxPlayers(+res.maxPlayers);
      });
    },[]);
  
    const cards = Array.from(Array(maxPlayers).keys()).map((i) => Card(i+1,""));
    const [cardsValue,setCardValue] = useState(cards);
    
    useEffect(() => {
      const c = [...cards];
      if(cardsValue.join() !== c.join()){
        setCardValue(c);
      }
    }, [cards, cardsValue]);

    const [Seconds,setSeconds] = useState(10);
    const [Hidden,setHidden] = useState(true);
    const [Winner,setWinner] = useState("");

    const playerUpdated = (newPlayers) => {
      setPlayers(newPlayers);
    }

    const processCards = React.useCallback((current,nameHidden) => {
      let newArr = [...current];
        newArr.forEach(card => {
          let s = _.find(players,(p) => {
            return p.Selection === +card.key;
          });
          if(s !== undefined){
            if(s.name === Winner) newArr[newArr.indexOf(card)] = Card(card.key,"selectedCard winnerName",s.name,nameHidden);
            else newArr[newArr.indexOf(card)] = Card(card.key,"selectedCard",s.name,nameHidden);
          }
        });
      return newArr;
    },[Winner, players]);

    useEffect(() => {
      const request = {
        method : "POST",
        headers : {"content-type":"application/json"},
        body : JSON.stringify({gameCode : gameCode,playerId : playerId})
      }
      fetch("/api/validate",request).then(res => res.json()).then((res) => {
        if(res.isValid) setisValid(true);
        if(res.isValidPlayer) setisValidPlayer(true);
        if(res.isValid && res.isValidPlayer){
          setPlayers(res.players);
        }
      });
    },[gameCode, playerId]);

    useEffect(() => {
      console.log("Update useEffect !");
      updateIntervalId = setInterval(() => {
        fetch("/api/updates/"+gameCode).then(resp => resp.json()).then(res => {
          if(res.resp){
            if(res.message === "ready"){
              clearInterval(updateIntervalId);
              timerId = setInterval(() => {
                setHidden(false);
                setSeconds(prev => prev-1);
              },1000);
              setTimeout(() => {
                clearInterval(timerId);
                const reponse = {
                  method : "POST",
                  headers : {
                    "Content-Type" : "application/json"
                  },
                  body : JSON.stringify({gameCode : gameCode})
                }
                fetch("/api/winner",reponse).then(res => res.json()).then(res => {
                  if(res.message === undefined){
                    setHidden(false);
                    setWinner(res.name);
                    setCardValue((current) => processCards(current,Hidden));
                    if(+playerId === +res.playerId){
                      alert("You are winner !");
                    }
                  }else{
                    alert(`Error : ${res.message}`);
                  }
                });
              },10000);
            }
            if(JSON.stringify(players) !== JSON.stringify(res.players)) playerUpdated(res.players);
          }else{
            if(res.message) console.log(res.message);
          }
        });
      },1000);
      return () => clearInterval(updateIntervalId)
    },[]);

    useEffect(() => {
      setCardValue((current) => {
        return processCards(current,Hidden);
      });
    },[players, Hidden, processCards]);

    const changeName = () => {
      const reponse = {
        method : "POST",
        headers : {
          "Content-Type" : "application/json"
        },
        body : JSON.stringify({playerId : playerId,gameCode : gameCode})
      };
      fetch("/api/change",reponse).then(res => res.json()).then(res => {
        setPlayers(res.players);
      });
    }

    const copy = () => {
      navigator.clipboard.writeText(gameCode);
    }
    if(isValid && isValidPlayer){
      return(
        <div>
          <div className="makeCenter">
            <div className="gameCodeDiv" style={{backgroundColor : "#f4bcbc"}}>
              <div className="row border-bottom border-dark mb-3">
                <div className="col">
                  <h1>{players[playerId].name}</h1>
                </div>
                <div className="col">
                  <button onClick={changeName} className="btn btn-light" style={{backgroundColor : "#f4bcbc"}}><i className="fa-solid fa-arrows-rotate"></i></button>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <h3>Game Code : </h3> 
                </div>
                <div className="col">
                  <h3>{gameCode} <button className="ms-2 btn btn-light" style={{backgroundColor : "#f4bcbc"}} onClick={copy}><i className="fa-solid fa-copy"></i></button></h3>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <h3>Players Joined : </h3>
                </div>
                <div className="col">
                  <h3>{Object.keys(players).length}</h3>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <h3>Selected : </h3>
                </div>
                <div className="col">
                  <h3>{players[playerId].Selection===-1 ? "None" : players[playerId].Selection}</h3>
                </div>
              </div>
              <div>
              </div>
              <div id="timerDiv" hidden={Hidden}>
                <h3>{Seconds}</h3>
              </div>
            </div>
          </div>
          <div className="makeCenter">
            <div className="makeCenter p-5">
              {cardsValue}  
            </div>
          </div>
        </div>
        )
    }
    return(
      <div>
        <div className='centerScreen makeCenter'>
            <div className="gameCodeDiv">
              {!isValid ? <h2>Game not valid !</h2> : <h2>Player not valid !</h2>}
            </div>
        </div>
      </div>
    );
}

export default Deck;