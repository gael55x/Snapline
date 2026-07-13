# Performance

Performance and detection quality are separate. This benchmark measures local
scanner and CLI latency; it does not measure false positives, false negatives,
or agent task quality.

## Environment

- macOS (`darwin`, arm64)
- Apple M3, 8 logical cores
- 16 GiB memory
- Node v22.18.0
- peak benchmark-process RSS: 192,352 KiB

The exact source commit, timestamp, byte counts, and environment are stored in
[`benchmarks/performance/results/latest.json`](../benchmarks/performance/results/latest.json).
The graph at
[`benchmarks/performance/graphs/latency.svg`](../benchmarks/performance/graphs/latency.svg)
is generated only from that JSON.

## Method

`pnpm bench:performance` builds synthetic clean 100-file and 1,000-file TSX
projects in a temporary directory and uses the committed dashboard fixture for
the small-project case. Core scenarios run in one process after warmup. The
cold CLI scenario spawns a fresh Node process for every one-file JSON scan.
The benchmark records p50, p95, minimum, maximum, scanned-file count, output
bytes, source commit, and environment.

```sh
pnpm build
pnpm bench:performance
```

There is no persistent or in-process scan cache. `core_no_change_rerun_1000_files`
therefore measures a repeated full scan, not a cache hit. Normal PostToolUse
invocations scan only edited files; Stop scans the git-changed set.

## Results

| Scenario                                    | Iterations | Files |        p50 |        p95 |   Output |
| ------------------------------------------- | ---------: | ----: | ---------: | ---------: | -------: |
| Core, one file                              |         50 |     1 |   0.253 ms |   0.740 ms |    548 B |
| Core, small fixture                         |         20 |    12 |   6.187 ms |   9.577 ms |    968 B |
| Core, 100 files                             |         10 |   100 |  13.173 ms |  13.904 ms |  2,817 B |
| Core, 1,000 files                           |          5 | 1,000 | 118.238 ms | 123.686 ms | 24,417 B |
| Core, unchanged 1,000-file rerun            |          5 | 1,000 | 110.774 ms | 112.503 ms | 24,417 B |
| Core, one edited file in 1,000-file project |         50 |     1 |   0.272 ms |   0.403 ms |    549 B |
| Cold CLI, one file                          |          7 |     1 | 496.866 ms | 821.270 ms |    557 B |

## Conclusion

The engine cost scales acceptably for the current changed-file hook model:
single-file core analysis is below 1 ms at p95 and a 1,000-file core scan is
below 125 ms at p95 on this machine. The user-visible cold process is the real
cost: roughly 497 ms median for one file. The previous 10–30 ms product
claim measured only warm core work and was misleading.

Before 1.0, maintainers must write an accepted hook-latency budget and decide
whether the cold result meets it. Do not add a cache or daemon based on this
synthetic run alone; first collect opt-in local hook traces from real projects.

## Limitations

- One machine and Node version; no Windows, Linux, or Node 20 measurement yet.
- Generated files are small and clean; very large generated modules are not
  represented.
- RSS is process-level peak, not isolated per scenario.
- The cold scenario includes Node and TypeScript startup; it does not include
  agent runtime.
- No concurrent-edit or multi-process contention measurement.
