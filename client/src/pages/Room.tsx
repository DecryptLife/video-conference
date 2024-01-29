import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/SocketContext";
import peer from "@/services/peer";
import { Socket } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CameraIcon,
  MicrophoneIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";

type PermissionState = "prompt" | "granted" | "denied";

interface Permissions {
  audio: PermissionState;
  video: PermissionState;
}
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
  const { email, framework } = location.state || {};
  const navigate = useNavigate();

  const [sendAudio, setSendAudio] = useState(false);
  const [sendVideo, setSendVideo] = useState(false);

  const [permissions, setPermissions] = useState({
    audio: "pending",
    video: "pending",
  });
  const [mediaStream, setMediaStream] = useState(null);

  const [showParticipants, setShowParticipants] = useState(false);

  const [remoteSocketId, setRemoteSocketId] = useState<string>("");
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socket: Socket | null = useSocket();

  useEffect(() => {
    requestMedia();
  }, []);

  const requestMedia = async () => {
    let audioGranted = false;
    let videoGranted = false;

    // audioPermission granted , but audio stopped
    if (permissions.audio !== "granted") {
      try {
        console.log("Asking audio permission: " + permissions.audio);
        await navigator.mediaDevices.getUserMedia({ audio: true });
        audioGranted = true;
        setSendAudio(true);
        setPermissions((prev) => ({ ...prev, audio: "granted" }));
      } catch (err) {
        console.error("Audio permission disabled");
        setSendAudio(false);
        setPermissions((prev) => ({ ...prev, audio: "denied" }));
      }
    } else audioGranted = true;

    if (permissions.video !== "granted") {
      try {
        console.log("video permissin: " + permissions.video);
        await navigator.mediaDevices.getUserMedia({ video: true });
        videoGranted = true;
        setSendVideo(true);
        setPermissions((prev) => ({ ...prev, video: "granted" }));
      } catch (err) {
        console.error("Video permissions disabled");
        setSendVideo(true);
        setPermissions((prev) => ({ ...prev, video: "denied" }));
      }
    } else videoGranted = true;

    if (audioGranted || videoGranted) {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioGranted,
        video: videoGranted,
      });

      console.log(stream);
      setMyStream(stream);
      sendStreams();
    }
  };

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

  //  merge the below two functions
  const sendStreams = useCallback(() => {
    console.log("sending streams");
    for (const track of myStream?.getTracks() || []) {
      peer.peer.addTrack(track, myStream || undefined);
    }
  }, [myStream, sendAudio, sendVideo]);

  const stopStreams = useCallback(() => {
    console.log("Stopping streams");
    for (const track of myStream?.getTracks() || []) {
      track.stop();
    }
    setPermissions({
      audio: "pending",
      video: "pending",
    });
    setMyStream(null);
  }, [myStream]);

  const toggleAudio = () => {
    // no stream do nothing
    if (!myStream) return;

    for (const track of myStream?.getAudioTracks() || []) {
    }
  };

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

  function changeParticipantsView() {
    setShowParticipants((prevState) => !prevState);
  }

  const endSession = () => {
    setPermissions({
      audio: "pending",
      video: "pending",
    });
    navigate("/");
  };
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
    <div className="relative bg-stone-900 flex flex-col h-screen githubcontainer mx-auto p-4">
      {/* !Header */}
      <Header
        framework={framework}
        showParticipants={showParticipants}
        changeParticipantsView={changeParticipantsView}
      />
      {showParticipants && <Participants />}

      {/* Local User Video in center */}

      <div className="flex items-center justify-center h-4/20">
        {remoteStream && <SmallVideoScreen />}
      </div>

      {/* Remote User video in full-width height center */}
      {myStream ? (
        <LargeScreen username={email} stream={myStream} />
      ) : (
        <LargeScreen username={email} />
      )}
      {/* More options section */}

      <CallOptions
        changeParticipantsView={changeParticipantsView}
        endSession={endSession}
        requestMedia={requestMedia}
      />
    </div>
  );
};

function Header({ framework, showParticipants, changeParticipantsView }) {
  return (
    <div className=" flex items-center  justify-between h-1/20 w-full">
      <div className="flex-1 flex justify-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Let's Talk About {framework}
        </h1>
      </div>
      <div className="flex items-center">
        <span className="text-white"> Participants</span>
        {showParticipants ? (
          <ChevronUpIcon
            className="text-white h-5 w-5 "
            onClick={changeParticipantsView}
          />
        ) : (
          <ChevronDownIcon
            className="text-white h-5 w-5"
            onClick={changeParticipantsView}
          />
        )}
      </div>
    </div>
  );
}

function Participants() {
  return (
    <div className="absolute bg-white w-1/5 h-14/20 top-5p right-0">
      <ul className="h-full">
        <li className="h-1/6">
          <div className="p-2 flex h-full ">
            <div className="w-2/5  h-2/4 flex items-center">
              <span>Participant Name </span>
            </div>
            <div className=" h-2/4 flex justify-evenly w-3/5 ">
              <button className="bg-green-600 text-white w-2/5 rounded-full shadow-xl">
                Accept
              </button>
              <button className="bg-red-600 text-white w-2/5 rounded-full shadow-xl">
                Reject
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}

function SmallVideoScreen() {
  return (
    <div className="bg-black  h-full w-1/4 ">
      <div className="flex items-center justify-center h-full">
        <span className="text-white">Local User</span>
      </div>
    </div>
  );
}

function LargeScreen({ username, stream }) {
  return (
    <div className="bg-stone-900 h-14/20 ">
      <div className="bg-black w-full h-3/4">
        {stream ? (
          <ReactPlayer
            playing
            muted
            url={stream}
            width="100%"
            height="100%"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-white">{username}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CallOptions({ changeParticipantsView, endSession, requestMedia }) {
  return (
    <div className="bg-black flex h-1/20">
      {/* permissions */}
      <div className="bg-black flex justify-evenly w-1/6 ">
        <div className="permission-item-container ">
          <div className="permission-item-icon">
            <CameraIcon
              className=" text-white  "
              onClick={requestMedia}
            ></CameraIcon>
          </div>
          <div className="permission-item-text">
            <span className="text-white text-xs ">Camera</span>
          </div>
        </div>

        <div className="permission-item-container">
          <div className="permission-item-icon">
            <MicrophoneIcon className="text-white" onClick={requestMedia} />
          </div>

          <div className="permission-item-text">
            <span className="text-white text-xs">Audio</span>
          </div>
        </div>
      </div>

      {/* call features */}
      <div className="flex justify-center w-4/6">
        <div className="permission-item-container">
          <div className="permission-item-icon">
            <UserGroupIcon
              className="text-white"
              onClick={changeParticipantsView}
            ></UserGroupIcon>
          </div>

          <div className="permission-item-text">
            <span className="text-white text-xs">Participants</span>
          </div>
        </div>
      </div>

      {/* quit call  - exit for visitors, end for ownersool*/}
      <div className="flex justify-end w-1/6">
        <button
          className=" bg-red-800 w-1/2 font-bold text-white"
          onClick={endSession}
        >
          END
        </button>
      </div>
    </div>
  );
}

export default Room;

// upon removal of track inform the other user
