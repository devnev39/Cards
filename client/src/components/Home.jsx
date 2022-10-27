import React from "react";
import JoinCreateGame from './JoinCreateGame'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import Deck from "./Deck";

// gameCode => game code
// playerId => player Id 

function Home(){
    return(  
      <Router>
        <Routes>
          <Route path="/" element={<div className='centerScreen makeCenter'><JoinCreateGame /></div>}/>
          <Route path="/game/:gameCode/:playerId" element={<div className='centerScreen makeCenter'><Deck /></div>}/>
        </Routes>
      </Router>
      
    )
}

export default Home;