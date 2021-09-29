import { api, provider } from 'snowbox';

export const appApi = api({
	baseUrl: 'http://localhost:4444',
});

export const appProvider = provider(appApi);

export default appProvider;
