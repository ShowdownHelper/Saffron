// Code by Legacy Saffron.

'strict mode';

// fs? More like ffs
const fs = require('fs');
const sqlite3 = require('sqlite3');
const moment = require('moment');
const MD5 = require('MD5');
const http = require('http');

let serverIp = '144.217.82.98';

//    The
const Legacy = new sqlite3.Database('./databases/Legacy.db');
const Leagues = new sqlite3.Database('./databases/Leagues.db');

const Gangs = new sqlite3.Database('./databases/Gangs.db');
const Guilds = new sqlite3.Database('./databases/Guilds.db');

// Alliteration is Amazing

Legacy.serialize(function() {
  Legacy.run("CREATE TABLE if not exists Users (userid TEXT, lover TEXT, platinum INTEGER, gold INTEGER, silver INTEGER, copper INTEGER, league TEXT, gang TEXT, guild TEXT, lastseen INTEGER, title TEXT)");
  Legacy.run("CREATE TABLE if not exists Leagues (name TEXT, members INTEGER, prestige INTEGER, bismuth INTEGER, colour1 TEXT, colour2 TEXT, colour3 TEXT, logo TEXT, logoheight INTEGER, logowidth INTEGER, background TEXT, desc TEXT)");
  Legacy.run("CREATE TABLE if not exists Gangs (name TEXT, members INTEGER, power INTEGER, territory INTEGER)");
  Legacy.run("CREATE TABLE if not exists Guilds (name TEXT, members INTEGER, rep INTEGER, iridium INTEGER)");
});

class Guild {
  constructor(name, owner) {
    this.name = name;
    this.owner = owner;
  }
  
  create() {
    Guilds.serialize(function() {
    	Guilds.run("CREATE TABLE if not exists " + this.name + " (userid TEXT, rank TEXT, rep INTEGER)");
      Guilds.run("INSERT INTO " + this.name + " (userid, rank, rep, iridium) VALUES (" + this.owner + ", Owner, 100, 0)");
    });
    Legacy.run("INSERT INTO Guilds (name, members, rep) VALUES (" + this.name + ", 1, 100)");
  }
}

class League extends Guild {
  
  create() {
    Leagues.serialize(function() {
    	Leagues.run("CREATE TABLE if not exists " + this.name + " (userid TEXT, rank TEXT, honour INTEGER)");
      Leagues.run("INSERT INTO " + this.name + " (userid, rank, honour) VALUES (" + this.owner + ", Owner, 100)");
    });
    Legacy.run("INSERT INTO Leagues (name, members, prestige, bismuth, colour1, colour2, colour3, logo, logoheight, logowidth, background, desc) VALUES (" + this.name + ", 1, 100, 0, '#353535', '#828282', '#dddddd', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Logos.svg/1200px-Logos.svg.png', 90, 350, 'https://www.transparenttextures.com/patterns/wood.png', 'This league doesn't have a description yet.')");
  }
}

class Gang extends Guild {
  
  create() {
    Gangs.serialize(function() {
    	Gangs.run("CREATE TABLE if not exists " + this.name + " (userid TEXT, rank TEXT, influence INTEGER)");
      Gangs.run("INSERT INTO " + this.name + " (userid, rank, influence) VALUES (" + this.owner + ", Boss, 100)");
    });
  Legacy.run("INSERT INTO Gangs (name, members, power, territory) VALUES (" + this.name + ", 1, 0, 0)");
  }
}
let Economy = global.Economy = {
	readMoney: function (userid, callback) {
		if (!callback) return false;
		userid = toId(userid);
		Legacy.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
      let platinum = ((rows[0] && rows[0].platinum) ? rows[0].platinum : 0);
			callback(platinum);
			let gold = ((rows[0] && rows[0].gold) ? rows[0].gold : 0);
			callback(gold);
			let silver = ((rows[0] && rows[0].silver) ? rows[0].silver : 0);
			callback(silver);
			let copper = ((rows[0] && rows[0].copper) ? rows[0].copper : 0);
			callback(copper);
		});
	},
  	writeMoney: function (userid, copperamount, silveramount, goldamount, platinumamount, callback) {
		userid = toId(userid);
		Legacy.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (rows.length < 1) {
				Legacy.database.run("INSERT INTO users(userid, platinum, gold, silver, copper) VALUES ($userid, $goldamount, $silveramount, $copperamount)", {$userid: userid, $goldamount: goldamount, $silveramount: silveramount, $copperamount: copperamount}, function (err) {
					if (callback) return callback();
				});
			} else {        
				copperamount += rows[0].copper;
				silveramount += rows[0].silver;
				goldamount += rows[0].gold;
				platinumamount += rows[0].platinum;

				if (copperamount > 99) {
					copperamount -= 100;
					silveramount++;
				}
        
				if (copperamount < 0 && silveramount > 0) {
					copperamount += 100 + copperamount;
					silveramount--;
				}
					else if (copperamount < 0 && goldamount > 0) {
						copperamount += 100 + copperamount;
						silveramount += 99;
						goldamount--;
					}
						else if (copperamount < 0 && platinumamount > 0) {
							copperamount += 100 + copperamount;
							silveramount += 99;
							goldamount += 99;
							platinumamount--;
						}
							else {
								copperamount = 0;
							}

				if (silveramount > 99) {
					silveramount -= 100;
					goldamount++;
				}
        
				if (silveramount < 0 && goldamount > 0) {
					silveramount += 100 + silveramount;
					goldamount--;
				}
					else if (silveramount < 0 && platinumamount > 0) {
						silveramount += 100 + silveramount;
						goldamount += 99;
						platinumamount--;
					}
						else {
							silveramount = 0;
						}
        
        			if (goldamount > 99) goldamount -= 100;
					platinumamount++;
        
				if (goldamount < 0 && platinumamount > 0) {
					goldamount += 100 + goldamount;
					platinumamount--;
				}
					else {
						goldamount = 0;
					}
        
				if (platinumamount < 0) {
					platinumamount = 0;
				}
        
				let copper = copperamount;
				let silver = silveramount;
				let gold = goldamount;
				let platinum = platinumamount;
				
				Legacy.database.run("UPDATE users SET platinum=$platinumamount, gold=$goldamount, silver=$silveramount, copper=$copperamount WHERE userid=$userid", {$goldamount: gold, $silveramount: silveramount, $copperamount: copperamount, $userid: userid}, function (err) {
					if (callback) return callback();
				});
			}
		});
	}
};

exports.commands = {
	
	wallet: 'money',
	atm: 'money',
	checkmoney: 'money',
	money: function (target, room, user) {
		if (!target) target = user.name;
		if (!this.runBroadcast()) return;
		let userid = toId(target);
		if (userid.length < 1) return this.sendReply("/money - Please specify a user.");
		if (userid.length > 19) return this.sendReply("/money - [user] can't be longer than 19 characters.");

		Economy.readMoney(userid, copper =>
		Economy.readMoney(userid, silver =>
		Economy.readMoney(userid, gold =>
		Economy.readMoney(userid, platinum => {
			this.sendReplyBox(Chat.escapeHTML(target) + " has " + gold + " Gold, " + silver + " Silver, and " + copper + " Copper.");
			if (this.broadcasting) room.update();
			}))));
		},
	
	gm: 'givemoney',
	givemoney: function (target, room, user) {
		if (!user.can('rangeban')) return false;
		if (!target) return this.sendReply("Usage: /givemoney [user], [goldamount], [silveramount], [copperamount].");
		let splitTarget = target.split(',');
		if (!splitTarget[3]) return this.sendReply("Usage: /givemoney [user], [goldamount], [silveramount], [copperamount].");
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/givemoney - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/givemoney - [user] can't be longer than 19 characters.");

		let goldamount = Math.round(Number(splitTarget[1]));
		if (isNaN(goldamount)) return this.sendReply("/givemoney - [goldamount] must be a number.");
		if (goldamount > 100) return this.sendReply("/givemoney - You can't give more than 100 Gold at a time.");
		if (goldamount.length < 1) return this.sendReply("/givemoney - [goldamount] may not be blank.");

		let silveramount = Math.round(Number(splitTarget[2]));
		if (isNaN(silveramount)) return this.sendReply("/givemoney - [silveramount] must be a number.");
		if (silveramount > 99) return this.sendReply("/givemoney - You can't give more than 99 Silver at a time.");
		if (silveramount.length < 1) return this.sendReply("/givemoney - [silveramount] may not be blank.");

		let copperamount = Math.round(Number(splitTarget[3]));
		if (isNaN(copperamount)) return this.sendReply("/givemoney - [amount] must be a number.");
		if (copperamount > 100) return this.sendReply("/givemoney - You can't give more than 100 Gold at a time.");
		if (copperamount.length < 1) return this.sendReply("/givemoney - [copperamount] may not be blank.");
		if (goldamount + silveramount + copperamount < 1) return this.sendReply("/givemoney - You can't give less than one Copper, you stingy jerk.");

		Economy.writeMoney(targetUser, goldamount, silveramount, copperamount);
		this.sendReply(Chat.escapeHTML(targetUser) + " has received " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper.");
		Economy.logTransaction(user.name + " has given " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper to " + targetUser);
	},

	takemoney: function (target, room, user) {
		if (!user.can('rangeban')) return false;
		if (!target) return this.sendReply("Usage: /takemoney [user], [goldamount], [silveramount], [copperamount].");
		let splitTarget = target.split(',');
		if (!splitTarget[4]) return this.sendReply("Usage: /takemoney [user], [platinumamount], [goldamount], [silveramount], [copperamount].");
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/takemoney - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/takemoney - [user] can't be longer than 19 characters.");
    
		let platinumamount = Math.round(Number(splitTarget[1]));
		if (isNaN(platinumamount)) return this.sendReply("/takemoney - [platinumamount] must be a number.");
		if (platinumamount > 100) return this.sendReply("/takemoney - More than 100 Platinum? I don't think anyone is that rich.");
		if (platinumamount.length < 1) return this.sendReply("/takemoney - [platinumamount] may not be blank.");

		let goldamount = Math.round(Number(splitTarget[2]));
		if (isNaN(goldamount)) return this.sendReply("/takemoney - [goldamount] must be a number.");
		if (goldamount > 100) return this.sendReply("/takemoney - Taking more than 100 Gold at a time? What are you, a Tory?");
		if (goldamount.length < 1) return this.sendReply("/takemoney - [goldamount] may not be blank.");

		let silveramount = Math.round(Number(splitTarget[3]));
		if (isNaN(silveramount)) return this.sendReply("/takemoney - [silveramount] must be a number.");
		if (silveramount > 99) return this.sendReply("/takemoney - You can't take more than 99 Silver at a time.");
		if (silveramount.length < 1) return this.sendReply("/takemoney - [silveramount] may not be blank.");

		let copperamount = Math.round(Number(splitTarget[4]));
		if (isNaN(copperamount)) return this.sendReply("/takemoney - [amount] must be a number.");
		if (copperamount > 100) return this.sendReply("/takemoney - You can't take more than 100 Gold at a time.");
		if (copperamount.length < 1) return this.sendReply("/takemoney - [copperamount] may not be blank.");

		Economy.writeMoney(targetUser, -platinumamount, -goldamount, -silveramount, -copperamount);
		this.sendReply("You removed " + platinumamount + " Platinum, " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper from " + Chat.escapeHTML(targetUser));
		Economy.logTransaction(user.name + " has taken " + platinumamount + " Platinum, " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper from " + targetUser);
	},

	transfer: 'transfermoney',
	transfermoney: function (target, room, user) {
		if (!target) return this.sendReply("Usage: /transfermoney [user], [goldamount], [silveramount], [copperamount].");
		let splitTarget = target.split(',');
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();
		if (!splitTarget[4]) return this.sendReply("Usage: /transfermoney [user], [goldamount], [silveramount], [copperamount].");

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/transferpoints - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/transferpoints - [user] can't be longer than 19 characters.");

		let platinumamount = Math.round(Number(splitTarget[1]));
		if (isNaN(platinumamount)) return this.sendReply("/givemoney - [goldamount] must be a number.");
		if (platinumamount > 100) return this.sendReply("/givemoney - You can't give more than 100 Gold at a time.");
		if (platinumamount.length < 1) return this.sendReply("/givemoney - [goldamount] may not be blank.");
    
		let goldamount = Math.round(Number(splitTarget[2]));
		if (isNaN(goldamount)) return this.sendReply("/givemoney - [goldamount] must be a number.");
		if (goldamount > 100) return this.sendReply("/givemoney - You can't give more than 100 Gold at a time.");
		if (goldamount.length < 1) return this.sendReply("/givemoney - [goldamount] may not be blank.");

		let silveramount = Math.round(Number(splitTarget[3]));
		if (isNaN(silveramount)) return this.sendReply("/givemoney - [silveramount] must be a number.");
		if (silveramount > 99) return this.sendReply("/givemoney - You can't give more than 99 Silver at a time.");
		if (silveramount.length < 1) return this.sendReply("/givemoney - [silveramount] may not be blank.");

		let copperamount = Math.round(Number(splitTarget[4]));
		if (isNaN(copperamount)) return this.sendReply("/givemoney - [amount] must be a number.");
		if (copperamount > 100) return this.sendReply("/givemoney - You can't give more than 100 Gold at a time.");
		if (copperamount.length < 1) return this.sendReply("/givemoney - [copperamount] may not be blank.");
		if (platinumamount + goldamount + silveramount + copperamount < 1) return this.sendReply("/givemoney - You can't give less than one Copper, you stingy jerk.");

		Economy.readMoney(userid, copper =>
		Economy.readMoney(userid, silver =>
		Economy.readMoney(userid, gold =>
		Economy.readMoney(userid, platinum => {
			if (platinum < platinumamount) return this.sendReply("/transfermoney - You can't transfer more Platinum than you have.");
			if (gold < goldamount) return this.sendReply("/transfermoney - You can't transfer more Gold than you have.");
			if (silver < silveramount) return this.sendReply("/transfermoney - You can't transfer more Silver than you have.");
			if (copper < copperamount) return this.sendReply("/transfermoney - You can't transfer more Copper than you have.");
			Economy.writeMoney(user.userid, -platinumamount, -goldamount, -silveramount, -copperamount, () => {
				Economy.writeMoney(targetUser, platinumamount, goldamount, silveramount, copperamount, () => {
					this.sendReply("You've sent " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper to " + targetUser);
					Economy.logTransaction(user.name + " has transfered " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper to " + targetUser);
					if (Users.getExact(targetUser) && Users.getExact(targetUser)) Users.getExact(targetUser).popup(user.name + " has sent you " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper.");
				});
			});
		}))));
	}
};

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
