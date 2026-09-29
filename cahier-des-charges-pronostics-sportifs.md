# Plateforme de Pronostics & Analyse Sportive — Cahier des Charges Technique Complet

## 1. Vision

Construire une plateforme web qui collecte automatiquement des données sportives (matchs, équipes, joueurs, statistiques, cotes), les transforme en probabilités calibrées et explicables via plusieurs modèles statistiques/ML, et aide l'utilisateur à construire des combinaisons de paris autour d'une **cote cible**, sans jamais présenter une prédiction comme une certitude. Démarrage sur le football, architecture pensée dès le départ pour être multi-sport.

## 2. Objectifs

- Fournir une analyse de match reproductible et transparente (chaque probabilité doit être traçable à des features et à un modèle versionné).
- Permettre un flux de données remplaçable : un fournisseur externe peut être changé sans réécrire la couche métier.
- Fournir un moteur de génération de combinaisons piloté par une cote cible avec tolérance configurable.
- Mesurer en continu la qualité des modèles par backtesting (Brier score, log-loss, calibration, ROI simulé).
- Respecter une posture de jeu responsable : aucune "certitude", affichage systématique de l'incertitude.

## 3. Architecture globale

```
                         ┌─────────────────────────┐
                         │      FRONTEND (React)    │
                         │  Dashboard / Matches /    │
                         │  Predictions / Combos /   │
                         │  Target-Odds / Admin      │
                         └────────────┬──────────────┘
                                      │ REST/JWT
                         ┌────────────▼──────────────┐
                         │   API GATEWAY (DRF)        │
                         │  /api/v1/...               │
                         └────────────┬──────────────┘
        ┌───────────────┬────────────┼────────────┬───────────────┐
        │               │            │            │               │
 ┌──────▼─────┐  ┌──────▼─────┐ ┌───▼────────┐ ┌──▼─────────┐ ┌───▼────────┐
 │ Auth Svc   │  │ Sports/    │ │ Analysis   │ │ Combination│ │ AI Assist. │
 │            │  │ Match Svc  │ │ Engine     │ │ /Optimizer │ │ Service    │
 └──────┬─────┘  └──────┬─────┘ └───┬────────┘ └──┬─────────┘ └───┬────────┘
        │               │           │             │               │
        └───────────────┴─────┬─────┴─────────────┴───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   PostgreSQL          │
                    │   Redis (cache/queue) │
                    └──────────┬────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Celery Workers +     │
                    │  Celery Beat          │
                    │  (sync, ML, MonteCarlo│
                    │   backtests, alertes) │
                    └──────────┬────────────┘
                               │
                 ┌─────────────▼─────────────┐
                 │  DataProvider Abstraction   │
                 │  (Normalizer → Validator)   │
                 └─────────────┬─────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
 ┌──────▼───────┐      ┌───────▼────────┐      ┌───────▼───────┐
 │ Football API  │      │  Odds API(s)   │      │ Autres sports │
 │ (ex. API-Foot,│      │ (ex. OddsPapi) │      │ (V2/V3)       │
 │ football-data)│      │                │      │               │
 └───────────────┘      └────────────────┘      └───────────────┘
```

Principe clé : toute donnée externe passe par `Provider → Normalizer → Validator` avant d'entrer en base. Le moteur d'analyse et les modèles ne connaissent jamais le fournisseur d'origine, seulement le schéma interne.

## 4. Modules fonctionnels (vue d'ensemble)

Tableau condensé des 40+ modules. Détails approfondis pour les modules algorithmiques centraux en sections 9–16.

| # | Module | Objectif | Frontend | Endpoints clés | Modèles Django clés | Celery | Dépend de | Rôles | Phase |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Auth & Users | Inscription, JWT, rôles, 2FA | /login /register /profile | /auth/login/, /auth/refresh/, /users/me/ | CustomUser, Role, LoginHistory | — | — | Tous | MVP |
| 2 | Sports | Modèle générique multi-sport | /sports | /sports/ | Sport, SportType, SportMarket | — | — | Tous | MVP |
| 3 | Compétitions | Ligues, saisons, classements | /competitions | /competitions/, /standings/ | Country, Competition, Season, Round | sync_competitions | Sports | Tous | MVP |
| 4 | Équipes | Profils, effectif, forme | /teams/:id | /teams/, /teams/{id}/form/ | Team, TeamSeasonStat | sync_teams | Compétitions | Tous | MVP |
| 5 | Joueurs | Profils, stats, blessures | /players/:id | /players/, /players/{id}/injuries/ | Player, PlayerStat, Injury | sync_players, sync_injuries | Équipes | Tous | V2 |
| 6 | Matchs | Cycle de vie d'un match | /matches, /matches/:id | /matches/, /matches/{id}/ | Match, MatchEvent | sync_matches, sync_results | Équipes | Tous | MVP |
| 7 | Statistiques | Stats match/équipe génériques | /matches/:id (onglet Stats) | /matches/{id}/stats/ | MatchStat (schema-less JSONField par sport) | sync_statistics | Matchs | Tous | MVP |
| 8 | Forme | Indicateurs sur N derniers matchs | intégré fiche équipe | /teams/{id}/form/ | (calculé, non stocké ou TeamFormSnapshot) | update_form_cache | Matchs | Tous | MVP |
| 9 | H2H | Confrontations directes | onglet H2H | /matches/{id}/h2h/ | H2HRecord (vue matérialisée) | — | Matchs | Tous | MVP |
| 10 | Blessures/Absences | Impact des absences | onglet Compositions | /teams/{id}/injuries/ | Injury, Suspension | sync_injuries | Joueurs | Tous | V2 |
| 11 | Compositions | Line-up probable/officielle | onglet Compositions | /matches/{id}/lineups/ | Lineup, LineupPlayer | sync_lineups | Joueurs | Tous | V2 |
| 12 | Cotes | Historique et marchés | onglet Cotes | /matches/{id}/odds/ | Market, Odds, OddsHistory | sync_odds | Matchs | Tous | MVP |
| 13 | Bookmakers/Comparateur | Multi-fournisseurs cotes | /odds-comparator | /bookmakers/, /odds/compare/ | Bookmaker, ProviderSync | sync_odds | Cotes | Premium | V2 |
| 14 | Fournisseurs API | Abstraction Provider | admin only | interne | DataProviderConfig | monitor_quota | — | Admin | MVP |
| 15 | Synchronisation | Orchestration Celery Beat | admin only | interne | TaskLog | (orchestrateur) | tous sync_* | Admin | MVP |
| 16 | Marchés | Modèle générique de marché sportif | intégré | /markets/ | MarketType | — | Sports | Tous | MVP |
| 17 | Moteur d'analyse | Feature engineering central | onglet Analyse | /matches/{id}/analysis/ | FeatureSet | build_features | tous les modules data | Tous | MVP |
| 18 | Prédiction | Sortie probabiliste 1X2/BTTS/O-U | onglet Prédictions | /matches/{id}/predictions/ | Prediction, PredictionMarketResult | calculate_predictions | Moteur d'analyse | Tous (limité en Free) | MVP |
| 19 | Machine Learning | Elo, Poisson, XGBoost… | admin (monitoring modèles) | /ml/models/ | MLModel, ModelVersion | train_models | Moteur d'analyse | Admin | MVP→V2 |
| 20 | Ensemble Model | Pondération multi-modèles | intégré prédictions | /ml/ensemble/ | EnsembleWeight | calibrate_ensemble | ML | Admin | V2 |
| 21 | Monte Carlo | Simulation de distribution de scores | onglet Simulation | /matches/{id}/montecarlo/ | SimulationRun | run_monte_carlo | Prédiction | Tous (N limité en Free) | MVP |
| 22 | Value Bet | Edge modèle vs cote | /value-bets | /value-bets/ | ValueBetSignal | detect_value_bets | Prédiction + Cotes | Premium | V2 |
| 23 | Générateur de combinaisons | Sélection multi-matchs | /combinations | /combinations/ | Combination, CombinationSelection | — | Cotes | Tous | MVP |
| 24 | Cote cible | Recherche combi ≈ cote cible | /target-odds | /combinations/target/ | TargetOddsRequest | search_target_odds | Combinaisons | Tous (Premium pour tolérance fine) | MVP |
| 25 | Optimisation combinaisons | Score risque/proba | intégré /target-odds | /combinations/optimize/ | OptimizationScore | optimize_combinations | Cote cible | Premium | V2 |
| 26 | Combinaisons multi-sports | Mélanger sports | /combinations (filtre sport) | idem 23 | idem 23 | — | Sports (V2+) | Premium | V3 |
| 27 | Gestion du risque | Profils prudent/équilibré/agressif | paramètres utilisateur | /risk-profile/ | RiskProfile | — | Optimisation | Tous | V2 |
| 28 | Bankroll | Suivi solde et ROI | /bankroll | /bankroll/ | Bankroll, BankrollEntry | — | Historique | Premium | V2 |
| 29 | Calculateur de mise | Kelly, %, fixe | intégré combinaisons | /stake-calculator/ | (calcul pur, non stocké) | — | Bankroll | Premium | V2 |
| 30 | Historique | Journal des prédictions | /history | /history/ | PredictionHistory | archive_predictions | Prédiction | Tous | MVP |
| 31 | Backtesting | Test rétrospectif des modèles | /backtesting (admin/premium) | /backtests/ | Backtest, BacktestResult | run_backtests | Historique + ML | Admin/Premium | MVP |
| 32 | Performance des modèles | Dashboard comparatif versions | /admin/models | /ml/performance/ | ModelPerformance | — | Backtesting | Admin | V2 |
| 33 | News | Actualités contextuelles | /news | /news/ | NewsItem | sync_news | Équipes/Joueurs | Tous | V2 |
| 34 | Assistant IA | Explique une analyse en langage naturel | chat flottant | /ai/ask/ | AIQueryLog | — | Analyse + Prédiction | Premium | V2 |
| 35 | Recherche | Recherche globale | barre de recherche | /search/ | (index Postgres FTS) | reindex_search | tous | Tous | MVP |
| 36 | Favoris | Équipes/joueurs/matchs suivis | /favorites | /favorites/ | Favorite | — | Users | Tous | V2 |
| 37 | Alertes | Déclencheurs (cote, blessure…) | /alerts | /alerts/ | AlertRule | evaluate_alerts | Cotes/Compositions | Premium | V2 |
| 38 | Notifications | Diffusion web/email/push | centre de notifications | /notifications/ | Notification | send_notifications | Alertes | Tous | V2 |
| 39 | Premium | Gating fonctionnel Free/Premium | /pricing | /subscriptions/features/ | FeatureFlag | — | Paiements | Tous | V2 |
| 40 | Paiements | Abonnements, factures | /billing | /payments/, /webhooks/ | Subscription, Invoice, PaymentProvider | check_renewals | Premium | Tous | V2→V3 |
| 41 | Administration | Back-office complet | /admin/* | /admin/api/... | (Django admin + vues DRF) | — | tous | Admin | MVP |
| 42 | Monitoring | Logs, quotas, dispo API | /admin/monitoring | /monitoring/health/ | ApiCallLog, ErrorLog | monitor_quota | Fournisseurs | Admin | MVP |
| 43 | Sécurité | JWT, rate limiting, audit | transverse | transverse | AuditLog | rotate_secrets | Auth | Tous | MVP |
| 44 | Responsible Gambling | Messages incertitude, limites | bandeau global | /compliance/ | ComplianceLog | — | transverse | Tous | MVP |

## 5. Rôles et permissions

| Rôle | Peut faire |
|---|---|
| **USER** (Free) | Consulter matchs, stats basiques, un nombre limité de prédictions/jour, Monte Carlo à faible nombre de simulations, combinaisons simples sans cote cible avancée |
| **PREMIUM** | Tout ce que USER a + backtesting, assistant IA, alertes avancées, cote cible avec tolérance fine, optimiseur, bankroll, value bets |
| **MODERATOR** | Modération du contenu (news, commentaires si ajoutés), pas d'accès aux clés API ni à la configuration des modèles |
| **ADMIN** | Accès total : gestion fournisseurs de données, entraînement/activation de modèles, monitoring, paiements, utilisateurs |

## 6. Base de données — modèles Django principaux

Regroupés par domaine (champs indicatifs ; PK = `id` UUID par défaut sauf mention contraire) :

**Identité** : `CustomUser(email, password, role, locale, timezone, is_verified)`, `LoginHistory(user FK, ip, device, created_at)`

**Référentiel sportif** : `Sport(name, slug)`, `SportMarket(sport FK, market_type, params JSON)`, `Country(name, code)`, `Competition(sport FK, country FK, name, tier)`, `Season(competition FK, year_start, year_end)`, `Round(season FK, number)`

**Équipes/joueurs** : `Team(competition FK, name, country FK, venue)`, `TeamSeasonStat(team FK, season FK, stats JSON)`, `Player(team FK, name, position, birth_date)`, `PlayerStat(player FK, match FK, stats JSON)`, `Injury(player FK, type, start_date, expected_return)`

**Matchs** : `Match(competition FK, season FK, round FK, home_team FK, away_team FK, kickoff_at, status, score_home, score_away, referee, venue, weather JSON)`, `MatchEvent(match FK, minute, type, player FK)`, `MatchStat(match FK, team FK, stats JSON — schéma variable par sport)`, `Lineup(match FK, team FK, formation)`, `LineupPlayer(lineup FK, player FK, is_starter)`

**Cotes** : `Bookmaker(name, api_provider)`, `Market(match FK, market_type, sport FK)`, `Odds(market FK, bookmaker FK, selection, value, captured_at)` — table append-only pour conserver l'historique de variation

**Analyse / ML** : `FeatureSet(match FK, features JSON, computed_at, model_version)`, `MLModel(name, algorithm, sport FK)`, `ModelVersion(model FK, version, trained_at, metrics JSON, is_active)`, `EnsembleWeight(market_type, model_version FK, weight)`, `Prediction(match FK, market_type, probabilities JSON, model_version FK, created_at)`, `SimulationRun(match FK, n_simulations, distribution JSON, created_at)`

**Value bet / combinaisons** : `ValueBetSignal(prediction FK, odds FK, implied_prob, model_prob, edge, ev)`, `Combination(user FK, target_odds, tolerance, status)`, `CombinationSelection(combination FK, market FK, odds_value)`, `OptimizationScore(combination FK, risk_score, prob_score, final_score)`, `RiskProfile(user FK, type, max_selections, max_odds_per_selection)`

**Bankroll / historique** : `Bankroll(user FK, initial_amount, current_amount)`, `BankrollEntry(bankroll FK, type, amount, related_combination FK)`, `PredictionHistory(prediction FK, actual_result JSON, outcome, settled_at)`

**Backtesting** : `Backtest(model_version FK, period_start, period_end, sport FK, competition FK)`, `BacktestResult(backtest FK, accuracy, brier_score, log_loss, roi, drawdown)`

**Engagement** : `NewsItem(team FK/player FK nullable, title, body, source, published_at)`, `Favorite(user FK, content_type, object_id)`, `AlertRule(user FK, trigger_type, params JSON)`, `Notification(user FK, channel, payload JSON, read_at)`

**Monétisation / admin** : `Subscription(user FK, plan, status, renews_at)`, `Invoice(subscription FK, amount, status)`, `FeatureFlag(feature_key, min_plan)`, `ApiCallLog(provider, endpoint, status_code, latency_ms)`, `ErrorLog(source, message, stack, created_at)`, `AuditLog(user FK, action, target, created_at)`, `ComplianceLog(user FK, type, created_at)`

Index recommandés : `Match(kickoff_at, status)`, `Odds(market_id, captured_at)`, `Prediction(match_id, market_type)`, `PlayerStat(player_id, match_id)`. Contrainte d'unicité sur `(match, home_team, away_team)` et sur `(ModelVersion.model, version)`.

## 7. API REST — endpoints principaux (`/api/v1/`)

```
Auth        POST /auth/register/  POST /auth/login/  POST /auth/refresh/
            POST /auth/verify-email/  POST /auth/password-reset/
Users       GET/PATCH /users/me/  GET /users/me/history/

Sports      GET /sports/  GET /sports/{id}/markets/
Competitions GET /competitions/  GET /competitions/{id}/standings/
Teams       GET /teams/  GET /teams/{id}/  GET /teams/{id}/form/  GET /teams/{id}/injuries/
Players     GET /players/  GET /players/{id}/

Matches     GET /matches/  GET /matches/{id}/
            GET /matches/{id}/stats/  GET /matches/{id}/h2h/
            GET /matches/{id}/lineups/  GET /matches/{id}/odds/
            GET /matches/{id}/analysis/  GET /matches/{id}/predictions/
            GET /matches/{id}/montecarlo/

Odds        GET /bookmakers/  GET /odds/compare/?match=
ValueBets   GET /value-bets/

Combinations POST /combinations/  GET /combinations/{id}/
             POST /combinations/target/        (cote cible)
             POST /combinations/optimize/

Bankroll    GET/POST /bankroll/  GET /bankroll/entries/
History     GET /history/
Backtests   POST /backtests/  GET /backtests/{id}/results/
ML (admin)  GET /ml/models/  GET /ml/performance/

News        GET /news/
Favorites   GET/POST/DELETE /favorites/
Alerts      GET/POST /alerts/
Notifications GET /notifications/  PATCH /notifications/{id}/read/

AI          POST /ai/ask/
Search      GET /search/?q=

Billing     GET /subscriptions/  POST /payments/checkout/  POST /webhooks/{provider}/
Admin       /admin/... (utilisateurs, providers, monitoring, logs)
```

## 8. Frontend — pages principales

```
/                      /login  /register  /profile  /settings
/dashboard
/sports  /football  /competitions  /competitions/:id
/teams  /teams/:id  /players/:id
/matches  /matches/:id (onglets: Stats, H2H, Compositions, Cotes, Analyse, Prédictions, Simulation)
/value-bets
/combinations  /target-odds  /optimizer
/bankroll  /history  /backtesting (premium)
/ai-assistant
/news  /favorites  /alerts  /notifications
/pricing  /billing
/admin/*  (utilisateurs, providers, modèles, monitoring, logs, paiements)
```

## 9. Moteur d'analyse — feature engineering (module central)

Le moteur transforme les données brutes d'un match en un `FeatureSet` structuré, calculé une fois puis mis en cache, invalidé si une donnée source change (nouvelle cote, nouvelle composition, nouvelle blessure).

Catégories de features :
- **Forme** : points/match sur 5/10 matchs, buts marqués/encaissés moyens, forme domicile vs extérieur, séries en cours.
- **Classement contextuel** : écart de classement, écart de points, zone de qualification/relégation en jeu.
- **H2H** : résultats des 5–10 dernières confrontations, moyenne de buts en confrontation directe (avec avertissement sur la faible significativité statistique si échantillon réduit).
- **Effectif** : score d'impact des absences (pondéré par minutes jouées et importance du poste), fraîcheur (jours de repos depuis le dernier match, matchs sur les 14 derniers jours).
- **Contexte** : enjeu de la rencontre, domicile/extérieur, météo si disponible, arbitre (moyenne de cartons donnés).
- **Marché** : probabilité implicite des cotes actuelles et leur variation récente (signal de marché).

Chaque feature est versionnée avec le `FeatureSet` pour permettre de reproduire exactement l'état des données au moment d'une prédiction passée (nécessaire pour un backtesting sans fuite de données — *no look-ahead bias*).

## 10. Prédiction

Sorties standardisées par marché, toujours sous forme de distribution de probabilités, jamais d'affirmation binaire :

```
1X2 : {home: 0.51, draw: 0.27, away: 0.22}
BTTS : {yes: 0.58, no: 0.42}
Over/Under 2.5 : {over: 0.55, under: 0.45}
```

Chaque prédiction référence le `ModelVersion` utilisé et un intervalle de confiance/incertitude dérivé du Monte Carlo.

## 11. Machine Learning

Modèles à intégrer progressivement :
- **Elo** dynamique (mise à jour après chaque résultat, pondérée par l'enjeu de la compétition) — baseline simple et robuste, bon pour le MVP.
- **Poisson / Dixon-Coles** pour modéliser le nombre de buts marqués par équipe et en dériver toutes les probabilités de score exact, 1X2, Over/Under, BTTS.
- **Logistic Regression** comme modèle interprétable de référence.
- **Random Forest / XGBoost / LightGBM** pour capter les interactions non linéaires entre features.
- **Réseaux de neurones** en option V3, seulement si le volume de données historiques le justifie.

Pipeline : *features → split train/validation/test chronologique (jamais aléatoire, pour éviter la fuite temporelle) → entraînement → calibration (Platt scaling ou isotonic regression, indispensable pour que les probabilités soient réellement interprétables) → validation croisée temporelle → déploiement d'une nouvelle `ModelVersion`*.

## 12. Ensemble Model

Combine plusieurs modèles par une moyenne pondérée, les poids étant eux-mêmes appris par régression sur les performances historiques de chaque modèle (stacking simple), recalculés périodiquement par `calibrate_ensemble`. Le poids d'un modèle peut varier par sport, compétition et marché (un modèle peut être bon en 1X2 mais faible en Over/Under).

## 13. Monte Carlo

Simulation de 10 000 à 100 000+ tirages à partir des paramètres du modèle Poisson/Dixon-Coles (taux de buts espérés par équipe), pour produire :
- une distribution complète des scores possibles,
- les probabilités dérivées de tous les marchés (1X2, BTTS, Over/Under, handicap),
- un intervalle d'incertitude visible dans l'UI (ex. "Victoire domicile 51 % ± 4 %").

Nombre de simulations limité pour les comptes Free (ex. 1 000), illimité en Premium.

## 14. Value Bet

```
probabilité implicite = 1 / cote décimale (après retrait de la marge du bookmaker)
edge = probabilité modèle − probabilité implicite
EV = (probabilité modèle × (cote − 1)) − (1 − probabilité modèle)
```

Un signal n'est affiché que si l'edge dépasse un seuil configurable **et** que l'incertitude du modèle (issue du Monte Carlo) est suffisamment faible — un edge élevé avec une forte incertitude n'est pas un signal fiable.

## 15. Cote cible & optimisation des combinaisons

L'utilisateur fixe une cote cible (ex. 10) et une tolérance (±1 %, ±5 %, ±10 %, personnalisée). L'algorithme :
1. Filtre les sélections disponibles selon les contraintes utilisateur (sports, compétitions, marchés, cote min/max par sélection).
2. Recherche des combinaisons (recherche combinatoire bornée, ou approche gloutonne + recuit simulé si l'espace est trop grand) dont le produit des cotes tombe dans l'intervalle cible.
3. Calcule pour chaque combinaison trouvée : probabilité combinée du modèle, incertitude cumulée, score de risque.
4. L'optimiseur classe les combinaisons par un score composite (probabilité, risque, corrélation entre sélections d'un même match/compétition à pénaliser) et retourne **plusieurs scénarios**, jamais un seul "meilleur pari" présenté comme une vérité.

## 16. Backtesting

Rejoue chaque `ModelVersion` sur une période historique en n'utilisant que les données disponibles *au moment du match* (via les `FeatureSet` versionnés) pour éviter toute fuite de données. Métriques : accuracy, Brier score, log-loss, calibration (fiabilité des probabilités annoncées vs fréquence réelle), ROI simulé, drawdown maximal, ventilés par sport/compétition/marché.

## 17. Tâches Celery indicatives

| Tâche | Fréquence recommandée |
|---|---|
| sync_matches / sync_results | toutes les 5–10 min les jours de match |
| sync_odds | toutes les 1–5 min pré-match, plus fréquent en live |
| sync_statistics, sync_lineups | à l'approche du coup d'envoi puis en direct |
| sync_players, sync_injuries | quotidien |
| calculate_predictions, run_monte_carlo | dès qu'un FeatureSet change |
| update_rankings | après chaque journée |
| process_finished_matches | à la clôture du match |
| run_backtests | hebdomadaire ou à chaque nouvelle ModelVersion |
| train_models / calibrate_ensemble | hebdomadaire/mensuel |
| monitor_quota | toutes les heures |
| evaluate_alerts, send_notifications | quasi temps réel |

## 18. Fournisseurs de données (à vérifier avant intégration — le marché évolue vite)

Sous réserve de vérification au moment de l'implémentation :

- **API-SPORTS / API-Football** : large couverture football (+ NBA, F1, MLB…), offre gratuite disponible mais volume de requêtes limité, historique des cotes limité selon le plan.
- **football-data.org** : plan gratuit simple d'accès mais restreint à un nombre limité de compétitions majeures, scores et calendriers en léger différé, pas de données joueurs ni de cotes.
- **TheSportsDB** : données communautaires gratuites, bonnes pour logos/visuels, profondeur statistique limitée — adapté à un prototype, pas à un produit de prédiction sérieux.
- **Fournisseurs de cotes dédiés** (type agrégateurs d'odds) : utiles en complément d'un fournisseur de stats, car les fournisseurs "stats-first" ont souvent une couverture de cotes plus pauvre que les agrégateurs "odds-first".

Recommandation d'architecture : commencer avec un fournisseur stats gratuit/économique pour le MVP, et prévoir dès le départ un second provider pour les cotes, les deux branchés derrière l'abstraction `DataProvider` du module 14 — ce qui permet de changer de fournisseur ou d'en ajouter sans toucher au moteur d'analyse.

## 19. Roadmap par phases

| Phase | Contenu |
|---|---|
| 0 | Architecture, structure du repo, CI/CD |
| 1 | Authentification & rôles |
| 2 | Sports, référentiel générique |
| 3 | Équipes |
| 4 | Matchs |
| 5 | Intégration fournisseur API (football) |
| 6 | Statistiques |
| 7 | Moteur d'analyse (feature engineering) |
| 8 | Prédiction (Elo + Poisson) |
| 9 | Machine Learning avancé (XGBoost, ensemble) |
| 10 | Monte Carlo |
| 11 | Cotes |
| 12 | Value Bets |
| 13 | Combinaisons |
| 14 | Cote cible |
| 15 | Optimiseur |
| 16 | Backtesting |
| 17 | Assistant IA |
| 18 | Notifications/Alertes |
| 19 | Premium (gating) |
| 20 | Paiements |
| 21 | Multi-sport, mobile |

## 20. MVP

Auth, Football uniquement, Compétitions/Équipes/Matchs, Statistiques, Forme, H2H, Cotes (1 provider), Marchés de base (1X2, BTTS, O/U), Moteur d'analyse, Elo + Poisson, Monte Carlo (limité), Prédictions avec probabilités et incertitude affichée, détection de value simple, Combinaisons + Cote cible (tolérance fixe), Historique, Backtesting basique, Dashboard.

*Justification* : c'est le plus petit ensemble qui boucle la valeur centrale du produit — de la donnée brute à une combinaison actionnable autour d'une cote cible — sans quoi aucun autre module n'a de sens à construire.

## 21. V2

Basketball/Tennis, Joueurs/Blessures/Compositions détaillées, ML avancé (XGBoost/LightGBM, Ensemble), Assistant IA, News, Alertes/Notifications, Bankroll, Optimiseur de combinaisons, Premium.

## 22. V3

Multi-sport complet, application mobile, multi-fournisseurs de données redondants, Paiements/Abonnements, API publique, modèles spécialisés par sport, combinaisons multi-sports.

## 23. Estimation de complexité par module

| Complexité | Modules |
|---|---|
| Faible | Auth, Sports, Compétitions, Favoris, Recherche, News |
| Moyenne | Équipes, Joueurs, Matchs, Statistiques, Forme, H2H, Cotes, Bankroll, Calculateur de mise, Notifications, Administration |
| Élevée | Moteur d'analyse, Prédiction, Combinaisons, Cote cible, Backtesting, Assistant IA, Paiements, Monitoring |
| Très élevée | Machine Learning, Ensemble Model, Monte Carlo, Value Bet, Optimisation des combinaisons, Combinaisons multi-sports |

## 24. Risques techniques principaux et pistes de mitigation

- **Fuite de données dans le backtesting** (utiliser une feature calculée après le match) → versionner chaque `FeatureSet` avec la date de calcul et ne jamais recalculer rétroactivement.
- **Dépendance à un seul fournisseur** → abstraction `DataProvider` dès la phase 0, même avec un seul fournisseur réellement branché au départ.
- **Explosion combinatoire dans la recherche de cote cible** sur un grand nombre de sélections disponibles → borner la profondeur de recherche et utiliser une heuristique (glouton + recuit simulé) plutôt qu'une recherche exhaustive au-delà d'un seuil de sélections.
- **Sur-confiance perçue des probabilités affichées** → systématiser l'affichage de l'incertitude (issue du Monte Carlo) partout où une probabilité est montrée, et le rappel réglementaire/jeu responsable.
- **Coût/latence des simulations Monte Carlo à grande échelle** → les précalculer de façon asynchrone (Celery) dès qu'un `FeatureSet` change plutôt qu'à la demande.
- **Conformité jeu responsable et légale** (variable selon juridiction) → à valider avec un conseil juridique local avant mise en production, notamment sur les mentions de gains potentiels.

## 25. Ordre de développement recommandé

Auth → Sports/Compétitions/Équipes/Matchs (référentiel) → Provider football → Statistiques/Forme/H2H → Cotes → Moteur d'analyse → Elo/Poisson → Monte Carlo → Prédictions → Value Bet simple → Combinaisons → Cote cible → Dashboard → Historique → Backtesting basique → (V2) ML avancé, Ensemble, Optimiseur, Bankroll, Alertes, Assistant IA, Premium → (V3) multi-sport, paiements, mobile.

---

*Ce document est une architecture fonctionnelle et technique de référence. Les informations sur les fournisseurs d'API (section 18) doivent être revérifiées au moment de l'implémentation, les offres et limites de plans gratuits évoluant fréquemment.*
