# shazame-serie

Application web qui identifie un film ou une série à partir d'un court clip vidéo, affiche sa fiche et les services où le regarder.

- Contexte et règles du projet : [CLAUDE.md](CLAUDE.md) et [context/](context/)
- Prérequis : Node.js 24 (voir `.nvmrc`)

```bash
npm ci
npm run dev
```

## Branches

| Branche | Rôle |
| --- | --- |
| `main` | Production |
| `staging` | Préproduction |
| `dev` | Intégration ; reçoit les PR des branches `unit/<ID>-<nom>` |

Promotion : `unit/*` → `dev` → `staging` → `main` (correctifs urgents : `hotfix/*`).
