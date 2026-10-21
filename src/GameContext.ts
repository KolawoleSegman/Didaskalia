import { createContext, useContext } from "react";
import type { Engine } from "./engine";

export const GameContext = createContext<Engine | null>(null);

/** Everything about the game (state and actions) for any screen. */
export function useG(): Engine {
  const g = useContext(GameContext);
  if (!g) throw new Error("useG must be used inside <Game>");
  return g;
}
