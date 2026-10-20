# Known limitations and trust gaps

- The IEPF Authority and MCA pages returned HTTP 403 to the current fetcher. IEPF/MCA route cards are therefore official handoff destinations, not proof that the displayed page text is current.
- The app does not determine whether shares exist, whether a holding is in a suspense account, or whether a person is legally eligible. Those remain user-reported possibilities and institution decisions; the app does not label them as asset matches.
- The app does not file Form IEPF-5, submit documents, contact an RTA, search UDGAM, or read official claim status.
- The app does not infer transfer dates, statutory deadlines, amounts, or outcomes.
- Demo persistence is browser-local and not suitable for multi-device or multi-user use.
- Qwen3-8B is not connected in this build because no approved endpoint and server-side secret are configured. `npm run qwen:check` reports `QWEN_ENDPOINT` and `QWEN_API_KEY` as blockers, validates the exact model identifier, and proves the browser-served roots contain no Qwen configuration markers; it does not call inference. The fallback is explicit and deterministic.
- Node and HTTP verification are available; the built-in browser renders Home at a 310px viewport, but browser click dispatch timed out in this worker. Full interactive browser journeys and human language/usability review remain unverified.
- Docker is not installed in the current worker. The Dockerfile and `.dockerignore` are statically checked, but image build, non-root runtime, and health status remain unverified.
