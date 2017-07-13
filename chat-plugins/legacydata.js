'strict mode';

const fs = require('fs');
const sqlite3 = require('sqlite3');
const moment = require('moment');
const MD5 = require('MD5');
const http = require('http');

let colourCache = {};
Legacy.customColours = {};
let regdateCache = {};

Object.assign(Legacy, {
	hashColour: function (name) {
		name = toId(name);
		if (Legacy.customColours[name]) return Legacy.customColours[name];
		if (mainColours[name]) name = mainColours[name];
		if (colourCache[name]) return colourCache[name];

		let hash = MD5(name);
		let H = parseInt(hash.substr(4, 4), 16) % 360; // 0 to 360
		let S = parseInt(hash.substr(0, 4), 16) % 50 + 40; // 40 to 89
		let L = Math.floor(parseInt(hash.substr(8, 4), 16) % 20 + 30); // 30 to 49
		let C = (100 - Math.abs(2 * L - 100)) * S / 100 / 100;
		let X = C * (1 - Math.abs((H / 60) % 2 - 1));
		let m = L / 100 - C / 2;

		let R1, G1, B1;
		switch (Math.floor(H / 60)) {
		case 1: R1 = X; G1 = C; B1 = 0; break;
		case 2: R1 = 0; G1 = C; B1 = X; break;
		case 3: R1 = 0; G1 = X; B1 = C; break;
		case 4: R1 = X; G1 = 0; B1 = C; break;
		case 5: R1 = C; G1 = 0; B1 = X; break;
		default: R1 = C; G1 = X; B1 = 0; break;
		}
		let lum = (R1 + m) * 0.2126 + (G1 + m) * 0.7152 + (B1 + m) * 0.0722; // 0.05 (dark blue) to 0.93 (yellow)
		let HLmod = (lum - 0.5) * -100; // -43 (yellow) to 45 (dark blue)
		if (HLmod > 12) {
			HLmod -= 12;
		} else if (HLmod < -10) {
			HLmod = (HLmod + 10) * 2 / 3;
		} else {
			HLmod = 0;
		}

		L += HLmod;
		let Smod = 10 - Math.abs(50 - L);
		if (HLmod > 15) Smod += (HLmod - 15) / 2;
		S -= Smod;

		let rgb = this.hslToRgb(H, S, L);
		colourCache[name] = "#" + this.rgbToHex(rgb.r, rgb.g, rgb.b);
		return colourCache[name];
	},

	hslToRgb: function (h, s, l) {
		let r, g, b, m, c, x;

		if (!isFinite(h)) h = 0;
		if (!isFinite(s)) s = 0;
		if (!isFinite(l)) l = 0;

		h /= 60;
		if (h < 0) h = 6 - (-h % 6);
		h %= 6;

		s = Math.max(0, Math.min(1, s / 100));
		l = Math.max(0, Math.min(1, l / 100));

		c = (1 - Math.abs((2 * l) - 1)) * s;
		x = c * (1 - Math.abs((h % 2) - 1));

		if (h < 1) {
			r = c;
			g = x;
			b = 0;
		} else if (h < 2) {
			r = x;
			g = c;
			b = 0;
		} else if (h < 3) {
			r = 0;
			g = c;
			b = x;
		} else if (h < 4) {
			r = 0;
			g = x;
			b = c;
		} else if (h < 5) {
			r = x;
			g = 0;
			b = c;
		} else {
			r = c;
			g = 0;
			b = x;
		}

		m = l - c / 2;
		r = Math.round((r + m) * 255);
		g = Math.round((g + m) * 255);
		b = Math.round((b + m) * 255);

		return {
			r: r,
			g: g,
			b: b,
		};
	},

	rgbToHex: function (R, G, B) {
		return this.toHex(R) + this.toHex(G) + this.toHex(B);
	},

	toHex: function (N) {
		if (N === null) return "00";
		N = parseInt(N);
		if (N === 0 || isNaN(N)) return "00";
		N = Math.max(0, N);
		N = Math.min(N, 255);
		N = Math.round(N);
		return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
	},

	nameColour: function (name, bold) {
		return (bold ? "<b>" : "") + "<font color=" + this.hashColour(name) + ">" +
		(Users(name) && Users.getExact(name) ? Tools.escapeHTML(Users.getExact(name).name) : Tools.escapeHTML(name)) +
		"</font>" + (bold ? "</b>" : "");
	},

	regdate: function (target, callback) {
		target = toId(target);
		if (regdateCache[target]) return callback(regdateCache[target]);
		let options = {
			host: 'pokemonshowdown.com',
			port: 80,
			path: '/users/' + target + '.json',
			method: 'GET',
		};
		http.get(options, function (res) {
			let data = '';
			res.on('data', function (chunk) {
				data += chunk;
			}).on('end', function () {
				if (data.charAt(0) !== '{') data = JSON.stringify({registertime: 0});
				data = JSON.parse(data);
				let date = data['registertime'];
				if (date !== 0 && date.toString().length < 13) {
					while (date.toString().length < 13) {
						date = Number(date.toString() + '0');
					}
				}
				if (date !== 0) {
					regdateCache[target] = date;
					saveRegdateCache();
				}
				callback((date === 0 ? false : date));
			});
		});
	},
	updateSeen: function (user) {
		let userid = toId(user);
		if (userid.match(/^guest[0-9]/)) return false;
		let date = Date.now();
		Legacy.database.run("UPDATE users SET lastSeen=$date, name=$name WHERE userid=$userid;", {$date: date, $name: user, $userid: userid}, function (err) {
			if (err) return console.log('updateSeen 1: ' + err);
			Legacy.database.run("INSERT OR IGNORE INTO users (userid, name, lastSeen) VALUES ($userid, $name, $date)", {$userid: userid, $name: user, $date: date}, function (err) {
				if (err) return console.log("updateSeen 2: " + err);
			});
		});
	},

	lastSeen: function (userid, callback) {
		Legacy.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (err) return console.log("lastSeen: " + err);
			callback((rows[0] ? rows[0].lastSeen : false));
		});
	},

	reloadCSS: function () {
		let options = {
			host: 'play.pokemonshowdown.com',
			port: 80,
			path: '/customcss.php?server=legacy',
			method: 'GET',
		};
		http.get(options);
	},
	saveAutoJoins: function () {
		fs.writeFileSync('config/autojoin.json', JSON.stringify(Legacy.autoJoinRooms));
	},
	getTitle: function (userid, callback) {
		if (!callback) return false;
		userid = toId(userid);
		Wisp.database.all("SELECT title FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (err) return console.log("getTitle: " + err);
			callback(((rows[0] && rows[0].title) ? rows[0].title : ""));
		});
	},

	setTitle: function (userid, title, callback) {
		userid = toId(userid);
		Wisp.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (rows.length < 1) {
				Wisp.database.run("INSERT INTO users(userid, title) VALUES ($userid, $title)", {$userid: userid, $title: title}, function (err) {
					if (err) return console.log("setTitle 1: " + err);
					if (callback) return callback();
				});
			} else {
				Wisp.database.run("UPDATE users SET title=$title WHERE userid=$userid", {$title: title, $userid: userid}, function (err) {
					if (err) return console.log("setTitle 2: " + err);
					if (callback) return callback();
				});
			}
		});
	},

	parseMessage: function (message) {
		if (message.substr(0, 5) === "/html") {
			message = message.substr(5);
			message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>'); // italics
			message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<b>$1</b>'); // bold
			message = message.replace(/\~\~([^< ](?:[^<]*?[^< ])?)\~\~/g, '<strike>$1</strike>'); // strikethrough
			message = message.replace(/&lt;&lt;([a-z0-9-]+)&gt;&gt;/g, '&laquo;<a href="/$1" target="_blank">$1</a>&raquo;'); // <<roomid>>
			message = Autolinker.link(message.replace(/&#x2f;/g, '/'), {stripPrefix: false, phone: false, twitter: false});
			return message;
		}
		message = Tools.escapeHTML(message).replace(/&#x2f;/g, '/');
		message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>'); // italics
		message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<b>$1</b>'); // bold
		message = message.replace(/\~\~([^< ](?:[^<]*?[^< ])?)\~\~/g, '<strike>$1</strike>'); // strikethrough
		message = message.replace(/&lt;&lt;([a-z0-9-]+)&gt;&gt;/g, '&laquo;<a href="/$1" target="_blank">$1</a>&raquo;'); // <<roomid>>
		message = Autolinker.link(message, {stripPrefix: false, phone: false, twitter: false});
		return message;
	},
});

function getProfileData(user, callback) {
	let userid = toId(user);
	let reply = {
		p: 0,
		g: 0,
		s: 0,
		c: 0,
		regdate: "(Unregistered)",
		lastOnline: "Never",
		title: "",
	};
	Legacy.database.all("SELECT * FROM users WHERE userid=$userid;", {$userid: userid}, function (err, rows) {
		if (err) return console.log("getProfileData 1: " + err);
		Legacy.regdate(userid, function (date) {
			if (date) reply.regdate = moment(date).format("DD MMMM, YYYY");
			if (!rows[0]) return callback(reply);

			let userData = rows[0];
			if (userData.platinum) reply.p = userData.platinum;
			if (userData.gold) reply.g = userData.gold;
			if (userData.silver) reply.s = userData.silver;
			if (userData.copper) reply.c = userData.copper;
			if (userData.lastSeen) reply.lastOnline = userData.lastSeen;
			if (userData.title) reply.title = userData.title;

			return callback(reply);
		});
	});
}

function loadRegdateCache() {
	try {
		regdateCache = JSON.parse(fs.readFileSync('config/regdate.json', 'utf8'));
	} catch (e) {}
}
loadRegdateCache();

function saveRegdateCache() {
	fs.writeFileSync('config/regdate.json', JSON.stringify(regdateCache));
}
