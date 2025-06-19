// Simple nickname hook for demo purposes
import { useState, useEffect } from "react";

export function useNickname() {
  const [nickname, setNickname] = useState<string>("");
  useEffect(() => {
    let stored = localStorage.getItem("nickname");
    if (!stored) {
      stored = `user_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("nickname", stored);
    }
    setNickname(stored);
  }, []);
  return nickname;
}
