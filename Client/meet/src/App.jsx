import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

export default function App() {
  const [roomLink, setRoomLink] = useState("");
  const navigate = useNavigate();

  const createRoom = async () => {
    try {
      const res = await fetch("http://localhost:3000/create");
      const data = await res.json();
      setRoomLink(data.url);
      navigate(`/room/${data.url.split("/").pop()}`); // navigate to Room
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Meet Clone</h1>
      <button
        onClick={createRoom}
        className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-semibold transition"
      >
        Create Room
      </button>

      {roomLink && (
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={roomLink}
            className="bg-gray-700 px-3 py-2 rounded-md text-gray-200 w-80 text-sm"
          />
          <button
            onClick={() => { navigator.clipboard.writeText(roomLink); alert("Link copied!"); }}
            className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded-md font-medium"
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}

// Wrap App with Router in index.jsx
/*
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import Room from "./Room";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  </Router>
);
*/
