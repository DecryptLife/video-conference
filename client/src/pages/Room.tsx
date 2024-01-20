import React, { useEffect, useCallback, useState } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/context/SocketContext';
import peer from '@/services/peer';
import { Socket } from 'socket.io-client'
import { FaMicrophone } from "react-icons/fa";

interface UserData {
  email: string;
  id: string;
}

interface IncommingCallData {
  from: string;
  offer: RTCSessionDescriptionInit;
}

interface CallAcceptedData {
  from: string;
  ans: RTCSessionDescriptionInit;
}

const Room: React.FC = () => {
  const [remoteSocketId, setRemoteSocketId] = useState<string>("");
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isMicrophone, setIsMicrophone] = useState<boolean>(false);

  const socket: Socket | null = useSocket();

  const handleUserJoin = useCallback(({ email, id }: UserData) => {
    console.log(`User joined with email(${email}) in room!`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const offer = await peer.getOffer();
      if (socket && remoteSocketId) {
        socket.emit('user:call', { to: remoteSocketId, offer });
      }
      setMyStream(stream);
    } catch (error) {
      console.error('Error accessing user media:', error);
    }
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }: IncommingCallData) => {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setRemoteSocketId(from);
      setMyStream(stream);
      console.log(`Incoming call from `, from, offer);
      const ans = await peer.getAnswer(offer);
      if (socket && from) {
        socket.emit('call:accepted', { to: from, ans });
      }
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream?.getTracks() || []) {
      peer.peer.addTrack(track, myStream || undefined);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    async ({ from, ans }: CallAcceptedData) => {
      await peer.setLocalDescription(ans);
      console.log("Call accepted");
      sendStreams();
    },
    [sendStreams],
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket?.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }: IncommingCallData) => {
      const ans = await peer.getAnswer(offer);
      socket?.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener('track', async (ev) => {
      const _remoteStream = ev.streams;
      setRemoteStream(_remoteStream[0]);
    });

    return () => {
      peer.peer.removeEventListener('track', async (ev) => {
        const _remoteStream = ev.streams;
        setRemoteStream(_remoteStream[0]);
      });
    };
  }, []);

  useEffect(() => {
    socket?.on('user:joined', handleUserJoin);
    socket?.on('incomming:call', handleIncommingCall);
    socket?.on('call:accepted', handleCallAccepted);
    socket?.on("peer:nego:needed", handleNegoNeedIncomming);
    socket?.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket?.off('user:joined', handleUserJoin);
      socket?.off('incomming:call', handleIncommingCall);
      socket?.off('call:accepted', handleCallAccepted);
      socket?.off("peer:nego:needed", handleNegoNeedIncomming);
      socket?.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [handleIncommingCall, handleUserJoin, handleCallAccepted, socket, handleNegoNeedIncomming, handleNegoNeedFinal]);

  useEffect(() => {
    const getMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setMyStream(stream);
      } catch (error) {
        // Handle errors, e.g., display an error message or log the error
        console.error('Error accessing media devices:', error);
      }
    };

    getMediaStream();
  }, []); // Empty dependency array to ensure the effect runs only once when the component mounts

  return (
    <div className="container">
       <h1 className="text-3xl font-bold mb-4">Room Page</h1>

      { remoteSocketId ? (
        <>
          <h4 className="text-xl mb-2">Connected</h4>
          <Button onClick={ handleCallUser }>Call</Button>
        </>
      ) : (
        <h4 className="text-xl">No one in the room</h4>
      ) }

      { myStream && <Button onClick={ sendStreams }>Send Stream</Button> } 
      <div className="flex m-2 justify-center h-full">
        { myStream && (
          <div className="w-full sm:w-1/2 lg:w-1/2 xl:w-1/2">
            <h1 className="text-2xl font-bold mb-2">My Stream</h1>
            {isVideo?<ReactPlayer playing={ isVideo } muted={isMicrophone} url={ myStream } width="100%" height="100%" />: <div style={{width:"100%",height:"40vh", backgroundColor: 'black'}}></div>}
            <Button onClick={ () => setIsVideo(!isVideo) }>Video</Button>
            <FaMicrophone color="white" fontSize="2em" className="bg-red-500 p-1 rounded-sm	" />
            <Button onClick={ ()=>setIsMicrophone(!isMicrophone) }>Microphone</Button>
          </div>
        ) }
        { remoteStream && (
          <div className="w-full sm:w-1/2 lg:w-1/2 xl:w-1/2">
            <h1 className="text-2xl font-bold mb-2">Remote Stream</h1>
            <ReactPlayer playing muted url={ remoteStream } width="100%" height="100%" />
          </div>
        ) }
      </div>
    </div>
  );
};

export default Room;
