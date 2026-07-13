# @usesnapline/contracts

Public TypeScript types for Snapline configuration, scan results, violations,
repair contracts, hooks, and benchmark records.

```sh
npm i @usesnapline/contracts
```

`ScanResult` and `RepairContract` carry `schemaVersion: 1`. Additive fields may
be added within version 1; consumers should ignore unknown fields and reject
unsupported schema versions. See the
[contract reference](https://github.com/gael55x/Snapline/blob/main/docs/repair-contracts.md).

Most users should install
[`@usesnapline/cli`](https://www.npmjs.com/package/@usesnapline/cli) instead.
