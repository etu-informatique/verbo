# Verbo — coach de langues strict

Verbo est une application web pour progresser en **anglais, espagnol, italien et français**. Elle marche sur ordinateur et sur téléphone, et s'installe comme une application (PWA).

Le cœur de l'app est un **coach IA exigeant** (propulsé par Claude) qui discute, débat et joue des rôles avec toi, et corrige **chaque** faute avec la règle derrière.

> Pourquoi ces fonctionnalités ? Voir l'[analyse des applications existantes](docs/ANALYSE.md) (Duolingo, ELSA, Anki, DeepL, Reverso, LingQ, Busuu, Memrise…).

## Fonctionnalités

| Onglet | Ce qu'il fait |
|---|---|
| 💬 **Coach IA** | Conversation libre, **débat** (le coach défend l'avis contraire), **12 jeux de rôle** (restaurant, entretien, aéroport…), **test de niveau** CECR, **prof particulier**. Chaque message est corrigé : fautes, explication, version corrigée, version « comme un natif », astuce, note sur 100. Dictée vocale et lecture à voix haute. |
| 🔁 **Traduire** | Traduction naturelle, **mot à mot** (blocs alignés et expliqués), traduction littérale, alternatives par registre (formel → argot), vocabulaire clé, pièges de grammaire, exemples en contexte. **Correcteur** de texte avec niveau CECR estimé. |
| 🎙️ **Prononciation** | Lis une phrase : score sur 100 et chaque mot coloré (correct, approximatif, raté). Mode **shadowing**, écoute lente, analyse IA des sons à travailler, accentuation, exercices ciblés. |
| ⚡ **Argot & expressions** | ~135 expressions de tous les jours (« It's up to you », « Me da igual », « Figurati », « Avoir la flemme »…) avec sens, mot à mot, registre et région. Quiz, et génération illimitée par thème avec l'IA. |
| 🏋️ **Exercices** | Séries générées pour ton niveau : QCM, texte à trous, traduction, remettre en ordre, dictée. Bouton « Contester » si ta réponse est juste mais différente. |
| 🧠 **Révisions** | Répétition espacée (algorithme SM-2, comme Anki). Cartes ajoutées en un clic depuis toutes les pages. |
| 📕 **Carnet d'erreurs** | Toutes tes fautes classées par type, et une série d'exercices ciblée sur tes erreurs récurrentes. |
| 🔥 **Progression** | Série de jours, XP, objectif quotidien, graphique de la semaine. |

La sévérité du coach se règle sur 3 niveaux : **Exigeant**, **Strict**, **Impitoyable**.

## Utilisation

1. Ouvre l'app (version en ligne via GitHub Pages, ou en local, voir plus bas).
2. Choisis ta langue maternelle, la langue à apprendre, ton niveau et la sévérité.
3. Colle ta **clé API Claude** (créée sur [console.anthropic.com](https://console.anthropic.com/settings/keys)) dans l'onboarding ou dans **Réglages**.

La clé est stockée **uniquement dans ton navigateur** (localStorage) et n'est envoyée qu'à `api.anthropic.com`. Sans clé, la prononciation, l'argot, les quiz et les révisions fonctionnent quand même.

Pour la voix (dictée et prononciation), utilise **Chrome, Edge ou Safari** : Firefox ne gère pas la reconnaissance vocale.

Sur téléphone : ouvre le site puis « Ajouter à l'écran d'accueil » pour l'avoir comme une app.

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:5173.

```bash
npm run build     # build de production dans dist/
npm run preview   # sert le build
```

## Technique

- React 19 + TypeScript + Vite, Tailwind CSS v4, Zustand (état persistant), React Router.
- IA : SDK officiel `@anthropic-ai/sdk`, appelé directement depuis le navigateur, avec **structured outputs** (réponses JSON validées par schéma). Modèle au choix : Claude Opus 5.5 (par défaut), Sonnet 5.5 ou Haiku 5.5. Le repli automatique côté serveur (`fallbacks: "default"`) est activé sur Opus et Sonnet.
- Voix : Web Speech API (synthèse + reconnaissance), aucun service tiers.
- Déploiement automatique sur GitHub Pages à chaque push sur `main` (`.github/workflows/deploy.yml`).

```
src/
  lib/        claude.ts (API), prompts.ts (prompts + schémas), speech.ts (voix),
              score.ts (notation prononciation / réponses), srs.ts (répétition espacée)
  store/      état persistant (réglages, progression, cartes, erreurs, conversations)
  data/       argot, phrases de prononciation, jeux de rôle, sujets de débat
  pages/      une page par onglet
  components/ UI partagée, mise en page, affichage des corrections
```
