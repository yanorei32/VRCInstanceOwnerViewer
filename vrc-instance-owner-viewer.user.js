// ==UserScript==
// @name		VRChat Instance Owner Viewer
// @description	VRChat Instance page improve (UserScript)
// @version		0.4.0
// @match		https://vrchat.com/home*
// @match		https://api.vrchat.com/home*
// @match		https://api.vrchat.cloud/home*
// @website		https://github.com/Yanorei32/VRCInstanceOwnerViewer
// @namespace	http://yano.teamfruit.net/~rei/
// @updateURL	https://github.com/Yanorei32/VRCInstanceOwnerViewer/vrc-instance-owner-viewer.user.js
// @license		MIT License
// @grant		none
// ==/UserScript==

(function() {
	'use strict';

	const DOM_POLLING_INTERVAL = 250;
	const DOM_POLLING_RETRY = (1000/DOM_POLLING_INTERVAL)*5;

	const APIKEY = document.cookie.replace(
		/(?:(?:^|.*;\s*)apiKey\s*\=\s*([^;]*).*$)|^.*$/,
		'$1',
	);
	if (!APIKEY) {
		console.error("Need login");
		return;
	}

	let dispNameCache = null;
	const getDispName = (uid, cb) => {
		dispNameCache = dispNameCache || JSON.parse(
			localStorage.getItem('dispNameCache')
		) || {};

		if (dispNameCache[uid] !== undefined) {
			cb(dispNameCache[uid]);
			return;
		}

		const req = new XMLHttpRequest();

		req.addEventListener('load', () => {
			if (req.status != 200) {
				console.error(`API Responce: ${req.status}`);
				cb(`Err: ${req.status}`);
				return;
			}

			const resp = JSON.parse(req.responseText);

			dispNameCache[uid] = resp['displayName'];
			localStorage.setItem('dispNameCache', JSON.stringify(dispNameCache));

			cb(dispNameCache[uid]);
		});

		req.open('GET', `https://vrchat.com/api/1/users/${uid}?apiKey=${APIKEY}`);
		req.send();
	};

	const getUid = (uri) => {
		return uri.match(/usr_[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/g);
	};

	const getUserPageURI = (uid) => {
		return `https://vrchat.com/home/user/${uid}`;
	};

	const processedE = new WeakMap();

	const processBlock = (e) => {
		if (processedE.has(e)) return;
		processedE.set(e);


		const polling = setInterval(() => {
			const locationTitleE = e.querySelector('h6.location-title');
			if (!locationTitleE) return;
			clearInterval(polling);

			const worldLinkE = locationTitleE.getElementsByTagName('a')[0];
			const uid = getUid(worldLinkE.href);
			if (!uid) return;

			const spanE = document.createElement('span');
			spanE.textContent = 'by ';

			const aE = document.createElement('a');
			aE.textContent = 'loading...';
			aE.href = getUserPageURI(uid);

			spanE.appendChild(aE);

			locationTitleE.appendChild(spanE);

			getDispName(uid, (dispName) => {
				aE.textContent = dispName;
			});
		}, DOM_POLLING_INTERVAL);
	};

	const observeLocContE = (locContE) => {
		const locsE = locContE.querySelector('div.locations');
		if (!locsE) return;

		for (const e of locsE.querySelectorAll('div.mb-1'))
			processBlock(e);

		(new MutationObserver((records) => {
			for (const record of records)
				for (const addedNode of record.addedNodes)
					if (addedNode.nodeType == Node.ELEMENT_NODE) {
						for (const e of addedNode.querySelectorAll('div.mb-1'))
							processBlock(e);

						if (addedNode.classList.contains('mb-1'))
							processBlock(addedNode);
					}
		})).observe(
			locsE,
			{ childList: true },
		);
	};

	const spaloggedin = () => {
		{
			let retryCount = 0;
			const polling = setInterval(() => {
				const homeCE = document.querySelector('div.home-content');
				if (!homeCE) {
					if (DOM_POLLING_RETRY <= ++retryCount)
						clearInterval(polling);
					return;
				}
				clearInterval(polling);

				{
					let retryCount = 0;
					const polling = setInterval(() => {
						// friend locations
						const locContE = homeCE.querySelector('div.location-container');
						if (locContE) {
							observeLocContE(locContE);
							clearInterval(polling);
							return;
						}
						const friendViewLocationTitleE = homeCE.querySelector('div>div>div>div>div>div.usercard>div>div>div.location-card>div');
						if (friendViewLocationTitleE) {
							processBlock(friendViewLocationTitleE);
							clearInterval(polling);
							return;
						}
						if (DOM_POLLING_RETRY <= ++retryCount)
							clearInterval(polling);
						return;
					}, DOM_POLLING_INTERVAL);
				}


				(new MutationObserver((records) => {
					for (const record of records)
						for (const addedNode of record.addedNodes)
							if (addedNode.nodeType == Node.ELEMENT_NODE) {
								// friend locations
								const locContE = addedNode.querySelector('div.location-container');
								if (locContE) {
									observeLocContE(locContE);
									return;
								}
								// firend
								const friendViewLocationTitleE = addedNode.querySelector('div>div>div>div>div>div.usercard>div>div>div.location-card>div');
								if (friendViewLocationTitleE) {
									processBlock(friendViewLocationTitleE);
									return;
								}
								return;
							}
				})).observe(
					homeCE,
					{ childList: true },
				);
			}, DOM_POLLING_INTERVAL);
		}

		{
			let retryCount = 0;
			const polling = setInterval(() => {
				const friendCE = document.querySelector('div.friend-container');
				if (!friendCE) {
					if (DOM_POLLING_RETRY <= ++retryCount)
						clearInterval(polling);
					return;
				}
				clearInterval(polling);

				for (const e of friendCE.querySelectorAll('div.mb-1'))
					processBlock(e);

				(new MutationObserver((records) => {
					for (const record of records)
						for (const addedNode of record.addedNodes)
							if (addedNode.nodeType == Node.ELEMENT_NODE) {
								for (const e of addedNode.querySelectorAll('div.mb-1'))
									processBlock(e);

								if (addedNode.classList.contains('mb-1'))
									processBlock(addedNode);
							}
				})).observe(
					friendCE,
					{ childList: true, subtree: true },
				);


			}, DOM_POLLING_INTERVAL);
		}
	};

	spaloggedin();
	setTimeout(() => {
		(new MutationObserver((records) => {
			setTimeout(spaloggedin, DOM_POLLING_INTERVAL);
		})).observe(
			document.querySelector('div#app>div>main'),
			{ childList: true, attributes: true, characterData: true },
		);
	}, DOM_POLLING_INTERVAL*20);

	{
		let retryCount = 0;
		const polling = setInterval(() => {
			const cardTitleEs = document.querySelectorAll('h2.card-title');
			if (cardTitleEs.length < 2) {
				if (DOM_POLLING_RETRY <= ++retryCount)
					clearInterval(polling);
				return;
			}
			clearInterval(polling);

			const uid = getUid(location.href);
			if (!uid) return;

			for (const e of cardTitleEs) {
				const spanE = document.createElement('span');
				spanE.textContent = ' by ';

				const aE = document.createElement('a');
				aE.href = getUserPageURI(uid);
				aE.textContent = 'loading...';

				spanE.appendChild(aE);

				e.appendChild(spanE);

				getDispName(uid, (dispName) => {
					aE.textContent = dispName;
				});
			}
		}, DOM_POLLING_INTERVAL);
	}

})();

