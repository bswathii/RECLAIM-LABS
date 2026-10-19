# Known limitations and trust gaps

- The IEPF Authority and MCA pages returned HTTP 403 to the current fetcher. IEPF/MCA route cards are therefore official handoff destinations, not proof that the displayed page text is current.
- The app does not determine whether shares exist, whether a holding is in a suspense account, or whether a person is legally eligible. Those are possible-match inputs and institution decisions.
- The app does not file Form IEPF-5, submit documents, contact an RTA, search UDGAM, or read official claim status.
- The app does not infer transfer dates, statutory deadlines, amounts, or outcomes.
- Demo persistence is browser-local and not suitable for multi-device or multi-user use.
- Qwen3-8B is not connected in this build because no approved endpoint and server-side secret are configured. The fallback is explicit and deterministic.
- Full Node, browser, and Docker verification is blocked in the current worker because those runtimes are unavailable.
