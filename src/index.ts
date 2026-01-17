import { testMessagePort } from './test';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const result = await testMessagePort();
		return new Response(result);
	},
} satisfies ExportedHandler<Env>;
