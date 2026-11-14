// Point d'entrée de l'application : charge la feuille de style et branche les deux onglets.
import './style.css';
import { initialiserOnglets } from './onglets.js';
import { initialiserPage } from './page.js';
import { initialiserRemuneration } from './page-remuneration.js';

initialiserPage(document);
initialiserRemuneration(document);
initialiserOnglets(document);
