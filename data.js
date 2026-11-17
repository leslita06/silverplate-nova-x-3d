// Points de vue (caméra en orbite : cible, distance, angle horizontal, hauteur d'angle)
window.VUES = [
  { id: 'ensemble', t: 'Vue d’ensemble', d: 'Salle de 32 × 26 m, 30 tables rondes de 10 couverts, scène au fond.', target: [0, 1.2, -1], dist: 30, az: 0.62, el: 0.62 },
  { id: 'entree', t: 'Accueil des invités', d: 'Panneau d’accueil, flèches et comptoir des accréditations à l’entrée.', target: [-7.6, 1.2, 11.2], dist: 7.5, az: 3.55, el: 0.2 },
  { id: 'photocall', t: 'Photocall', d: 'Mur de 4 × 2,25 m, éclairé, sur le passage entre l’accueil et la salle.', target: [10, 1.3, 12], dist: 7, az: 2.9, el: 0.14 },
  { id: 'salle', t: 'Depuis une table', d: 'Ce que voit un invité assis au milieu de la salle.', target: [0, 3, -9], dist: 15, az: 0.03, el: 0.06 },
  { id: 'scene', t: 'La scène', d: 'Plateau de 12 × 5 m, écran LED de 9 × 5 m, kakémonos de part et d’autre.', target: [0, 3, -8.5], dist: 10.5, az: -0.32, el: 0.2 },
  { id: 'pupitre', t: 'Pupitre et front de scène', d: 'Le pupitre des discours et le bandeau sur le nez de scène.', target: [-3.4, 1.4, -6.6], dist: 4.6, az: 0.4, el: 0.12 }
];
// Éléments cliquables : fiche de la pièce du kit
window.PIECES = {
  ecran: { k: 'Habillage de scène', t: 'Écran LED de fond de scène', d: 'Format 16:9, 9 × 5 m. Visuel clé : le téléphone, ses orbites et « Le futur tient dans votre main ».', img: 'img/ecran.jpg', vue: 'scene' },
  front: { k: 'Habillage de scène', t: 'Front de scène', d: 'Bandeau de 12 × 0,6 m sur le nez de scène, NOVA X et NOVA Électronique en alternance.', img: 'img/front.jpg', vue: 'pupitre' },
  pupitre: { k: 'Habillage de scène', t: 'Pupitre', d: 'Face de 60 × 110 cm, pour les discours et le dévoilement.', img: 'img/pupitre.jpg', vue: 'pupitre' },
  kakemono: { k: 'Signalétique', t: 'Kakémono', d: 'Enrouleur de 80 × 200 cm, de part et d’autre de la scène et à l’entrée.', img: 'img/kakemono.jpg', vue: 'scene' },
  photocall: { k: 'Photocall', t: 'Mur photocall', d: 'Toile tendue de 400 × 225 cm, damier NOVA X et NOVA Électronique.', img: 'img/photocall.jpg', vue: 'photocall' },
  accueil: { k: 'Signalétique d’accueil', t: 'Panneau d’accueil', d: 'A1 portrait sur chevalet : bienvenue et orientation vers chaque espace.', img: 'img/accueil.jpg', vue: 'entree' },
  fleche: { k: 'Signalétique d’accueil', t: 'Flèches directionnelles', d: 'A3 paysage : salle de lancement, photocall, vestiaire.', img: 'img/fleche-salle.jpg', vue: 'entree' },
  carton: { k: 'Arts de la table', t: 'Carton de table', d: 'Chevalet plié 15 × 10,5 cm, un numéro par table, sur les 30 tables.', img: 'img/carton.jpg', vue: 'salle' },
  comptoir: { k: 'Accueil', t: 'Comptoir des accréditations', d: 'Façade de 4 × 1 m. Remise des badges nominatifs et du tour de cou.', img: 'img/badge.jpg', vue: 'entree' }
};
