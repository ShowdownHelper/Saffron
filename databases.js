'use strict'

//LOAD OTHER GLOBALS//

global.sqlite3 = require('sqlite3');
global.Db = require('origindb')('config/db');
global.Users = require('./users');
global.Punishments = require('./punishments');
global.Chat = require('./chat');
global.Rooms = require('./rooms');

//CONSTS//

const MD5 = require('MD5');
const http = require('http');
const fs = require('fs');
const moment = require('moment');
let colorCache = {};
let mainColors = {};
let regdateCache = {};

class legacy {
    constructor() {
		
		//CSS ELEMENTS//
		this.customColors = {};
		this.staffSymbol = {};
		this.icons = {};
		
		//SHOP//
		this.itemList = [];
		this.currencies = [];
		try {
			this.shopData = JSON.parse(fs.readFileSync('./config/shopData.json', 'utf8')); 
		} catch (e) {
			this.shopData = {closed: true};
		}
		
		//INVENTORY//
		try {
			this.itemData = JSON.parse(fs.readFileSync('./config/itemData.json', 'utf8'));
		} catch (e) {
			this.itemData = {};
		}
		
		//FILTERDATA//
		try {
			this.filterData = JSON.parse(fs.readFileSync('./config/filterData.json', 'utf8'));
		} catch (e) {
			this.filterData = {};
			this.filterData.abuseList = ['fuck', 'shit', 'nigga', 'cunt', 'fag', 'faggot', 'nigger', 'kike', 'jew', 'spic', 'muslim', 'twat', 'pussy','tits', 'porn', 'slut', 'whore', 'cock', 'dirty', 'mexican', 'white', 'black', 'penis', 'dick', 'bitch', 'beaner', 'nazi', 'coon', 'suck', 'african'];
			this.filterData.infractTiers = [3, 5, 10, 20];
			this.filterData.whitelist = ['legacy.psim.us', 'smogontiers.psim.us'];
			this.filterData.isSetup = false;
		}
		try {
			this.ipwhitelist = JSON.parse(fs.readFileSync('./config/ipwhitelist.json', 'utf8'));
		} catch (e) {
			this.ipwhitelist = {};
		}
		try {
			this.sbanData = fs.readFileSync('./config/sbanlist.csv', 'utf8').split(',');
		} catch (e) {
			this.sbanData = [];
		}
		this.sbanVal = 0;
		
		//DATABASES//
        this.database = new sqlite3.Database('config/users.db');
		
		//MISC//
		this.serverOwners = ['legacysaffron', 'finny'];
		try {
			this.autoJoinRooms = JSON.parse(fs.readFileSync('config/autojoin.json', 'utf8'));
		} catch (e) {
			this.autoJoinRooms = {};
		}
	}
	
	//COLOR FUNCTIONS//
	
    hashColor (name) {
		name = toId(name);
		if (mainColors[name]) name = mainColors[name];
		if (this.customColors[name]) return this.customColors[name];
		if (this.staffSymbol[name]) return this.staffSymbol[name];
		if (colorCache[name]) return colorCache[name];

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
		case 0: default: R1 = C; G1 = X; B1 = 0; break;
		}
		let lum = (R1 + m) * 0.2126 + (G1 + m) * 0.7152 + (B1 + m) * 0.0722; // 0.05 (dark blue) to 0.93 (yellow)
		let HLmod = (lum - 0.5) * -100; // -43 (yellow) to 45 (dark blue)
		if (HLmod > 12) HLmod -= 12;
		else if (HLmod < -10) HLmod = (HLmod + 10) * 2 / 3;
		else HLmod = 0;

		L += HLmod;
		let Smod = 10 - Math.abs(50 - L);
		if (HLmod > 15) Smod += (HLmod - 15) / 2;
		S -= Smod;

		let rgb = this.hslToRgb(H, S, L);
		colorCache[name] = "#" + this.rgbToHex(rgb.r, rgb.g, rgb.b);
		return colorCache[name];
	}

	hslToRgb (h, s, l) {
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
	}

	rgbToHex (R, G, B) {
		return this.toHex(R) + this.toHex(G) + this.toHex(B);
	}
	
	toHex (N) {
		if (N === null) return "00";
		N = parseInt(N);
		if (N === 0 || isNaN(N)) return "00";
		N = Math.max(0, N);
		N = Math.min(N, 255);
		N = Math.round(N);
		return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
	}

	nameColor (name, bold) {
		return (bold ? "<b>" : "") + "<font color=" + this.hashColor(name) + " style='text-shadow: 1px 1px 0 #000;'>" +
		(Users(name) && Users(name).connected && Users.getExact(name) ? Chat.escapeHTML(Users.getExact(name).name) : Chat.escapeHTML(name)) +
		"</font>" + (bold ? "</b>" : "");
	}
	
	//REGDATE FUNCTIONS//

	regdate (target, callback) {
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
				data = JSON.parse(data);
				let date = data['registertime'];
				if (date !== 0 && date.toString().length < 13) {
					while (date.toString().length < 13) {
						date = Number(date.toString() + '0');
					}
				}
				if (date !== 0) {
					regdateCache[target] = date;
					Legacy.saveRegdateCache();
				}
				callback((date === 0 ? false : date));
			});
		});
	}
	loadRegdateCache() {
		try {
			regdateCache = JSON.parse(fs.readFileSync('config/regdate.json', 'utf8'));
		} catch (e) {}
	}

	saveRegdateCache() {
		fs.writeFileSync('config/regdate.json', JSON.stringify(regdateCache));
	}
	
	//SEEN FUNCTIONS//

	updateSeen (userid) {
		userid = toId(userid);
		if (~userid.indexOf('guest')) return false;
		let date = Date.now();
		this.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (rows.length < 1) {
				Legacy.database.run("INSERT INTO users(userid, lastSeen) VALUES ($userid, $date)", {$userid: userid, $date: date}, function (err) {
					if (err) return //console.log(err);
				});
			} else {
				Legacy.database.run("UPDATE users SET lastSeen=$date WHERE userid=$userid", {$date: date, $userid: userid}, function (err) {
					if (err) return //console.log(err);
				});
			}
		});
	}

	lastSeen (userid, callback) {
		this.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (err) return //console.log(err);
			callback((rows[0] ? rows[0].lastSeen : false));
		});
	}
	
	//TITLE FUNCTIONS//
        
    getTitle (userid, callback) {
		if (!callback) return false;
		userid = Alts.getMain(toId(userid));
		Legacy.database.all("SELECT title FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (err) return //console.log(err);
			callback(((rows[0] && rows[0].title) ? rows[0].title : ""));
		});
	}

	setTitle (userid, title, callback) {
	userid = Alts.getMain(toId(userid));
		Legacy.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) { 
			if (rows.length < 1) {
				Legacy.database.run("INSERT INTO users(userid, title) VALUES ($userid, $title)", {$userid: userid, $title: title}, function (err) {
					if (err) return //console.log(err);
					if (callback) return callback();
				});
			} else {
				Legacy.database.run("UPDATE users SET title=$title WHERE userid=$userid", {$title: title, $userid: userid}, function (err) {
					if (err) return //console.log(err);
					if (callback) return callback();
				});
			}
		});
	}
	
	//NEWS FUNCTIONS//
	
	generateNews () {
		let lobby = Rooms('lobby');
		if (!lobby) return false;
		if (!lobby.news || Object.keys(lobby.news).length < 0) return false;
		if (!lobby.news) lobby.news = {};
		let news = lobby.news, newsDisplay = [];
		Object.keys(news).forEach(announcement => {
			newsDisplay.push(`<h4>${announcement}</h4>${news[announcement].desc}<br /><br /><strong>${news[announcement].type}</strong> - ${moment(news[announcement].posted).format("MMM D, YYYY")}`);
		});
		return newsDisplay;
	}
	
	generateStaffNews () {
		let staff = Rooms('staff');
		if (!staff) return false;
		if (!staff.news || Object.keys(staff.news).length < 0) return false;
		if (!staff.news) staff.news = {};
		let news = staff.news, newsDisplay = [];
		Object.keys(news).forEach(announcement => {
			newsDisplay.push(`<h4>${announcement}</h4>${news[announcement].desc}<br /><br /><strong><font color="${Legacy.hashColor(news[announcement].by)}">${news[announcement].by}</font></strong> on ${moment(news[announcement].posted).format("MMM D, YYYY")}`);
		});
		return newsDisplay;
	}
	
	newsStaffDisplay (userid) {
		userid = toId(userid);
		if (!Users(userid)) return false;
		let newsDis = this.generateStaffNews();
		if (newsDis.length === 0) return false;

		if (newsDis.length > 0) {
			newsDis = newsDis.join('<hr>');
			return Users(userid).send(`|pm| Staff News|${Users(userid).getIdentity()}|/raw ${newsDis}`);
	    }
	}
	
	newsDisplay (userid) {
		userid = toId(userid);
		let self = this;
		this.checkNews(userid, block => {
			if (block) return false;
			if (!Users(userid)) return false;
			if (Users(userid).gotNews) return false;
			let newsDis = self.generateNews();
			if (newsDis.length === 0) return false;

			if (newsDis.length > 0) {
				newsDis = newsDis.join('<hr>');
				Users(userid).gotNews = true;
				return Users(userid).send(`|pm| Server Updates|${Users(userid).getIdentity()}|/raw ${newsDis}`);
			}
		});
	}
	
	checkNews (userid, callback) {
		userid = Alts.getMain(toId(userid));
		Legacy.database.all("SELECT blockNews FROM users WHERE userid=$userid", {$userid: userid}, function (err, results) {
			if (!results || !results[0]) {
                Legacy.database.all("INSERT INTO users(userid) VALUES ($userid)", {$userid: userid});
                if (callback) return callback (false);
			} else if (callback) return callback (results[0].blockNews);
		});
	}
	
	//SPRITE//
	
	
	getSprite (pokeName, callback) {
		let poke = toId(pokeName);
		poke = 'https://play.pokemonshowdown.com/sprites/bwani/'+poke+'.gif';
		if (callback) return callback(poke);
	}
	
	validatePoke (pokeName, self, callback) {
		pokeName = pokeName.charAt(0).toUpperCase() + pokeName.slice(1);
		let pokeid = Tools.getSpecies(pokeName);
		validation.idValidator(pokeid, thisPoke => {
			if (!thisPoke) {
				callback (false);
			} else callback (pokeid);
		});
	}
	
	//MISC FUNCTIONS//
	
	reloadCSS () {
		let options = {
			host: 'play.pokemonshowdown.com',
			port: 80,
			path: '/customcss.php?server=legacy',
			method: 'GET',
		};
		http.get(options);
	}

	messageSeniorStaff (message) {
		for (let u in Rooms.global.users) {
			let curUser = Users(u);
			if (!curUser || !curUser.connected || !curUser.can('seniorstaff')) continue;
			curUser.send('|pm|~Server|~|' + message);
		}
	}
	
	saveAutoJoins () {
		fs.writeFileSync('config/autojoin.json', JSON.stringify(Legacy.autoJoinRooms));
	}
}

let Legacy = module.exports = new legacy();

//STARTUP//
Legacy.loadRegdateCache();
Legacy.database.run("CREATE TABLE if not exists users (userid TEXT, gold INTEGER, silver INTEGER, copper INTEGER, league TEXT, gang TEXT, lastSeen INTEGER, title TEXT, notifyStatus INTEGER, blockNews INTEGER, showcaseSort TEXT, linked TEXT)");
Legacy.database.run("CREATE TABLE if not exists friends (userid TEXT, friend TEXT, bestfriend INTEGER, dating INTEGER)");
Legacy.database.run("CREATE TABLE if not exists profile (userid TEXT, pabout TEXT, pcolor TEXT, pcolor2 TEXT, pbackground TEXT, league TEXT, gang TEXT)");
Legacy.database.run("CREATE TABLE if not exists leagues (leaguename TEXT, rep INTEGER, members INTEGER, colour1 TEXT, colour2 TEXT, colour3 TEXT, background TEXT, logo TEXT, logoheight INTEGER, logowidth INTEGER, desc TEXT)");
Legacy.database.run("CREATE TABLE if not exists gangs (gangname TEXT, power INTEGER, territory INTEGER, members INTEGER)");
