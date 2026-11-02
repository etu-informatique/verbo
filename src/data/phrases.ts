import type { LangCode, Level } from "../lib/languages";

export interface Phrase {
  text: string;
  level: Level;
  focus: string; // la difficulté travaillée
  tr: string; // traduction
}

type Row = [Level, string, string, string];

const rows: Record<LangCode, Row[]> = {
  en: [
    ["A1", "Nice to meet you.", "Liaison « meet you » → « mee-chou »", "Enchanté."],
    ["A1", "I think it's three o'clock.", "Le « th » soufflé : think, three", "Je crois qu'il est trois heures."],
    ["A1", "Where is the bathroom?", "« th » et « r » anglais", "Où sont les toilettes ?"],
    ["A2", "I'd like a glass of water, please.", "« water » et le « I'd »", "Je voudrais un verre d'eau, s'il vous plaît."],
    ["A2", "What do you want to do this weekend?", "Formes réduites : « wanna »", "Qu'est-ce que tu veux faire ce week-end ?"],
    ["A2", "She sells seashells by the seashore.", "« s » contre « sh »", "Elle vend des coquillages au bord de la mer."],
    ["B1", "I should have called you yesterday.", "« should have » → « should've »", "J'aurais dû t'appeler hier."],
    ["B1", "It's up to you, I'm fine with either.", "Accent de phrase, « either »", "C'est toi qui vois, les deux me vont."],
    ["B1", "The weather is better than I thought.", "« th » voisé / non voisé", "Il fait meilleur que je ne pensais."],
    ["B1", "Could you say that a little more slowly?", "Intonation des questions polies", "Pourriez-vous le dire un peu plus lentement ?"],
    ["B2", "I've been working here for three years.", "Present perfect continu, « three »", "Je travaille ici depuis trois ans."],
    ["B2", "Honestly, I'm not really sure about that.", "« h » muet de honestly, « really »", "Honnêtement, je n'en suis pas vraiment sûr."],
    ["B2", "Thorough research requires a lot of thought.", "« th » + voyelles longues", "Une recherche approfondie demande beaucoup de réflexion."],
    ["C1", "The squirrel ran through the rural area.", "« r » et « l » enchaînés", "L'écureuil a traversé la zone rurale."],
    ["C1", "Whether the weather is warm or cold, we'll go.", "« w », « th », « we'll »", "Qu'il fasse chaud ou froid, on ira."],
    ["C2", "It's a world-class opportunity worth considering.", "« world », « worth » : le son /ɜː/", "C'est une opportunité de classe mondiale à envisager."],
  ],
  es: [
    ["A1", "Hola, ¿cómo estás?", "« h » muette, intonation", "Salut, comment ça va ?"],
    ["A1", "Me llamo Ana y tengo veinte años.", "« ll » et « ñ »", "Je m'appelle Ana et j'ai vingt ans."],
    ["A1", "Quiero un café con leche, por favor.", "« qu » et « r » simple", "Je voudrais un café au lait, s'il vous plaît."],
    ["A2", "¿Dónde está la estación de tren?", "Accent tonique écrit", "Où est la gare ?"],
    ["A2", "Hoy hace mucho calor en Sevilla.", "« h » muette, « ll »", "Aujourd'hui il fait très chaud à Séville."],
    ["A2", "El perro corre rápido por la carretera.", "« rr » roulé", "Le chien court vite sur la route."],
    ["B1", "Pero el perro de Rosa ladra mucho.", "« r » simple contre « rr »", "Mais le chien de Rosa aboie beaucoup."],
    ["B1", "Me gustaría reservar una mesa para dos.", "« r » roulé en début de mot", "Je voudrais réserver une table pour deux."],
    ["B1", "Juan juega con su hermano en el jardín.", "La jota /x/", "Juan joue avec son frère dans le jardin."],
    ["B2", "Si lo hubiera sabido, habría venido antes.", "« b » et « v » identiques", "Si je l'avais su, je serais venu avant."],
    ["B2", "La guerra y la guitarra son palabras difíciles.", "« gu » + rr", "« Guerre » et « guitare » sont des mots difficiles."],
    ["B2", "Desafortunadamente, no pudimos llegar a tiempo.", "Mot long, accent tonique", "Malheureusement, nous n'avons pas pu arriver à l'heure."],
    ["C1", "Erre con erre cigarro, erre con erre barril.", "Virelangue du « rr »", "Virelangue sur le R."],
    ["C1", "Tres tristes tigres tragaban trigo en un trigal.", "« tr » enchaînés", "Trois tristes tigres avalaient du blé dans un champ."],
    ["C2", "El cielo está enladrillado, ¿quién lo desenladrillará?", "Virelangue « ll » et « dr »", "Le ciel est carrelé, qui le décarrellera ?"],
  ],
  it: [
    ["A1", "Ciao, come stai?", "« c » doux, intonation", "Salut, comment ça va ?"],
    ["A1", "Vorrei un caffè, per favore.", "Consonnes doubles « rr », « ff »", "Je voudrais un café, s'il vous plaît."],
    ["A1", "Grazie mille, sei molto gentile.", "« z » et « g » doux", "Merci beaucoup, tu es très gentil."],
    ["A2", "Gli spaghetti sono buonissimi.", "Le son « gli »", "Les spaghettis sont délicieux."],
    ["A2", "La pizza è troppo calda.", "Doubles « zz », « pp »", "La pizza est trop chaude."],
    ["A2", "Domani andiamo al mare con gli amici.", "Fluidité et « gli »", "Demain on va à la mer avec les amis."],
    ["B1", "Ho bisogno di un bicchiere d'acqua.", "« ch » dur, « cqu »", "J'ai besoin d'un verre d'eau."],
    ["B1", "Sono stanco, ma voglio uscire stasera.", "« gl » et « sc »", "Je suis fatigué, mais je veux sortir ce soir."],
    ["B1", "Che cosa ne pensi di questo film?", "« che » / « qu »", "Qu'est-ce que tu penses de ce film ?"],
    ["B2", "Il figlio della signora è già arrivato.", "« gli », « gn », doubles", "Le fils de la dame est déjà arrivé."],
    ["B2", "Avrei voluto partire prima, ma c'era traffico.", "Conditionnel, « ff »", "J'aurais voulu partir plus tôt, mais il y avait des bouchons."],
    ["B2", "Nonostante tutto, ce l'abbiamo fatta.", "Doubles « tt », « bb »", "Malgré tout, on y est arrivés."],
    ["C1", "Sopra la panca la capra campa, sotto la panca la capra crepa.", "Virelangue « p » / « c »", "Sur le banc la chèvre vit, sous le banc la chèvre meurt."],
    ["C1", "Trentatré trentini entrarono a Trento tutti e trentatré trotterellando.", "Virelangue « tr »", "Trente-trois Trentins entrèrent à Trente en trottinant."],
    ["C2", "Apelle figlio di Apollo fece una palla di pelle di pollo.", "Virelangue « ll », « gli »", "Apelle, fils d'Apollon, fit une balle en peau de poulet."],
  ],
  fr: [
    ["A1", "Bonjour, je m'appelle Paul.", "Le « on » nasal, le « j »", "Hello, my name is Paul."],
    ["A1", "Je voudrais un croissant, s'il vous plaît.", "Le « r » français, nasales", "I'd like a croissant, please."],
    ["A1", "Il fait beau aujourd'hui.", "« au », « ui »", "The weather is nice today."],
    ["A2", "Tu as vu la rue ?", "« u » contre « ou »", "Did you see the street?"],
    ["A2", "Un bon vin blanc.", "Les quatre nasales", "A good white wine."],
    ["A2", "Les enfants sont en vacances.", "Liaisons obligatoires", "The children are on holiday."],
    ["B1", "Je ne sais pas ce que tu veux dire.", "« e » muet, « eu »", "I don't know what you mean."],
    ["B1", "Il y a beaucoup de grenouilles.", "« gn » / « ouille »", "There are lots of frogs."],
    ["B1", "Qu'est-ce que tu fais ce week-end ?", "Rythme de l'oral", "What are you doing this weekend?"],
    ["B2", "Les chaussettes de l'archiduchesse sont-elles sèches ?", "« s » contre « ch »", "Are the archduchess's socks dry?"],
    ["B2", "Un chasseur sachant chasser doit savoir chasser sans son chien.", "« s » / « ch » rapide", "A hunter who knows how to hunt must hunt without his dog."],
    ["B2", "Ton thé t'a-t-il ôté ta toux ?", "« t » et voyelles", "Did your tea cure your cough?"],
    ["C1", "Je veux et j'exige d'exquises excuses.", "« x », « j », « qu »", "I want and demand exquisite apologies."],
    ["C1", "Si six scies scient six cyprès, six cent six scies scient six cent six cyprès.", "Virelangue « s »", "If six saws saw six cypresses…"],
    ["C2", "Les vers verts levèrent le verre vert vers le ver vert.", "Homophones « ver/vert/verre/vers »", "The green worms raised the green glass toward the green worm."],
  ],
};

export const PHRASES: Record<LangCode, Phrase[]> = Object.fromEntries(
  Object.entries(rows).map(([lang, list]) => [lang, list.map(([level, text, focus, tr]) => ({ level, text, focus, tr }))])
) as Record<LangCode, Phrase[]>;
