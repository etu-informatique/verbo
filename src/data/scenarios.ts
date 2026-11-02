export interface Scenario {
  id: string;
  title: string;
  goal: string; // objectif donné à l'apprenant
  setup: string; // description envoyée au modèle (en anglais)
}

export const SCENARIOS: Scenario[] = [
  { id: "restaurant", title: "Au restaurant", goal: "Commande un repas complet et demande l'addition.", setup: "You are a busy waiter in a popular restaurant. The learner is a customer who must order a full meal (starter, main, drink), ask about an ingredient, and pay. One dish they want is sold out." },
  { id: "interview", title: "Entretien d'embauche", goal: "Décroche le poste : présente-toi et défends ton profil.", setup: "You are a demanding HR manager interviewing the learner for a job they choose. Ask about experience, strengths, weaknesses, a difficult situation, and salary expectations. Challenge vague answers." },
  { id: "airport", title: "Bagage perdu", goal: "Fais une réclamation et obtiens une solution.", setup: "You are an airline desk agent at the airport. The learner's suitcase didn't arrive. Ask for details (flight, description of the bag, address) and be a bit bureaucratic." },
  { id: "doctor", title: "Chez le médecin", goal: "Explique tes symptômes et comprends le traitement.", setup: "You are a general practitioner. The learner is a patient who feels sick. Ask about symptoms, duration, allergies, and explain a simple treatment." },
  { id: "apartment", title: "Visite d'appartement", goal: "Pose les bonnes questions et négocie le loyer.", setup: "You are a landlord showing an apartment. The rent is a bit high and there are some defects (noisy street, old kitchen). The learner should ask questions and try to negotiate." },
  { id: "party", title: "Soirée entre amis", goal: "Fais connaissance et trouve des points communs.", setup: "You are a friendly, talkative guest at a house party who just met the learner. Use casual, everyday language and common slang. Talk about music, work, travels, and make jokes." },
  { id: "shop", title: "Réclamation en magasin", goal: "Obtiens un remboursement pour un produit défectueux.", setup: "You are a shop employee. The learner wants a refund for a broken product but has lost the receipt. Be reluctant and offer an exchange or store credit first." },
  { id: "hotel", title: "Check-in à l'hôtel", goal: "Récupère ta chambre et règle un problème de réservation.", setup: "You are a hotel receptionist. There's a problem: the learner's reservation is for the wrong dates. Find a solution together." },
  { id: "directions", title: "Demander son chemin", goal: "Trouve comment aller au musée en transports.", setup: "You are a local person in the street. The learner asks how to get to the main museum. Give directions with public transport, landmarks, and a shortcut." },
  { id: "market", title: "Marchander au marché", goal: "Achète au meilleur prix possible.", setup: "You are a market seller with strong personality. The learner wants to buy several items. Start with high prices and accept to negotiate only with good arguments." },
  { id: "date", title: "Premier rendez-vous", goal: "Fais bonne impression et propose un second rendez-vous.", setup: "You are on a first casual date with the learner in a café. Be natural, curious, use everyday expressions, ask personal (but appropriate) questions." },
  { id: "coworker", title: "Small talk au bureau", goal: "Discute avec un collègue à la machine à café.", setup: "You are a coworker chatting at the coffee machine on a Monday morning. Talk about the weekend, a project deadline, and office gossip, using natural casual language." },
];

export const DEBATE_TOPICS = [
  "Les réseaux sociaux font plus de mal que de bien",
  "Le télétravail devrait devenir la norme",
  "L'IA va détruire plus d'emplois qu'elle n'en créera",
  "Il faut interdire les voitures en centre-ville",
  "Les devoirs à la maison devraient être supprimés",
  "Les footballeurs sont beaucoup trop payés",
  "Les études supérieures ne sont plus indispensables",
  "Tout le monde devrait apprendre à coder",
  "Vivre en ville vaut mieux que vivre à la campagne",
  "Les jeux vidéo sont une forme d'art",
  "Il faut instaurer un revenu universel",
  "On devrait passer à la semaine de 4 jours",
];

export const FREE_TOPICS = [
  "Ma journée",
  "Voyages",
  "Films & séries",
  "Musique",
  "Sport",
  "Travail & études",
  "Cuisine",
  "Mes projets",
  "Actualité",
  "Souvenirs d'enfance",
];
