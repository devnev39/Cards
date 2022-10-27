import React from "react";
import {useNavigate} from 'react-router-dom';

function JoinCreateGame(){
    let navigate = useNavigate(); // Hook 
    return(
    <div style={{backgroundColor : "#ff5e5e"}}>
      <img src="https://i.pinimg.com/originals/0a/44/82/0a448232ce1cfd800a051631df18ad07.gif" alt="" />
      <div className='optionContainer makeCenter'>
        <div className='gameOption makeCenter'>
          <input type='text' placeholder='Enter ID' style={{'margiRight':'3%'}} id="gameCode"></input>
          <button className="btn btn-primary ms-2" onClick={() => {
            let gameCode = document.getElementById("gameCode").value;
            const request = {
              method : "POST",
              headers : {"content-type" : "application/json"},
              body : JSON.stringify({gameCode : gameCode})
            }
            fetch("/joinGame",request).then(res => res.json()).then(data => {
              if(data.resp){
                navigate("/game/"+data.gameCode+"/"+data.playerId);
              }else{
                alert(data.message);
              }
            })
          }}>Join</button>
        </div>
        OR
        <div className='gameOption makeCenter'>
          <button className="btn btn-warning" onClick={() => {
            let request = {
              method : "POST",
              headers : {"content-type" : "application/json"},
              body : JSON.stringify({playerCount : 5})
            };
            // let code = 0;
            fetch("/newGame",request).then((res) => res.json()).then((data) => {
                navigate("/game/"+data.gameCode+"/"+data.playerId);
            });
            
          }}>Create New</button>
        </div>
      </div>
    </div>
    )
}

export default JoinCreateGame;
