import type { LangCode } from "../lib/languages";

export type Register = "courant" | "familier" | "argot" | "vulgaire";

export interface Slang {
  id: string;
  lang: LangCode;
  expr: string;
  meaning: string;
  literal?: string;
  example: string;
  exampleTr: string;
  register: Register;
  category: string;
  region?: string;
}

export const SLANG_CATEGORIES = [
  "Conversation",
  "Réactions",
  "Accord & refus",
  "État & émotions",
  "Sorties & potes",
  "Travail & études",
  "Expressions imagées",
  "Jeunes & internet",
] as const;

type Row = [expr: string, meaning: string, example: string, exampleTr: string, register: Register, category: string, literal?: string, region?: string];

const EN: Row[] = [
  ["It's up to you", "C'est toi qui vois / comme tu veux", "Pizza or sushi tonight? — It's up to you.", "Pizza ou sushi ce soir ? — C'est toi qui vois.", "courant", "Accord & refus", "C'est jusqu'à toi"],
  ["No worries", "Pas de souci / de rien", "Thanks for waiting! — No worries.", "Merci d'avoir attendu ! — Pas de souci.", "courant", "Conversation"],
  ["My bad", "Ma faute, désolé", "My bad, I sent you the wrong file.", "Désolé, c'est ma faute, je t'ai envoyé le mauvais fichier.", "familier", "Conversation", "Mon mauvais"],
  ["I'm down / I'm in", "Je suis partant", "Wanna grab a coffee? — I'm down.", "On va prendre un café ? — Je suis partant.", "familier", "Accord & refus"],
  ["What's up?", "Quoi de neuf ? / Ça dit quoi ?", "Hey man, what's up? — Not much, you?", "Salut, quoi de neuf ? — Pas grand-chose, et toi ?", "familier", "Conversation"],
  ["How's it going?", "Comment ça va ?", "Hey Sarah, how's it going?", "Salut Sarah, comment ça va ?", "courant", "Conversation"],
  ["Hang out", "Traîner ensemble, passer du temps", "We hung out at Sam's place all afternoon.", "On a traîné chez Sam tout l'après-midi.", "familier", "Sorties & potes"],
  ["Catch up", "Se donner des nouvelles / rattraper", "Let's grab lunch and catch up.", "Déjeunons ensemble pour se donner des nouvelles.", "courant", "Sorties & potes"],
  ["No big deal", "Pas grave, rien de grave", "I forgot your birthday — sorry! — No big deal.", "J'ai oublié ton anniv, désolé ! — Pas grave.", "familier", "Conversation"],
  ["Fair enough", "C'est juste / OK, je comprends", "I can't come, I'm working. — Fair enough.", "Je peux pas venir, je bosse. — OK, ça se comprend.", "courant", "Accord & refus"],
  ["Makes sense", "Ça se tient / C'est logique", "We should leave early to avoid traffic. — Makes sense.", "On devrait partir tôt pour éviter les bouchons. — Logique.", "courant", "Accord & refus"],
  ["Sounds good", "Ça marche / Ça me va", "Meet at 7? — Sounds good!", "On se retrouve à 19h ? — Ça marche !", "courant", "Accord & refus"],
  ["I'm on it", "Je m'en occupe", "Can someone fix the bug? — I'm on it.", "Quelqu'un peut corriger le bug ? — Je m'en occupe.", "courant", "Travail & études"],
  ["Let's call it a day", "On s'arrête là pour aujourd'hui", "It's 8 pm, let's call it a day.", "Il est 20h, on s'arrête là pour aujourd'hui.", "courant", "Travail & études", "Appelons ça une journée"],
  ["On the same page", "Sur la même longueur d'onde, d'accord", "Before the meeting, let's make sure we're on the same page.", "Avant la réunion, vérifions qu'on est d'accord.", "courant", "Travail & études", "Sur la même page"],
  ["Piece of cake", "Fastoche, du gâteau", "The exam was a piece of cake.", "L'exam était fastoche.", "familier", "Expressions imagées", "Un morceau de gâteau"],
  ["Out of the blue", "De nulle part, à l'improviste", "He called me out of the blue after five years.", "Il m'a appelé de nulle part après cinq ans.", "courant", "Expressions imagées", "Hors du bleu"],
  ["Not my cup of tea", "Pas mon truc", "Horror movies aren't really my cup of tea.", "Les films d'horreur, c'est pas trop mon truc.", "courant", "Expressions imagées", "Pas ma tasse de thé"],
  ["Go with the flow", "Suivre le mouvement, ne pas se prendre la tête", "No plan for the weekend, I'll just go with the flow.", "Pas de plan ce week-end, je verrai bien.", "courant", "Expressions imagées", "Aller avec le courant"],
  ["I'm broke", "Je suis fauché", "I can't go out this week, I'm broke.", "Je peux pas sortir cette semaine, je suis fauché.", "familier", "État & émotions", "Je suis cassé"],
  ["I'm beat", "Je suis crevé", "What a day… I'm beat.", "Quelle journée… je suis crevé.", "familier", "État & émotions", "Je suis battu"],
  ["I can't be bothered", "J'ai la flemme", "I can't be bothered to cook tonight.", "J'ai la flemme de cuisiner ce soir.", "familier", "État & émotions", undefined, "Surtout UK, compris partout"],
  ["Chill (out)", "Se détendre / calme-toi / tranquille", "Chill out, we've got plenty of time.", "Détends-toi, on a largement le temps.", "familier", "État & émotions"],
  ["Hang in there", "Tiens bon / Courage", "Exams are almost over, hang in there!", "Les exams sont presque finis, tiens bon !", "courant", "État & émotions", "Reste accroché là"],
  ["For real?", "Sérieux ?", "She quit her job. — For real?", "Elle a démissionné. — Sérieux ?", "familier", "Réactions"],
  ["No way!", "Pas possible ! / Jamais de la vie !", "I got the job! — No way! Congrats!", "J'ai eu le poste ! — Pas possible ! Bravo !", "familier", "Réactions", "Pas de chemin"],
  ["That's sick!", "C'est trop bien ! / C'est ouf !", "You got front-row tickets? That's sick!", "T'as des places au premier rang ? C'est ouf !", "argot", "Réactions", "C'est malade"],
  ["Give it a shot", "Tente le coup", "You've never tried surfing? Give it a shot!", "T'as jamais essayé le surf ? Tente le coup !", "courant", "Conversation", "Donne-lui un tir"],
  ["Hit me up", "Fais-moi signe / Écris-moi", "If you're in town, hit me up.", "Si tu passes en ville, fais-moi signe.", "familier", "Sorties & potes", "Frappe-moi"],
  ["To bail (on someone)", "Se désister au dernier moment, lâcher qqn", "He bailed on us at the last minute.", "Il nous a lâchés à la dernière minute.", "argot", "Sorties & potes"],
  ["To ghost someone", "Disparaître sans donner de nouvelles", "We went on two dates and then she ghosted me.", "On est sortis deux fois et elle a disparu sans nouvelles.", "argot", "Jeunes & internet", "Fantômer quelqu'un"],
  ["Low-key", "Un peu, discrètement, en vrai", "I'm low-key obsessed with this song.", "En vrai, je suis un peu obsédé par cette chanson.", "argot", "Jeunes & internet", "Clé basse"],
  ["Vibe", "Ambiance, feeling", "This café has such a good vibe.", "Ce café a une super ambiance.", "familier", "Jeunes & internet"],
  ["TBH (to be honest)", "Franchement / Pour être honnête", "TBH, I didn't like the ending.", "Franchement, j'ai pas aimé la fin.", "familier", "Jeunes & internet"],
  ["Gonna / wanna / gotta", "going to / want to / got to (à l'oral)", "I gotta go, I'm gonna be late.", "Faut que j'y aille, je vais être en retard.", "familier", "Conversation"],
  ["Kinda / sort of", "Un peu, genre, plutôt", "I'm kinda tired, to be honest.", "Je suis un peu fatigué, pour être honnête.", "familier", "Conversation"],
  ["I'm all ears", "Je suis tout ouïe", "You have a plan? I'm all ears.", "T'as un plan ? Je t'écoute.", "courant", "Expressions imagées", "Je suis tout oreilles"],
];

const ES: Row[] = [
  ["¿Qué tal?", "Ça va ? / Comment ça va ?", "¡Hola Marta! ¿Qué tal todo?", "Salut Marta ! Comment ça va ?", "courant", "Conversation", "Quoi tel ?", "Partout"],
  ["Vale", "D'accord, OK", "¿Quedamos a las ocho? — Vale.", "On se retrouve à 20h ? — OK.", "familier", "Accord & refus", "Ça vaut", "Espagne"],
  ["Me da igual", "Ça m'est égal", "¿Pizza o pasta? — Me da igual.", "Pizza ou pâtes ? — Ça m'est égal.", "courant", "Accord & refus", "Ça me donne égal"],
  ["No pasa nada", "C'est pas grave / Pas de souci", "Perdón por llegar tarde. — No pasa nada.", "Désolé pour le retard. — C'est pas grave.", "courant", "Conversation", "Il ne se passe rien"],
  ["Quedar", "Se retrouver, avoir rendez-vous", "¿Quedamos mañana para tomar algo?", "On se voit demain pour boire un verre ?", "courant", "Sorties & potes", "Rester"],
  ["¡Qué fuerte!", "C'est dingue ! / Pas possible !", "¿Se casan después de un mes? ¡Qué fuerte!", "Ils se marient après un mois ? C'est dingue !", "familier", "Réactions", "Que fort !", "Espagne"],
  ["¿En serio?", "Sérieux ?", "Me ha tocado la lotería. — ¿En serio?", "J'ai gagné au loto. — Sérieux ?", "courant", "Réactions"],
  ["¡Qué va!", "Mais non ! Pas du tout !", "¿Estás enfadado? — ¡Qué va!", "T'es fâché ? — Mais non, pas du tout !", "familier", "Réactions", "Que va !"],
  ["Guay", "Cool, génial", "Tu chaqueta es muy guay.", "Ta veste est trop cool.", "familier", "Réactions", undefined, "Espagne"],
  ["Chévere", "Cool, génial", "La fiesta estuvo chévere.", "La fête était géniale.", "familier", "Réactions", undefined, "Amérique latine"],
  ["Mola / Me mola", "C'est cool / J'aime bien", "Me mola mucho este grupo.", "J'aime trop ce groupe.", "argot", "Jeunes & internet", undefined, "Espagne"],
  ["¡Qué pasada!", "C'est génial ! C'est ouf !", "Has visto las vistas? ¡Qué pasada!", "T'as vu la vue ? C'est ouf !", "familier", "Réactions", "Quel passage !", "Espagne"],
  ["¿Qué onda?", "Quoi de neuf ? / Ça dit quoi ?", "¿Qué onda, güey? ¿Todo bien?", "Ça dit quoi, mec ? Tout va bien ?", "familier", "Conversation", "Quelle onde ?", "Mexique, Amérique centrale"],
  ["Buena onda", "Sympa, bonnes vibes", "Tu hermano es muy buena onda.", "Ton frère est super sympa.", "familier", "Sorties & potes", "Bonne onde", "Amérique latine, compris partout"],
  ["Tío / tía", "Mec / meuf (entre potes)", "Tío, ¿has visto el partido?", "Mec, t'as vu le match ?", "argot", "Sorties & potes", "Oncle / tante", "Espagne"],
  ["¡Venga!", "Allez ! / Vas-y ! / OK !", "¡Venga, vámonos que es tarde!", "Allez, on y va, il est tard !", "familier", "Conversation", "Viens !", "Espagne"],
  ["En plan…", "Genre…", "Estaba en plan, no sé qué decir.", "J'étais genre, je sais pas quoi dire.", "argot", "Jeunes & internet", "En plan", "Espagne"],
  ["Estar hecho polvo", "Être crevé", "Después del gimnasio estoy hecho polvo.", "Après la salle, je suis crevé.", "familier", "État & émotions", "Être réduit en poussière"],
  ["Ponerse las pilas", "Se bouger, s'y mettre sérieusement", "Tienes que ponerte las pilas si quieres aprobar.", "Faut que tu te bouges si tu veux réussir.", "familier", "Travail & études", "Se mettre les piles"],
  ["Ser pan comido", "Être fastoche", "El examen fue pan comido.", "L'exam était fastoche.", "familier", "Expressions imagées", "Être du pain mangé"],
  ["Costar un ojo de la cara", "Coûter les yeux de la tête", "Ese coche cuesta un ojo de la cara.", "Cette voiture coûte les yeux de la tête.", "courant", "Expressions imagées", "Coûter un œil du visage"],
  ["Tomar el pelo", "Se moquer de qqn, le faire marcher", "¿Me estás tomando el pelo?", "Tu te fiches de moi ?", "courant", "Expressions imagées", "Prendre le cheveu"],
  ["Estar en las nubes", "Être dans la lune", "Perdona, estaba en las nubes.", "Pardon, j'étais dans la lune.", "courant", "Expressions imagées", "Être dans les nuages"],
  ["No tener pelos en la lengua", "Ne pas mâcher ses mots", "Mi abuela no tiene pelos en la lengua.", "Ma grand-mère ne mâche pas ses mots.", "courant", "Expressions imagées", "Ne pas avoir de poils sur la langue"],
  ["Echar una mano", "Donner un coup de main", "¿Me echas una mano con la mudanza?", "Tu me donnes un coup de main pour le déménagement ?", "courant", "Conversation", "Jeter une main"],
  ["¡Ojo!", "Attention !", "¡Ojo con el escalón!", "Attention à la marche !", "courant", "Conversation", "Œil !"],
  ["Ni idea", "Aucune idée", "¿A qué hora empieza? — Ni idea.", "Ça commence à quelle heure ? — Aucune idée.", "courant", "Conversation"],
  ["A lo mejor", "Peut-être", "A lo mejor voy a la fiesta.", "Peut-être que j'irai à la fête.", "courant", "Conversation", "Au meilleur"],
  ["Dar la lata", "Casser les pieds", "Deja de darme la lata con eso.", "Arrête de me casser les pieds avec ça.", "familier", "État & émotions", "Donner la canette"],
  ["¡Qué rollo!", "Quelle barbe ! Quelle galère !", "¿Hay que trabajar el sábado? ¡Qué rollo!", "Il faut bosser samedi ? Quelle galère !", "familier", "Réactions", "Quel rouleau !"],
  ["Pasarlo bomba", "S'éclater", "En el concierto lo pasamos bomba.", "On s'est éclatés au concert.", "familier", "Sorties & potes", "Le passer bombe", "Espagne"],
  ["Estar al tanto", "Être au courant", "Mantenme al tanto, ¿vale?", "Tiens-moi au courant, OK ?", "courant", "Travail & études"],
  ["Ahorita", "Tout de suite… ou plus tard (ça dépend !)", "Ahorita lo hago, te lo juro.", "Je le fais tout de suite, promis.", "familier", "Conversation", "Petit maintenant", "Mexique"],
];

const IT: Row[] = [
  ["Boh", "Chais pas / Aucune idée", "Dove sono le chiavi? — Boh!", "Où sont les clés ? — Chais pas !", "familier", "Réactions"],
  ["Dai!", "Allez ! / Arrête ! / Sérieux ?", "Dai, andiamo che è tardi!", "Allez, on y va, il est tard !", "familier", "Conversation", "Donne !"],
  ["Ma dai!", "Sans blague ! / Pas possible !", "Si sono lasciati. — Ma dai!", "Ils ont rompu. — Sans blague !", "familier", "Réactions"],
  ["Magari!", "Si seulement ! / Peut-être", "Vinci tu la partita? — Magari!", "Tu gagnes le match ? — Si seulement !", "courant", "Réactions"],
  ["Figurati", "De rien / Je t'en prie / Tu parles !", "Grazie per l'aiuto! — Figurati!", "Merci pour ton aide ! — Je t'en prie !", "courant", "Conversation", "Imagine-toi"],
  ["Che figata!", "Trop cool !", "Vai a Tokyo? Che figata!", "Tu vas à Tokyo ? Trop cool !", "argot", "Réactions"],
  ["Allora…", "Alors… / Bon…", "Allora, cosa facciamo stasera?", "Bon, on fait quoi ce soir ?", "courant", "Conversation"],
  ["Mi raccomando", "Je compte sur toi / Surtout…", "Chiamami quando arrivi, mi raccomando!", "Appelle-moi quand tu arrives, surtout !", "courant", "Conversation", "Je me recommande"],
  ["In bocca al lupo", "Bonne chance (on répond « Crepi! »)", "Domani hai l'esame? In bocca al lupo! — Crepi!", "T'as l'exam demain ? Bonne chance ! — Merci !", "courant", "Expressions imagées", "Dans la gueule du loup"],
  ["Non vedo l'ora", "J'ai trop hâte", "Non vedo l'ora di partire per le vacanze!", "J'ai trop hâte de partir en vacances !", "courant", "État & émotions", "Je ne vois pas l'heure"],
  ["Meno male", "Heureusement / Ouf", "Il treno è in ritardo, meno male!", "Le train est en retard, heureusement !", "courant", "Réactions", "Moins mal"],
  ["Mannaggia!", "Mince ! Zut !", "Mannaggia, ho perso il bus!", "Zut, j'ai raté le bus !", "familier", "Réactions", undefined, "Surtout le Sud, compris partout"],
  ["Cavolo!", "Punaise ! Mince !", "Cavolo, è già mezzanotte!", "Punaise, il est déjà minuit !", "familier", "Réactions", "Chou !"],
  ["Che palle!", "Fait chier ! Quelle barbe !", "Piove di nuovo, che palle!", "Il pleut encore, quelle barbe !", "vulgaire", "Réactions", "Quelles boules !"],
  ["Che casino!", "Quel bazar !", "Che casino in questa stanza!", "Quel bazar dans cette chambre !", "familier", "Réactions"],
  ["Ci sta", "Ça se tient / Ça passe", "Una pizza stasera? — Ci sta!", "Une pizza ce soir ? — Ça passe !", "argot", "Jeunes & internet", "Ça y tient"],
  ["Tipo", "Genre", "Era tipo enorme, non ci credevo.", "C'était genre énorme, j'y croyais pas.", "argot", "Jeunes & internet", "Type"],
  ["Spacca!", "Ça déchire !", "Questa canzone spacca!", "Cette chanson déchire !", "argot", "Jeunes & internet", "Ça casse"],
  ["Un sacco", "Énormément, un max", "Mi piace un sacco questo posto.", "J'adore trop cet endroit.", "familier", "Conversation", "Un sac"],
  ["Va be' / Vabbè", "Bon, ok, tant pis", "Non viene? Vabbè, andiamo senza di lui.", "Il vient pas ? Bon, on y va sans lui.", "familier", "Accord & refus"],
  ["Insomma", "Bref / Bof", "Com'è andata? — Insomma…", "Comment ça s'est passé ? — Bof…", "courant", "Conversation"],
  ["Non fa niente", "C'est pas grave", "Scusa il ritardo! — Non fa niente.", "Désolé pour le retard ! — C'est pas grave.", "courant", "Conversation", "Ça ne fait rien"],
  ["Tanto vale", "Autant…", "Ormai è tardi, tanto vale restare.", "Maintenant il est tard, autant rester.", "courant", "Conversation", "Autant vaut"],
  ["Sei fuori?", "T'es fou ?", "Vuoi nuotare a gennaio? Sei fuori?", "Tu veux nager en janvier ? T'es fou ?", "argot", "Réactions", "T'es dehors ?"],
  ["Essere al verde", "Être fauché", "Questo mese sono al verde.", "Ce mois-ci, je suis fauché.", "familier", "État & émotions", "Être au vert"],
  ["Avere un diavolo per capello", "Être d'une humeur massacrante", "Oggi il capo ha un diavolo per capello.", "Aujourd'hui, le chef est d'une humeur massacrante.", "courant", "Expressions imagées", "Avoir un diable par cheveu"],
  ["Fare una figuraccia", "Se taper la honte", "Ho sbagliato nome, che figuraccia!", "Je me suis trompé de prénom, la honte !", "familier", "État & émotions", "Faire une sale figure"],
  ["Prendere in giro", "Se moquer de qqn", "Mi stai prendendo in giro?", "Tu te moques de moi ?", "courant", "Conversation", "Prendre en tour"],
  ["Fare due chiacchiere", "Papoter, discuter un peu", "Passa da me, facciamo due chiacchiere.", "Passe chez moi, on papote un peu.", "courant", "Sorties & potes", "Faire deux bavardages"],
  ["Fare la scarpetta", "Saucer son assiette avec du pain", "Il sugo è troppo buono, faccio la scarpetta!", "La sauce est trop bonne, je sauce !", "courant", "Expressions imagées", "Faire la petite chaussure"],
  ["Fare il ponte", "Faire le pont", "Giovedì è festa, facciamo il ponte?", "Jeudi c'est férié, on fait le pont ?", "courant", "Travail & études"],
  ["Stai fresco!", "Tu peux toujours courir !", "Pensi che ti presti la macchina? Stai fresco!", "Tu crois que je te prête la voiture ? Tu peux courir !", "familier", "Accord & refus", "Reste frais !"],
  ["Ti voglio bene", "Je t'aime (amis, famille) — ≠ « ti amo » (amoureux)", "Sei la mia migliore amica, ti voglio bene.", "T'es ma meilleure amie, je t'adore.", "courant", "État & émotions", "Je te veux du bien"],
];

const FR: Row[] = [
  ["Ça marche", "OK, d'accord (sounds good)", "On se voit à 18h ? — Ça marche !", "See you at 6? — Sounds good!", "courant", "Accord & refus", "That walks"],
  ["Ça roule", "Ça marche / Tout va bien", "Je passe te prendre à 8h. — Ça roule !", "I'll pick you up at 8. — Cool!", "familier", "Accord & refus", "That rolls"],
  ["C'est pas grave", "Pas grave (no big deal)", "J'ai cassé ton verre… — C'est pas grave.", "I broke your glass… — No big deal.", "courant", "Conversation"],
  ["T'inquiète / tkt", "Pas de souci, t'en fais pas", "Merci pour le coup de main ! — T'inquiète.", "Thanks for the help! — No worries.", "familier", "Conversation", "Don't worry"],
  ["Du coup", "Donc, par conséquent (so)", "Il pleuvait, du coup on est restés à la maison.", "It was raining, so we stayed home.", "familier", "Conversation", "Of the blow"],
  ["Genre", "Genre, comme (like)", "Il était genre super énervé.", "He was like super angry.", "argot", "Jeunes & internet"],
  ["Grave", "Carrément, très (totally)", "T'as aimé le film ? — Grave !", "Did you like the movie? — Totally!", "argot", "Jeunes & internet", "Serious"],
  ["Carrément", "Totalement, complètement", "Tu viens ce soir ? — Carrément !", "Are you coming tonight? — Absolutely!", "familier", "Accord & refus", "Squarely"],
  ["Avoir la flemme", "Ne pas avoir envie (paresse)", "J'ai la flemme d'aller courir.", "I can't be bothered to go running.", "familier", "État & émotions"],
  ["Kiffer", "Adorer, aimer (to love)", "Je kiffe trop cette chanson.", "I really love this song.", "argot", "Jeunes & internet"],
  ["Chelou", "Bizarre (verlan de « louche »)", "Il est un peu chelou, ce mec.", "That guy is a bit weird.", "argot", "Jeunes & internet", undefined, "Partout en France"],
  ["Ouf", "Fou, incroyable (verlan de « fou »)", "Le concert était ouf !", "The concert was insane!", "argot", "Réactions"],
  ["Relou", "Lourd, pénible (verlan de « lourd »)", "Il est relou à toujours se plaindre.", "He's so annoying, always complaining.", "argot", "État & émotions"],
  ["Avoir le seum", "Être dégoûté, frustré", "J'ai raté le train de deux minutes, j'ai le seum.", "I missed the train by two minutes, I'm so salty.", "argot", "État & émotions", "To have the venom"],
  ["C'est mort", "C'est fichu / Pas question", "Sortir ce soir ? C'est mort, je bosse.", "Go out tonight? No way, I'm working.", "argot", "Accord & refus", "It's dead"],
  ["Laisse tomber", "Oublie / Laisse (forget it)", "Laisse tomber, je vais le faire moi-même.", "Forget it, I'll do it myself.", "familier", "Conversation", "Let fall"],
  ["Tant pis", "Tant pis (too bad)", "Il n'y a plus de place ? Tant pis.", "No seats left? Oh well.", "courant", "Conversation", "So much worse"],
  ["Je m'en fiche", "Ça m'est égal (I don't care)", "Tu préfères quel film ? — Je m'en fiche.", "Which movie do you prefer? — I don't care.", "familier", "Accord & refus"],
  ["Ça te dit ?", "Ça te tente ? (do you feel like it?)", "Un ciné ce soir, ça te dit ?", "Movie tonight, you up for it?", "familier", "Sorties & potes", "Does it tell you?"],
  ["Un pote", "Un ami (buddy)", "Je sors avec des potes ce soir.", "I'm going out with some buddies tonight.", "familier", "Sorties & potes"],
  ["Bosser", "Travailler (to work)", "Je bosse tout le week-end.", "I'm working all weekend.", "familier", "Travail & études"],
  ["Bouffer", "Manger (to eat)", "On va bouffer où ?", "Where are we gonna eat?", "familier", "Sorties & potes"],
  ["Être crevé", "Être épuisé (beat)", "Je suis crevé après cette semaine.", "I'm beat after this week.", "familier", "État & émotions", "To be punctured"],
  ["Avoir la pêche", "Avoir la forme, être plein d'énergie", "Ce matin j'ai la pêche !", "I'm full of energy this morning!", "familier", "État & émotions", "To have the peach"],
  ["Avoir le cafard", "Avoir le blues", "Le dimanche soir, j'ai souvent le cafard.", "I often get the blues on Sunday nights.", "courant", "État & émotions", "To have the cockroach"],
  ["C'est la galère", "C'est compliqué, la misère", "Trouver un appart à Paris, c'est la galère.", "Finding a flat in Paris is a nightmare.", "familier", "État & émotions", "It's the galley"],
  ["Nickel", "Parfait (perfect)", "Le rapport est nickel, merci.", "The report is perfect, thanks.", "familier", "Réactions"],
  ["Poser un lapin", "Ne pas venir à un rendez-vous (stand someone up)", "Elle m'a posé un lapin hier soir.", "She stood me up last night.", "familier", "Expressions imagées", "To put down a rabbit"],
  ["Coûter un bras", "Coûter très cher (cost an arm and a leg)", "Ce téléphone coûte un bras.", "This phone costs an arm and a leg.", "familier", "Expressions imagées", "To cost an arm"],
  ["Il pleut des cordes", "Il pleut très fort (it's pouring)", "Prends un parapluie, il pleut des cordes.", "Take an umbrella, it's pouring.", "courant", "Expressions imagées", "It's raining ropes"],
  ["Être à l'ouest", "Être distrait, à côté de la plaque", "Désolé, je suis complètement à l'ouest aujourd'hui.", "Sorry, I'm totally out of it today.", "familier", "Expressions imagées", "To be in the west"],
  ["Se casser", "Partir (to leave, to split)", "Bon, je me casse, à demain !", "Right, I'm off, see you tomorrow!", "familier", "Sorties & potes", "To break oneself"],
  ["Mettre les bouts", "Partir, s'en aller", "Il est tard, on met les bouts ?", "It's late, shall we head out?", "argot", "Sorties & potes", "To put the ends"],
];

function build(lang: LangCode, rows: Row[]): Slang[] {
  return rows.map(([expr, meaning, example, exampleTr, register, category, literal, region], i) => ({
    id: `${lang}-${i}`,
    lang,
    expr,
    meaning,
    example,
    exampleTr,
    register,
    category,
    literal,
    region: region ?? "Partout",
  }));
}

export const SLANG: Record<LangCode, Slang[]> = {
  en: build("en", EN),
  es: build("es", ES),
  it: build("it", IT),
  fr: build("fr", FR),
};
