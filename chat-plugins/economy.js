'use strict';

const fs = require('fs');
const moment = require('moment');
const sqlite3 = require('sqlite3');

let serverIp = '144.217.82.98';

let Economy = global.Economy = {
	readMoney: function (userid, callback) {
		if (!callback) return false;
		userid = Alts.getMain(toId(userid));
		Legacy.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			let gold = ((rows[0] && rows[0].gold) ? rows[0].gold : 0);
			callback(gold);
			let silver = ((rows[0] && rows[0].silver) ? rows[0].silver : 0);
			callback(silver);
			let copper = ((rows[0] && rows[0].copper) ? rows[0].copper : 0);
			callback(copper);
		});
	},
	writeMoney: function (userid, copperamount, silveramount, goldamount, callback) {
		userid = Alts.getMain(toId(userid));
		Legacy.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (rows.length < 1) {
				Legacy.database.run("INSERT INTO users(userid, gold, silver, copper) VALUES ($userid, $goldamount, $silveramount, $copperamount)", {$userid: userid, $goldamount: goldamount, $silveramount: silveramount, $copperamount: copperamount}, function (err) {
					if (callback) return callback();
				});
			} else {        
				copperamount += rows[0].copper;
				silveramount += rows[0].silver;
				goldamount += rows[0].gold;

				if (copperamount > 99) copperamount -= 100;
					silveramount++;

				if (silveramount > 99) silveramount -= 100;
					goldamount++;
        
        let copper = copperamount;
        let silver = silveramount;
        let gold = goldamount;
				
				Legacy.database.run("UPDATE users SET gold=$goldamount, silver=$silveramount, copper=$copperamount WHERE userid=$userid", {$goldamount: gold, $silveramount: silveramount, $copperamount: copperamount, $userid: userid}, function (err) {
					if (callback) return callback();
				});
			}
		});
	},
	
	logTransaction: function (message) {
		if (!message) return false;
		fs.appendFile('logs/moneylog.log', '[' + new Date().toUTCString() + '] ' + message + '\n');
	},

	logDice: function (message) {
		if (!message) return false;
		fs.appendFile('logs/dice.log', '[' + new Date().toUTCString() + '] ' + message + '\n');
	},
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
		Economy.readMoney(userid, gold => {
			this.sendReplyBox(Chat.escapeHTML(target) + " has " + gold + " Gold, " + silver + " Silver, and " + copper + " Copper.");
			if (this.broadcasting) room.update();
			})));
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
		if (!splitTarget[1]) return this.sendReply("Usage: /takemoney [user], [goldamount], [silveramount], [copperamount].");
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/takemoney - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/takemoney - [user] can't be longer than 19 characters.");

		let goldamount = Math.round(Number(splitTarget[1]));
		if (isNaN(goldamount)) return this.sendReply("/takemoney - [goldamount] must be a number.");
		if (goldamount > 100) return this.sendReply("/takemoney - Taking more than 100 Gold at a time? What are you, a Tory?");
		if (goldamount.length < 1) return this.sendReply("/takemoney - [goldamount] may not be blank.");

		let silveramount = Math.round(Number(splitTarget[2]));
		if (isNaN(silveramount)) return this.sendReply("/takemoney - [silveramount] must be a number.");
		if (silveramount > 99) return this.sendReply("/takemoney - You can't take more than 99 Silver at a time.");
		if (silveramount.length < 1) return this.sendReply("/takemoney - [silveramount] may not be blank.");

		let copperamount = Math.round(Number(splitTarget[3]));
		if (isNaN(copperamount)) return this.sendReply("/takemoney - [amount] must be a number.");
		if (copperamount > 100) return this.sendReply("/takemoney - You can't take more than 100 Gold at a time.");
		if (copperamount.length < 1) return this.sendReply("/takemoney - [copperamount] may not be blank.");

		Economy.writeMoney(targetUser, -goldamount, -silveramount, -copperamount);
		this.sendReply("You removed " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper from " + Chat.escapeHTML(targetUser));
		Economy.logTransaction(user.name + " has taken " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper from " + targetUser);
	},

	transfer: 'transfermoney',
	transfermoney: function (target, room, user) {
		if (!target) return this.sendReply("Usage: /transfermoney [user], [goldamount], [silveramount], [copperamount].");
		let splitTarget = target.split(',');
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();
		if (!splitTarget[1]) return this.sendReply("Usage: /transfermoney [user], [goldamount], [silveramount], [copperamount].");

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/transferpoints - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/transferpoints - [user] can't be longer than 19 characters.");

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

		Economy.readMoney(userid, copper =>
		Economy.readMoney(userid, silver =>
		Economy.readMoney(userid, gold => {
			if (gold < goldamount) return this.sendReply("/transfermoney - You can't transfer more Gold than you have.");
			if (silver < silveramount) return this.sendReply("/transfermoney - You can't transfer more Silver than you have.");
			if (copper < copperamount) return this.sendReply("/transfermoney - You can't transfer more Copper than you have.");
			Economy.writeMoney(user.userid, -goldamount, -silveramount, -copperamount, () => {
				Economy.writeMoney(targetUser, goldamount, silveramount, copperamount, () => {
					this.sendReply("You've sent " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper to " + targetUser);
					Economy.logTransaction(user.name + " has transfered " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper to " + targetUser);
					if (Users.getExact(targetUser) && Users.getExact(targetUser)) Users.getExact(targetUser).popup(user.name + " has sent you " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper.");
				});
			});
		})));
	},

	moneylog: function (target, room, user) {
		//if (!this.can('money')) return false;
		if (!target) return this.sendReply("Usage: /moneylog [number] to view the last [number] lines OR /moneylog [text] to search for the last 50 lines containing [text].");
		let word = false;
		if (isNaN(Number(target))) word = true;
		let lines = fs.readFileSync('logs/point.log', 'utf8').split('\n').reverse();
		let output = '';
		let count = 0;
		let regex = new RegExp(target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "gi");

		if (word) {
			output += 'Displaying last 50 lines containing "' + target + '":\n';
			for (let line in lines) {
				if (count >= 50) break;
				if (!~lines[line].search(regex)) continue;
				output += lines[line] + '\n';
				count++;
			}
		} else {
			if (target > 100) target = 100;
			output = lines.slice(0, (lines.length > target ? target : lines.length));
			output.unshift("Displaying the last " + (lines.length > target ? target : lines.length) + " lines:");
			output = output.join('\n');
		}
		user.popup("|wide|" + output);
	},

	economy: function (target, room, user) {
		if (!this.runBroadcast()) return;

		Legacy.database.all("SELECT SUM(gold) FROM users;", "SELECT SUM(silver) FROM users;", "SELECT SUM(copper) FROM users;", (err, rows) => {

			let totalGold = rows[0]['SUM(gold)'];
			let totalSilver = rows[0]['SUM(silver)'];
			let totalCopper = rows[0]['SUM(copper)'];

			if (totalCopper > 99) totalCopper -= 100;
				totalSilver++;

			if (totalSilver > 99) totalSilver -= 100;
				totalGold++;

			Legacy.database.all("SELECT userid, SUM(gold) AS total FROM users GROUP BY gold, silver, copper HAVING TOTAL > 0;", (err, rows) => {
				let userCount = rows.length;
				Legacy.database.all("SELECT * FROM users ORDER BY gold, silver, copper DESC LIMIT 1;", (err, rows) => {
					let richestUser = rows[0].userid;
					let richestUserGold = rows[0].gold;
					let richestUserSilver = rows[0].silver;
					let richestUserCopper = rows[0].copper;
					if (Users.getExact(richestUser)) richestUser = Users.getExact(richestUser).name;
					Legacy.database.all("SELECT AVG(gold) FROM users WHERE gold > 0;", (err, rows) => {
						let averageGold = rows[0]['AVG(gold)'];

						this.sendReplyBox("The richest user is currently <b><font color=#24678d>" + Chat.escapeHTML(richestUser) + "</font></b> with <b><font color=#24678d>" +
							richestUserGold + "</font></b> Gold,</font></b>" + richestUserSilver + "</font></b> Silver, and</font></b>" + richestUserCopper + "</font></b> Copper.</font></b><br />There is a total of <b><font color=#24678d>" +
							userCount + "</font></b> users with at least one Gold.<br /> The average user has " +
							"<b><font color=#24678d>" + Math.round(averageGold) + "</font></b> Gold.<br /> There is a total of <b><font color=#24678d>" +
							totalGold + "</font></b> Gold in the economy."
						);
						room.update();
					});
				});
			});
		});
	},

	customsymbol: function (target, room, user) {
		let bannedSymbols = ['!', '|', '‽', '\u2030', '\u534D', '\u5350', '\u223C'];
		for (let u in Config.groups) if (Config.groups[u].symbol) bannedSymbols.push(Config.groups[u].symbol);
		let userid = user.userid;
		if (!user.canCustomSymbol) return this.sendReply('You need to redeem this item from the shop to use it.');
		if (!target || target.length > 1) return this.sendReply('/customsymbol [symbol] - changes your symbol (usergroup) to the specified symbol. The symbol can only be one character in length.');
		if (target.match(/([a-zA-Z ^0-9])/g) || bannedSymbols.indexOf(target) >= 0) {
			return this.sendReply('This symbol is banned.');
		user.customSymbol = target;
		user.updateIdentity();
		user.canCustomSymbol = false;
		this.sendReply('Your symbol is now ' + target + '. It will be saved until you log off for more than an hour, or the server restarts. You can remove it with /resetsymbol');
		}
	},

	removesymbol: 'resetsymbol',
	resetsymbol: function (target, room, user) {
		//if (!user.hasCustomSymbol) return this.sendReply("You don't have a custom symbol!");
		delete user.customSymbol;
		user.updateIdentity();
		this.sendReply('Your symbol has been removed.');
	},
};
