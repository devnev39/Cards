import React from "react";
import {useParams} from 'react-router-dom';

function Card(count,selected,name,Hidden=true){
    let {gameCode,playerId} = useParams();
    return (
      <div key={count}>
        <div className={`card makeCenter ${selected.split(" ")[0]} pattern-dots-lg red`} id={`card-${count}`} onClick={() => {
            let request = {
              method : "POST",
              headers : {"content-type" : "application/json"},
              body : JSON.stringify({gameCode : gameCode,playerId : playerId,selection : count})
            };
            fetch("/cardSelect",request).then(res => res.json()).then(data => {
              if(data.resp){
                document.getElementById(`card-${count}`).classList.add("selectedCard");
              }else{
                alert(data.message);
              }
            })  
        }}>
        </div>
        <div className={`selectedCardPlayerName ${selected.split(" ")[1]} ms-4`} hidden={Hidden}>
          {name}
        </div>
      </div>
    )
  }

export default Card;