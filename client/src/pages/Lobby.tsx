/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/lobby.css";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSocket } from "@/context/SocketContext";

function Lobby() {
  const socket = useSocket();
  const navigate = useNavigate();
  // State to manage form values
  const [formValues, setFormValues] = useState({
    email: "",
    roomId: "",
    framework: "",
  });

  // Event handler for form submission
  const handleJoinButtonClick = useCallback(() => {
    // console.log("Form values:", formValues)
    socket.emit("room:join", formValues);
  }, [formValues, socket]);

  // Event handler for input changes
  const handleInputChange = useCallback(
    (e: any) => {
      const { id, value } = e.target;

      setFormValues((prevValues) => ({
        ...prevValues,
        [id]: value,
      }));
    },
    [setFormValues]
  );

  // Event handler for dropdown changes
  const handleDropdownChange = useCallback(
    (value: string) => {
      setFormValues((prevValues) => ({
        ...prevValues,
        framework: value,
      }));
    },
    [setFormValues]
  );

  const handleRoomJoin = useCallback(
    (data: any) => {
      const { roomId, email, framework } = data;
      console.log("In room:join \n", data);
      // redirect to the Room
      navigate(`/room/${roomId}`, { state: { email, framework } });
    },
    [navigate]
  );

  useEffect(() => {
    socket?.on("room:join", handleRoomJoin);

    return () => {
      socket?.off("room:join", handleRoomJoin);
    };
  }, [handleRoomJoin, socket]);

  return (
    <div className="self-center lobby-container">
      <Card className="w-[550px]">
        <CardHeader>
          <CardTitle>Video Conference App</CardTitle>
          <CardDescription>
            Connect with techies based on a common interest in one-click.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">EmailId</Label>
                <Input
                  id="email"
                  placeholder="Enter your email"
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="roomId">RoomId</Label>
                <Input
                  id="roomId"
                  placeholder="Enter your roomId"
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="framework">Framework</Label>
                <Select onValueChange={(value) => handleDropdownChange(value)}>
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="next">Next.js</SelectItem>
                    <SelectItem value="sveltekit">SvelteKit</SelectItem>
                    <SelectItem value="astro">Astro</SelectItem>
                    <SelectItem value="nuxt">Nuxt.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          {/* Call handleJoinButtonClick when the Join button is clicked */}
          <Button onClick={handleJoinButtonClick}>Join</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Lobby;
