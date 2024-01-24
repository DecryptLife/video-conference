import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/SocketContext";
import peer from "@/services/peer";
import { Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";
interface UserData {
  email: string;
  id: string;
  framework: string;
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
  const location = useLocation();
  const { framework } = location.state || {};

  const [remoteSocketId, setRemoteSocketId] = useState<string>("");
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socket: Socket | null = useSocket();

  const handleUserJoin = useCallback(({ email, id, framework }: UserData) => {
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
        socket.emit("user:call", { to: remoteSocketId, offer });
      }
      setMyStream(stream);
    } catch (error) {
      console.error("Error accessing user media:", error);
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
        socket.emit("call:accepted", { to: from, ans });
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
    [sendStreams]
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
    peer.peer.addEventListener("track", async (ev) => {
      const _remoteStream = ev.streams;
      setRemoteStream(_remoteStream[0]);
    });

    return () => {
      peer.peer.removeEventListener("track", async (ev) => {
        const _remoteStream = ev.streams;
        setRemoteStream(_remoteStream[0]);
      });
    };
  }, []);

  useEffect(() => {
    socket?.on("user:joined", handleUserJoin);
    socket?.on("incomming:call", handleIncommingCall);
    socket?.on("call:accepted", handleCallAccepted);
    socket?.on("peer:nego:needed", handleNegoNeedIncomming);
    socket?.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket?.off("user:joined", handleUserJoin);
      socket?.off("incomming:call", handleIncommingCall);
      socket?.off("call:accepted", handleCallAccepted);
      socket?.off("peer:nego:needed", handleNegoNeedIncomming);
      socket?.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    handleIncommingCall,
    handleUserJoin,
    handleCallAccepted,
    socket,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <div className="bg-stone-900 flex flex-col h-screen githubcontainer mx-auto p-4">
      {/* !Header */}
      <div className="flex items-center justify-center h-1/20">
        <h1 className="text-3xl font-bold text-white mb-4">
          Let's Talk About {framework}
        </h1>
      </div>

      {/* Local User Video in center */}
      <div className="flex items-center justify-center h-4/20">
        <div className="bg-black  h-full w-1/4 "></div>
      </div>

      {/* Remote User video in full-width height center */}
      <div className="bg-stone-900 h-14/20">
        <div className="bg-black h-3/4"></div>
      </div>

      {/* More options section */}
      <div className="bg-black flex h-1/20">
        {/* permissions */}
        <div className="bg-black flex justify-start w-1/6">
          <div></div>
        </div>

        {/* call features */}
        <div className="w-4/6"></div>

        {/* quit call  - exit for visitors, end for ownersool*/}
        <div className="flex justify-end w-1/6">
          <button className=" bg-red-800 w-1/2 font-bold text-white">
            END
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;
