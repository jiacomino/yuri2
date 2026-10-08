import { createContext, useContext } from "react";

/**
 * Actions des nœuds, passées par contexte plutôt que dans `node.data` : `data` est ce
 * qui est persisté, et le contexte garde les fermetures à jour sans réécrire les nœuds.
 */
export type MindMapActions = {
  rename: (id: string, label: string) => void;
  addChild: (id: string) => void;
  remove: (id: string) => void;
};

export const MindMapContext = createContext<MindMapActions>({
  rename: () => {},
  addChild: () => {},
  remove: () => {},
});

export function useMindMapActions(): MindMapActions {
  return useContext(MindMapContext);
}
