/*
 * @Description:
 * @Author: xuxu
 * @Date: 2024-06-15 14:39:13
 * @LastEditors: xuxu
 * @LastEditTime: 2024-06-26 21:54:52
 * @Email: xuxuchan1988@gmail.com
 * Copyright (c) 2024 X-Tech Software, All Rights Reserved.
 */
import { ViewColumn } from 'vscode';
import { Commands } from '../../constants';
import type { WebviewsController } from '../webviewsController';
import type { State } from './protocol';

export function registerWelcomeWebviewPanel(controller: WebviewsController) {
	return controller.registerWebviewPanel<State>(
		{ id: Commands.ShowWelcomePage },
		{
			id: 'gitlens.welcome',
			fileName: 'welcome.html',
			iconPath: 'images/gitlens-icon.png',
			title: '欢迎使用 XUXU Git',
			contextKeyPrefix: `gitlens:webview:welcome`,
			trackingFeature: 'welcomeWebview',
			plusFeature: false,
			column: ViewColumn.Active,
			webviewHostOptions: {
				retainContextWhenHidden: false,
				enableFindWidget: true,
			},
		},
		async (container, host) => {
			const { WelcomeWebviewProvider } = await import(
				/* webpackChunkName: "webview-welcome" */ './welcomeWebview'
			);
			return new WelcomeWebviewProvider(container, host);
		},
	);
}
