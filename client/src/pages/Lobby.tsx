import * as React from "react";

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

function Lobby() {
  // State to manage form values
  const [formValues, setFormValues] = React.useState({
    email: "",
    roomId: "",
    framework: "",
  });

  // Event handler for form submission
  const handleJoinButtonClick = () => {
    // Log form values to the console
    console.log("Form values:", formValues);
  };

  // Event handler for input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;

    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  // Event handler for dropdown changes
  const handleDropdownChange = (value) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      framework: value,
    }));
  };

  return (
    <div className='self-center'>
    <Card className="w-[550px]">
      <CardHeader>
        <CardTitle>Video Conference App</CardTitle>
        <CardDescription>Connect with techies based on a common interest in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">EmailId</Label>
              <Input id="email" placeholder="Enter your email" onChange={ handleInputChange } />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="roomId">RoomId</Label>
              <Input id="roomId" placeholder="Enter your roomId" onChange={ handleInputChange } />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Framework</Label>
              <Select onValueChange={ (value) => handleDropdownChange(value) }>
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
        {/* Call handleJoinButtonClick when the Join button is clicked */ }
        <Button onClick={ handleJoinButtonClick }>Join</Button>
      </CardFooter>
      </Card>
    </div>
  );
}

export default Lobby;
