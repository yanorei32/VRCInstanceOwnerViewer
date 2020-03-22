// ==UserScript==
// @name		VRChat Instance Owner Viewer
// @description	VRChat Instance page improve (UserScript)
// @version		0.1.0
// @match		https://vrchat.com/home/launch?*
// @website		https://github.com/Yanorei32/VRCInstanceOwnerViewer
// @namespace	http://yano.teamfruit.net/~rei/
// @updateURL	https://github.com/Yanorei32/VRCInstanceOwnerViewer/vrc-instance-owner-viewer.user.js
// @license		MIT License
// @grant		none
// ==/UserScript==

(function() {
	'use strict';

	const apiKey = document.cookie.replace(/(?:(?:^|.*;\s*)apiKey\s*\=\s*([^;]*).*$)|^.*$/, '$1');

	if (!apiKey) {
		console.error("Need login");
		return;
	}

	const userId = location.href.match(/usr_[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/g);

	if (userId == null) {
		console.error("Maybe public instance");
		return;
	}

	const xhr = new XMLHttpRequest();

	xhr.addEventListener('load', () => {
		if(xhr.status != 200) {
			console.error(`API Responce: ${xhr.status}`);
			return;
		}

		const parsedResponse = JSON.parse(xhr.responseText);
		const displayName = parsedResponse['displayName'];

		const watcher = setInterval(() => {
			const t_ary = document.querySelectorAll('h2.card-title');
			if (t_ary.length != 2) return;

			for (const t of t_ary) {
				const span = document.createElement('span');
				const a = document.createElement('a');
				a.textContent = displayName;
				a.href = `https://vrchat.com/home/user/${userId}`;
				span.textContent = ' - instanciate by ';
				span.appendChild(a);
				t.appendChild(span);
			}

			clearInterval(watcher);
		}, 250);
	});

	xhr.open('GET', `https://vrchat.com/api/1/users/${userId}?apiKey=${apiKey}`);
	xhr.send();
})();

