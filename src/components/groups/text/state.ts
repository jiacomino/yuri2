import { genId } from "@/lib/id";

export type TextTab = {
  id: string;
  name: string;
  /** Contenu riche au format HTML (sortie TipTap), "" si vide. */
  content: string;
};

export type TextState = {
  tabs: TextTab[];
  activeTabId: string;
};

export function defaultState(): TextState {
  const id = genId();
  return { tabs: [{ id, name: "Note", content: "" }], activeTabId: id };
}

const COURSES = [
  "<p><strong>Courses de la semaine</strong></p>",
  '<ul data-type="taskList">',
  '<li data-type="taskItem" data-checked="true"><p>Lait d\'avoine</p></li>',
  '<li data-type="taskItem" data-checked="false"><p>Pommes (2 kg)</p></li>',
  '<li data-type="taskItem" data-checked="false"><p>Café en grains</p></li>',
  "</ul>",
].join("");

const PROJET = [
  "<p><strong>Projet Atlas</strong> — points à retenir</p>",
  "<ul>",
  '<li><p>Livraison de la maquette <mark data-color="#fef08a" style="background-color: #fef08a">vendredi 17 octobre</mark></p></li>',
  '<li><p>Budget validé par <span style="color: #2563eb">la direction</span></p></li>',
  "<li><p><s>Choisir le prestataire</s> → fait, ce sera Studio Nord</p></li>",
  "</ul>",
  "<hr>",
  "<ol><li><p>Relire le cahier des charges</p></li><li><p>Planifier l'atelier <em>UX</em> avec Léa</p></li></ol>",
  '<p>Doc : <a href="https://www.notion.so/">espace Notion du projet</a></p>',
].join("");

export function demoState(): TextState {
  const first = genId();
  return {
    tabs: [
      { id: first, name: "Projet", content: PROJET },
      { id: genId(), name: "Courses", content: COURSES },
    ],
    activeTabId: first,
  };
}
