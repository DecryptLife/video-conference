import React from 'react'
import {Routes, Route} from 'react-router-dom'
import Lobby from './pages/lobby'
import Room from './pages/Room'
const App = () => {
  return (
    <div className='flex justify-center align-middle h-screen'>
      <Routes>
        <Route path='/' element={<Lobby/>}/>
        <Route path='/room' element={<Room/>}/>
      </Routes> 
    </div>
  )
}

export default App