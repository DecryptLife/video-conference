import { Button } from '@/components/ui/button'
import { useSocket } from '@/context/SocketContext'
import React, { useEffect, useCallback, useState } from 'react'
import ReactPlayer from 'react-player'
const Room = () => {
  const [remoteSocketId, setRemoteSocketId] = useState("")
  const [myStream, setMyStream] = useState(null)

  const socket = useSocket()
  const handleUserJoin = useCallback(
    (data) => {
      console.log(data);
      
      const { email, id } = data
      console.log(`User joined with email(${email}) in room !`);
      setRemoteSocketId(id)
    },
    [],
  )
  const handleCallUser = useCallback(
    async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })
      setMyStream(stream)
    },
    [],
  )
  

  useEffect(() => {
    socket?.on('user:joined',handleUserJoin)
  
    return () => {
      socket?.off('user:joined', handleUserJoin)
    }
  }, [handleUserJoin, socket])
  
  return (
    <div>
      <h1>Room Page</h1>
      { remoteSocketId ?
        <>
          <h4>"Connected"</h4>
          <Button onClick={ handleCallUser }>Call</Button>
        </> :
        <h4>"No one in room"</h4>
      }
      { myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={ myStream }
          />
        </>
      ) }
    </div>
  )
}

export default Room