import { createContext, useContext } from "react";

/*===== Figure Actions =====*/
// How a figure drawn inside the editor (a Lexical decorator, rendered by Lexical's own portal) reaches the editor's
// figure dialog: the editor provides `edit`, the figure calls it with its node key when she clicks it.

export type FigureActions = { edit: (nodeKey: string) => void };

export const FigureActionsContext = createContext<FigureActions | null>(null);

/** @throws When used outside the post editor, which always provides the actions. */
export function useFigureActions(): FigureActions {
  const actions = useContext(FigureActionsContext);
  if (!actions) throw new Error("useFigureActions: no FigureActionsContext; render inside the post editor");
  return actions;
}
