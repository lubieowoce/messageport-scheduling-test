### Node (v22.6.0)

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

### Bun (1.1.34)

Same as Node:

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

### Workerd (wrangler 4.59.2 + nodejs_compat_v2)

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

### Deno (2.6.6)

Weirdly, Deno seems to execute the first message synchronously (although i'm not sure what's actually happening here):

```
$ deno --allow-env src/run-test.ts
message 1
microtask 1
message 1 - microtask
message 2
message 2 - microtask
immediate 1
timeout 1
```

However, if we queue the messages (and attach the listener) in a microtask, the ordering is close to what we'd expect in node/bun.
The immediate runs before the messages, but we can live with that as long as they're uninterrupted (although we haven't proven that they are)

```
$ POSTMESSAGE_IN_MICROTASK=1 deno --allow-env src/run-test.ts
microtask 1
immediate 1
message 1
message 1 - microtask
message 2
message 2 - microtask
timeout 1
```

### Browsers

Running this in a browser REPL:

```
void setTimeout(() => {
	const { port1: sendPort, port2: receivePort } = new MessageChannel();
	sendPort.postMessage('1');
	sendPort.postMessage('2');
	receivePort.onmessage = (event) => {
		const id = event.data;
		console.log(`message ${id}`);
		queueMicrotask(() => {
			console.log(`message ${id} - microtask`);
		});
	};

	queueMicrotask(() => {
		console.log('microtask 1');
	});
	setTimeout(() => {
		console.log('timeout 1');
	});
});
```

#### Firefox / Chrome

Messages run in separate tasks, but not uninterrupted (the timer sneaks inbetween)

```
microtask 1
message 1
message 1 - microtask
timeout 1
message 2
message 2 - microtask
```

#### Safari

Messages seem to run in separate tasks and uninterrupted (?), but notably only after the timer

```
microtask 1
timeout 1
message 1
message 1 - microtask
message 2
message 2 - microtask
```
