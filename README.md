# Verbo — coach de langues gratuit et exigeant

Verbo est une application web pour progresser en **anglais, espagnol, italien et français**. Elle marche sur ordinateur et sur téléphone, et s'installe comme une application (PWA).

Le cœur de l'app est un **coach IA exigeant** qui discute, débat et joue des rôles avec toi, et corrige **chaque** faute avec la règle derrière.

**100 % gratuit : pas de clé API, pas d'abonnement.**

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

1. Ouvre l'app : https://etu-informatique.github.io/verbo/ (ou en local, voir plus bas).
2. Choisis ta langue maternelle, la langue à apprendre, ton niveau et la sévérité.
3. C'est tout : aucune clé, aucun compte obligatoire.

### Les moteurs d'IA (tous gratuits)

| Moteur | Compte ? | Limite | Pour qui |
|---|---|---|---|
| **Automatique** (par défaut) | Non | — | Utilise l'IA locale si elle est téléchargée, sinon l'IA en ligne, puis Puter si tu l'as connecté. |
| **En ligne, sans compte** ([LLM7.io](https://llm7.io)) | Non | Petit quota par jour et par connexion | Pour essayer tout de suite. |
| **Sur l'appareil** ([WebLLM](https://webllm.mlc.ai), modèle Qwen3) | Non | **Illimité**, privé, marche hors ligne | PC ou Android avec Chrome/Edge récent (WebGPU). Téléchargement unique : ≈ 1 Go (Léger) ou ≈ 2,3 Go (Précis). |
| **Puter** ([puter.com](https://puter.com)) | Compte Puter gratuit | Crédits gratuits Puter | Rapide sur tous les téléphones, y compris iPhone. |

Tout se règle dans **Réglages → Moteur d'IA**. Pour un usage quotidien sans limite, télécharge l'IA locale une fois (de préférence en Wi-Fi).

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
- IA gratuite : LLM7.io (cloud anonyme), WebLLM (modèle Qwen3 dans le navigateur via WebGPU, exécuté dans un Web Worker) et Puter.js. Les réponses sont contraintes par schéma JSON puis complétées si un champ manque (`src/lib/ai.ts`, `src/lib/localAi.ts`).
- Design : système généré avec le skill [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — Flat Design, teal + orange, Plus Jakarta Sans, thème clair/sombre, icônes SVG (Lucide), cibles tactiles de 44 px.
- Voix : Web Speech API (synthèse + reconnaissance), aucun service tiers.
- Déploiement automatique sur GitHub Pages à chaque push sur `main` (`.github/workflows/deploy.yml`).

```
src/
  lib/        ai.ts + localAi.ts (moteurs IA gratuits), prompts.ts (prompts + schémas), speech.ts (voix),
              score.ts (notation prononciation / réponses), srs.ts (répétition espacée)
  store/      état persistant (réglages, progression, cartes, erreurs, conversations)
  data/       argot, phrases de prononciation, jeux de rôle, sujets de débat
  pages/      une page par onglet
  components/ UI partagée, mise en page, affichage des corrections
```
