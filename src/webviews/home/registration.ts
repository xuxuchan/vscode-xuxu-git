import type { WebviewsController } from '../webviewsController';
import type { State } from './protocol';

export function registerHomeWebviewView(controller: WebviewsController) {
	return controller.registerWebviewView<State>(
		{
			id: 'gitlens.views.home',
			fileName: 'home.html',
			title: '主页',
			contextKeyPrefix: `gitlens:webviewView:home`,
			trackingFeature: 'homeView',
			plusFeature: false,
			webviewHostOptions: {
				retainContextWhenHidden: false,
			},
		},
		async (container, host) => {
			const { HomeWebviewProvider } = await import(/* webpackChunkName: "webview-home" */ './homeWebview');
			return new HomeWebviewProvider(container, host);
		},
	);
}
