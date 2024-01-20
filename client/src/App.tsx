import React from 'react'
import {Routes, Route} from 'react-router-dom'
import Lobby from './pages/Lobby'
import Room from './pages/Room'
const App = () => {
  return (
      <Routes>
        <Route path='/' element={<Lobby/>}/>
        <Route path='/room/:roomId' element={<Room/>}/>
      </Routes> 
  )
}

export default App