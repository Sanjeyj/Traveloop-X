"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { Navigation } from "lucide-react";

interface Cursor {
  id: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

const COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function LiveCursors({ roomId }: { roomId: string }) {
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const socketRef = useRef<Socket | null>(null);
  
  // Assign a random color and name for the demo
  const userColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]).current;
  const userName = useRef(`User_${Math.floor(Math.random() * 1000)}`).current;

  useEffect(() => {
    // Connect to the Express backend Socket.io server
    socketRef.current = io("http://localhost:3001");
    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("join-trip", roomId);
    });

    socket.on("cursor-update", (data: Cursor) => {
      setCursors((prev) => ({
        ...prev,
        [data.id]: data,
      }));
    });

    socket.on("user-disconnected", (id: string) => {
      setCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[id];
        return newCursors;
      });
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!socket.id) return;
      
      const payload: Cursor = {
        id: socket.id,
        x: e.clientX,
        y: e.clientY,
        color: userColor,
        name: userName,
      };
      
      socket.emit("cursor-move", { roomId, ...payload });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      socket.disconnect();
    };
  }, [roomId, userColor, userName]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {Object.values(cursors).map((cursor) => (
          <motion.div
            key={cursor.id}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              x: cursor.x,
              y: cursor.y 
            }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.5 }}
            className="absolute top-0 left-0 flex flex-col items-start drop-shadow-lg"
            style={{ color: cursor.color }}
          >
            <Navigation 
              size={18} 
              className="fill-current -rotate-90 -ml-[5px] -mt-[5px]" 
            />
            <div 
              className="px-2 py-1 ml-3 mt-1 rounded-md text-[10px] font-bold text-white whitespace-nowrap shadow-xl"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
