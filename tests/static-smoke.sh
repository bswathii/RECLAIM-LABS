#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

required_files="
  README.md
  Dockerfile
  compose.yaml
  .dockerignore
  package.json
  package-lock.json
  .nvmrc
  .env.example
  public/index.html
  public/styles.css
  public/app.mjs
  src/domain/rules.mjs
  src/domain/sources.mjs
  src/domain/assistant.mjs
  server/qwen-config.mjs
  server/qwen-adapter.mjs
  scripts/check-qwen-config.mjs
  src/domain/i18n.mjs
  src/domain/opportunities.mjs
  src/domain/opportunity-copy.mjs
  src/domain/case-events.mjs
  tests/app-flow.test.mjs
  docs/requirements.md
  docs/architecture.md
  docs/source-register.md
  docs/status.md
"

for relative in $required_files; do
  if [ ! -f "$root/$relative" ]; then
    printf 'missing required file: %s\n' "$relative" >&2
    exit 1
  fi
done

perl -0e '
  my ($root) = @ARGV;
  my @checks = (
    ["$root/public/index.html", qr/Reclaim Labs/],
    ["$root/public/app.mjs", qr/localStorage/],
    ["$root/public/app.mjs", qr/data-action="create-case"/],
    ["$root/public/app.mjs", qr/target\.dataset\.action === .wizard-check./],
    ["$root/public/app.mjs", qr/target\.dataset\.action === .case-check./],
    ["$root/src/domain/rules.mjs", qr/suggested-route/],
    ["$root/src/domain/rules.mjs", qr/user-reported-resolved/],
    ["$root/src/domain/assistant.mjs", qr/deterministic-fallback/],
    ["$root/server.mjs", qr/isSourceModule/],
    ["$root/docs/source-register.md", qr/SRC-RBI-UDGAM-FAQ/],
    ["$root/docs/source-register.md", qr/access-blocked/],
    ["$root/.env.example", qr/QWEN_MODEL=Qwen\/Qwen3-8B/],
    ["$root/server/qwen-config.mjs", qr/QWEN_MODEL/],
    ["$root/server/qwen-adapter.mjs", qr/QWEN_ENDPOINT/],
    ["$root/scripts/check-qwen-config.mjs", qr/Inference: not attempted/],
    ["$root/server.mjs", qr/try\s*\{\s*pathname\s*=\s*decodeURIComponent/],
    ["$root/tests/server.test.mjs", qr/malformed URL escapes/],
    ["$root/tests/server.test.mjs", qr/path traversal/],
    ["$root/server.mjs", qr/requestPath === .\/healthz./],
    ["$root/Dockerfile", qr/^USER node$/m],
    ["$root/Dockerfile", qr/COPY --from=checks \/app\/server\.mjs \.\/server\.mjs/],
    ["$root/Dockerfile", qr/HEALTHCHECK/],
    ["$root/public/app.mjs", qr/data-view="discover"/],
    ["$root/public/app.mjs", qr/class="bottom-nav"/],
    ["$root/public/app.mjs", qr/claimantType:/],
    ["$root/public/app.mjs", qr/window\.confirm\(prompt\)/],
    ["$root/public/app.mjs", qr/DEMO DATA — NOT A REAL FINANCIAL MATCH/],
    ["$root/src/domain/opportunities.mjs", qr/personal-evidence-required/],
    ["$root/server.mjs", qr/\/api\/assistant/]
  );
  for my $check (@checks) {
    my ($file, $pattern) = @$check;
    open my $fh, "<", $file or die "cannot read $file: $!\n";
    local $/;
    my $text = <$fh>;
    die "check failed in $file\n" unless $text =~ $pattern;
  }
  print "static smoke checks passed (Node.js unavailable; behavioral Node tests remain to run)\n";
' "$root"
