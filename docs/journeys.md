# Reviewer journey map

These are fictional, reproducible demonstrations. They are not real customers, real financial matches, submitted claims, verified recoveries, or measured user outcomes. The browser banner identifies whether the current namespace is the isolated demo or user-reported local data.

## Journey A — deceased family member's shares or dividends (IEPF)

1. Open **Home → A · Deceased family member shares or dividends**.
2. Select **Family / heir**.
3. Use only fictional workflow inputs: custody **Not sure yet**, blank company/RTA label, and **No / not sure yet** for the two evidence-availability questions.
4. Review **Needs more information**. The result explains that the holding may be in company/RTA suspense or with IEPF, but Reclaim Labs has not checked an individual record.
5. Open the official IEPF/MCA destinations, inspect the route-specific checklist, acknowledge an item, and choose **Create local demo case** (or save a user-reported local case in real mode).
6. Open **Cases** to see the `verify-custody` route, progress, source links, next action, and local timeline. The case is preparation state only.

## Journey B — individual's potentially unclaimed bank deposit (RBI UDGAM)

1. Open **Home → B · Individual potentially unclaimed bank deposit**.
2. Leave all three availability questions at **No / not sure yet**, or choose Yes only as a fictional readiness statement. Do not enter an account name, account number, PAN, OTP, credential, or document content.
3. Review the missing search inputs and the explanation that UDGAM is a search facility, not a claim approval or payment result.
4. Open the official UDGAM portal yourself, then use the checklist and save a local preparation case.
5. In **Cases**, confirm that the next claim step remains with the respective bank and that no UDGAM result is shown by this application.

## Journey C — uncertain recovery route

1. Open **Home → C · Uncertain recovery route** or the matching button in **Cases**.
2. Treat the fictional input as an old share document whose custody is unknown. Select **Family / heir** if the document belongs to a deceased relative, leave the company/RTA label blank, and keep custody **Not sure yet**.
3. Confirm the route is **First verify where the holding is recorded** with **Needs more information**. The UI must not force IEPF and must not offer UDGAM as an alternative for a share document.
4. Open the relevant official IEPF/MCA/company/RTA source links, acknowledge preparation items, and save the local case.
5. Reopen **Cases** and explain that the next real-world action is official custody verification. No ownership, eligibility, amount, deadline, approval, filing, or institutional response is inferred.

## Docker Desktop on Windows ARM64

From a fresh PowerShell clone:

```powershell
git clone https://github.com/bswathii/RECLAIM-LABS.git
Set-Location .\RECLAIM-LABS
docker build --no-cache -t reclaim-labs:local .
docker run --name reclaim-labs -d -p 3000:3000 --env PORT=3000 reclaim-labs:local
Start-Process "http://localhost:3000"
Invoke-WebRequest http://localhost:3000/healthz
docker logs -f reclaim-labs
docker stop reclaim-labs
docker rm reclaim-labs
```

The equivalent Compose path is:

```powershell
docker compose up --build
# In another PowerShell window:
Start-Process "http://localhost:3000"
docker compose down
```

The image uses the official Node 22.14.0 Bookworm slim multi-architecture base image. The server binds `0.0.0.0`, exposes port `3000`, runs as the non-root `node` user, and runs the offline Node test suite in the build stage. Qwen credentials are optional and are not included in the image or Compose file. Cases remain browser-local; Docker does not add a database, authentication, multi-user isolation, or durable case storage.
