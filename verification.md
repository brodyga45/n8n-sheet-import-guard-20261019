# Runtime verification — 19 October 2026

The synthetic workflow fixtures imported successfully and ran through the real n8n 2.43.8 CLI in disposable Docker containers. The JavaScript validator is unchanged from `guard.js` in this repository. Each fixture adds a test-only workflow ID so it can be executed by ID after import.

| Fixture | Result |
| --- | --- |
| Three rows: identical `catalog-a/001` twice and distinct `catalog-b/001` | Execution status `success`, `finished: true`, exit 0; two output items. Their keys are `["catalog-a","001"]` and `["catalog-b","001"]`, with paired input positions 0 and 2. |
| Enable `DEMONSTRATE_CONFLICT` in Synthetic rows | Import succeeds, execution exits 1. Error identifies conflicting rows 1 and 4. |
| One row with `record_id: " "` | Import succeeds, execution exits 1. Error identifies the invalid key on row 1. |

The containers had no external network access and used only read-only synthetic fixture files. Their databases and generated local configuration were discarded on container exit. No existing workspace, account, credentials or client data were used. [Machine-readable results and source hashes](runtime-verification.json) record this scope.

The pinned official image was:

```text
n8nio/n8n@sha256:a18edcf018198b33b5488fb47ededafe11e0b10d28f65b9535b7c447c9ce3b2c
```

## Reproduce the CLI procedure

Copy `workflow.json` to `runtime-success.json` and add the top-level field `"id": "affiliateSuccess"`. In the directory containing the copy, import and execute it inside the same disposable container:

```sh
docker run --rm --network none --memory 2g --cpus 2 \
  -e N8N_DIAGNOSTICS_ENABLED=false \
  -e N8N_VERSION_NOTIFICATIONS_ENABLED=false \
  --mount type=bind,source="$(pwd)",target=/fixtures,readonly \
  --entrypoint /bin/sh \
  n8nio/n8n@sha256:a18edcf018198b33b5488fb47ededafe11e0b10d28f65b9535b7c447c9ce3b2c \
  -c 'n8n import:workflow --input=/fixtures/runtime-success.json && n8n execute --id=affiliateSuccess --rawOutput'
```

For the conflict case, change only the fixture toggle in the Synthetic rows Code node. For the blank-key case, replace that node's input generator with a single synthetic record containing a blank string key. Keep the validator unchanged. The corresponding execution should fail with the errors recorded above.

The CLI's deprecated `execute --file` flag was misleading in this version: it requested an ID and exited 0 without executing the workflow. The reported success above comes from actual execution data after import, including the output values and item links, rather than exit status alone.

This verifies the synthetic CLI path. A live Google Sheets write, Cloud execution, browser import, cross-run consistency and concurrent upserts remain outside this check. The optional internal Python runner was unavailable in the image; these fixtures use the JavaScript runner.
