# Analyse des applications existantes

Avant de construire Verbo, on a passé en revue les applications de référence pour apprendre une langue ou traduire. Pour chacune : ce qui marche bien, ce qui manque, et comment Verbo le reprend.

| Application | Ce qui marche bien | Limite | Dans Verbo |
|---|---|---|---|
| **Duolingo** | Série de jours (streak), XP, objectif quotidien, leçons courtes, exercices variés (QCM, traduction, remettre en ordre, dictée) | Très scolaire, corrections peu expliquées, peu de vraie conversation | Série + XP + objectif du jour sur l'accueil. Page **Exercices** avec 5 types (QCM, trous, traduction, remettre en ordre, dictée) générés selon ton niveau |
| **Duolingo Max / Speak / Praktika** | Conversation libre ou jeux de rôle avec une IA, retour sur chaque phrase | Souvent trop gentil, corrections partielles | **Coach IA** : conversation, débat, 12 jeux de rôle, test de niveau, prof particulier. Chaque message est corrigé en détail, avec 3 niveaux de sévérité (jusqu'à « Impitoyable ») |
| **ELSA Speak** | Note de prononciation mot par mot, sons ciblés | Payant, limité à l'anglais | **Prononciation** : reconnaissance vocale, score sur 100, mots colorés (correct / approximatif / raté), mode shadowing, analyse IA des sons problématiques avec accentuation et exercices ciblés |
| **Anki** | Répétition espacée (SM-2) : on revoit une carte juste avant de l'oublier | Austère, il faut créer ses cartes soi-même | **Révisions** : algorithme SM-2, cartes créées en un clic depuis toutes les pages, mode « comprendre » et mode « produire à l'écrit », stats nouvelles / en cours / maîtrisées |
| **DeepL** | Traductions naturelles, alternatives de formulation | N'explique pas *pourquoi* | **Traduire** : traduction naturelle + 2 à 4 alternatives classées par registre (formel, courant, familier, argot) |
| **Reverso Context** | Exemples réels en contexte, correcteur | Interface chargée, publicités | Exemples en contexte pour chaque traduction + **Correcteur** de texte avec niveau CECR estimé |
| **LingQ / livres bilingues** | Glose mot à mot, vocabulaire extrait d'un texte | Lourd à mettre en place | **Mot à mot** : chaque bloc de la phrase est aligné avec sa traduction, et on touche un bloc pour avoir l'explication (conjugaison, genre, pourquoi ça change). Plus une traduction littérale et le vocabulaire clé à ajouter aux révisions |
| **Busuu** | Corrections de textes, explications de grammaire | Corrections par la communauté, lentes | Correcteur instantané qui liste **toutes** les fautes avec la règle, version corrigée et version « comme un natif » |
| **Memrise** | Vidéos de natifs, langage de la rue | Contenu limité en argot | **Argot & expressions** : ~135 expressions authentiques (EN, ES, IT, FR) avec sens, mot à mot, registre, région, exemple ; quiz ; génération illimitée par thème avec l'IA |
| **HelloTalk / Tandem** | Parler avec des natifs, corrections inline | Dépend de la dispo des gens | Le coach IA est disponible 24h/24, corrige inline et parle comme un natif (expressions courantes, pas que de l'anglais de manuel) |
| **Clozemaster** | Phrases à trous en contexte | Peu d'explications | Exercices « texte à trous » avec explication de la règle |
| **Babbel** | Dialogues de situations réelles | Parcours figé | 12 jeux de rôle réalistes (restaurant, entretien, bagage perdu, médecin…) où l'IA reste dans son personnage et ajoute des complications |

## Ce que Verbo ajoute

- **Carnet d'erreurs** : chaque faute (coach, correcteur, exercices) est enregistrée et classée par type (conjugaison, vocabulaire, naturel, faux ami…). Un bouton génère une série d'exercices ciblée sur *tes* erreurs récurrentes.
- **Sévérité réglable** : le coach ne fait pas de compliments gratuits. En mode « Impitoyable », une seule faute plafonne la note à 70.
- **Langue réelle** : le coach, les exercices et l'argot privilégient les expressions que tout le monde comprend (« It's up to you », « No worries », « Me da igual », « Figurati »…), en signalant ce qui est régional.
- **100 % navigateur** : pas de compte, pas de serveur. Les données restent sur l'appareil (export / import JSON possible).
