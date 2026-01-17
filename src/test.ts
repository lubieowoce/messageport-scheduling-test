// Expected order of logs (in Node and Bun):
//
// microtask 1             }  task 0
// message 1               \  task 1 (message 1)
// message 1 - microtask   /
// message 2               \  task 2 (message 2)
// message 2 - microtask   /
// immediate 1             } task 3
// timeout 1               } task 4
//
// Observed order on workerd:
//
// message 1              \
// message 2              |
// microtask 1            | task 0 (because messages are not processed in separate tasks)
// message 1 - microtask  |
// message 2 - microtask  /
// timeout 1              } task 1
// immediate 1            } task 2
//
// (the immediate is going to be ordered differently on workerd, because it's just `setTimeout(..., 0)`)

export async function testMessagePort() {
	const logs: string[] = [];
	const log = (msg: string) => {
		console.log(msg);
		logs.push(msg);
	};

	const done = Array.from({ length: 3 }, () => createPromiseWithResolvers<void>());

	setTimeout(() => {
		const { port1: sendPort, port2: receivePort } = new MessageChannel();
		// queue two messages on a messageport
		let pendingMessages = 0;
		sendPort.postMessage('1');
		pendingMessages++;
		sendPort.postMessage('2');
		pendingMessages++;

		// attach a listener only after the messages are queued
		receivePort.onmessage = (event: MessageEvent) => {
			pendingMessages--;
			const id = (event as MessageEvent).data;
			log(`message ${id}`);
			queueMicrotask(() => {
				log(`message ${id} - microtask`);
				if (pendingMessages === 0) {
					done[2].resolve();
				}
			});
		};
		// in node, we have to unref the messageport, otherwise it'll prevent exit
		if ('unref' in receivePort && typeof receivePort.unref === 'function') {
			receivePort.unref();
		}

		queueMicrotask(() => {
			log('microtask 1');
		});

		setTimeout(() => {
			log('timeout 1');
			done[1].resolve();
		});
		setImmediate(() => {
			log('immediate 1');
			done[0].resolve();
		});
	});

	await Promise.all(done.map((d) => d.promise));
	const result = logs.join('\n') + '\n';
	return result;
}

function createPromiseWithResolvers<T>() {
	let resolve: (value: T | Promise<T>) => void = undefined!;
	let reject: (reason: unknown) => void = undefined!;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}
