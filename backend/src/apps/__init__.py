# -*- coding: utf-8 -*-
"""Conteneur des apps metier du projet pronostique.

Chaque sous-dossier est une app Django autonome (config explicite dans
INSTALLED_APPS via son AppConfig, ex. "apps.users.apps.UsersConfig").

Cartographie cahier des charges :
- users        : module 1   (Auth & Users : CustomUser, Role, LoginHistory) + roles
- sports       : modules 2-5  (Sports, Competitions, Equipes, Joueurs) + Marches (module 16)
- matches      : modules 6-11 (Matchs, Stats, Forme, H2H, Blessures, Compositions)
- odds         : modules 12-13 (Cotes, Bookmakers/Comparateur : OddsHistory append-only)
- providers    : modules 14-15 (Fournisseurs API, Synchronisation) + fournisseurs
- analysis     : module 17 (Moteur d'analyse : FeatureSet versionnes)
- predictions  : modules 18-22 (Prediction, ML, Ensemble, Monte Carlo, Value Bet) + Backtesting
- combinations : modules 23-31 (Combinaisons, Cote cible, Optimiseur, Bankroll, Historique)
"""
