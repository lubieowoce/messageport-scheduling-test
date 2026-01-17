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
