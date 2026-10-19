# Stop conflicting rows before a Google Sheets import

A free, original n8n Code-node example for batches that use a stable source and record ID. It refuses blank or ambiguous keys, collapses exact duplicates, and stops the entire batch when the same key has different payloads. No credentials, network calls, paid APIs, or customer data are included in the demo.

For example, three input rows with keys `catalog-a/001`, `catalog-a/001`, `catalog-b/001` produce two rows. Change one payload for `catalog-a/001` and the validator throws before returning any rows to a downstream writer. It never chooses a winning payload silently.

## Try the demo

1. Download `workflow.json` and import it into an n8n workspace using Import from File.
2. Inspect the nodes, then execute the manual workflow. The validator should return two items, each containing `import_key`.
3. In **Synthetic rows**, change `DEMONSTRATE_CONFLICT` to `true`. Execute again: validation should stop with the conflicting row positions.

This repository is AI-assisted and uses synthetic examples. The JavaScript source has automated checks in Node.js; n8n import/execution and a real Google Sheets write have not yet been verified. Report your n8n version and a synthetic reproducer if importing fails. No client outcomes or savings are claimed.

## Connect your own source and destination

Replace **Synthetic rows** with your existing parsed input. Each input item must have its record in `json`. This is not a CSV parser. Set `KEY_FIELDS` in `guard.js` (or the Code node) to your stable top-level key fields. Key values must be strings; leading zeros matter. Missing, blank, numeric and padded keys are rejected rather than silently converted. Choose keys whose case and Unicode representation are stable; this example does not normalize them.

Use the Code node's **Run Once for All Items** mode and keep its error behavior at **Stop Workflow**. Leave **Always Output Data** off. Do not connect a writer to the unvalidated branch. Start with a copy of your destination sheet and a small synthetic batch.

If you add Google Sheets after validation, choose **Append or Update Row** and match on the `import_key` column. Map the approved fields explicitly. Preserve ID columns as text. Keep the same key configuration on every run and make sure existing destination keys are unique. An existing sheet will need a deliberate migration to this key format before use. Use raw input handling for untrusted cell values so spreadsheet formulas cannot be introduced accidentally; verify your node/API settings in a test sheet.

The key is an encoded JSON tuple. This avoids collisions from joining values with a separator. Whole payloads are compared, ignoring object property order; arrays, types, missing fields and `null` remain significant. Remove changing fetch timestamps upstream if they should not make records conflict. Returned items preserve n8n item links to the first occurrence.

## What this protects

The batch is validated before the Code node returns. Identical repeats within that batch collapse; conflicting versions require a deliberate decision. Error messages contain row positions rather than input values, though n8n execution history can still store the input itself.

This is **not** a transaction, cross-run deduplication store or concurrency lock. Append-or-update can still race between simultaneous runs; existing duplicate destination rows remain your responsibility. A downstream write may partially succeed before a retry. If you need strict uniqueness or exactly-once effects, use a database unique constraint and an appropriate transactional design. Serializing runs may reduce races but does not turn Sheets into a transactional database.

The example accepts at most 10,000 items per batch as a conservative guard, not a performance guarantee. It is intended for parsed JSON data and discards binary attachments. Test resource usage for your payload size. No promise of production compatibility or ongoing support is made.

## Run the source checks

With Node.js installed:

```sh
node build.mjs
node test.mjs
```

The harness executes the exact Code-node source against synthetic fixtures. It checks conflicting payloads, invalid keys, composite-key collisions, leading zeros, property ordering, item links, prototype-like values, error redaction and the batch cap. It does not emulate n8n or Google Sheets.

## Choosing where to run it

An existing n8n user can try the example in their current workspace. Managed n8n Cloud may suit teams that prefer the vendor to operate the service; self-hosting requires operating and securing an instance. A one-off import may be better handled by a local script or spreadsheet tools. This example does not require buying n8n Cloud and does not depend on Cloud-only modules.

Commercial disclosure: this project is evaluating n8n's affiliate program. There is currently no approved affiliate relationship or referral link in this repository. If approved, referral links will be labeled where used. The code remains free under the MIT license.

References, checked 19 October 2026: [Google Sheets node operations](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/sheet-operations/), [Code node](https://docs.n8n.io/code/code-node/), [workflow templates](https://docs.n8n.io/workflows/templates/), [n8n affiliate program](https://n8n.io/affiliates/).
