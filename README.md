### Node

```
$ node --experimental-strip-types src/run-test.ts
microtask 1
message 1
message 1 - microtask
message 2
message 2 - microtask
immediate 1
timeout 1
```

### Bun (same as node)

```
$ bun src/run-test.ts
microtask 1
message 1
message 1 - microtask
message 2
message 2 - microtask
immediate 1
timeout 1
```

### Workerd

```
pnpm dev
```

and

```
$ curl http://localhost:8787
message 1
message 2
microtask 1
message 1 - microtask
message 2 - microtask
timeout 1
immediate 1
```

see comment in [src/test.ts](src/test.ts) for more about the ordering
