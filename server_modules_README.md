# Server Modules (Scaffold)

This repository will gain a `server/modules` directory to hold route/service/repo code split by domain. We will migrate incrementally without breaking existing `server.js` routes.

Suggested structure:

- tables/
  - routes.js
  - service.js
  - repo.js
- settings/
  - routes.js
  - service.js
  - repo.js
- shops/
  - routes.js
  - service.js
  - repo.js

Migration rule: move repo (SQL) first, then service (business), then routes. Keep old routes alive until fully swapped.
