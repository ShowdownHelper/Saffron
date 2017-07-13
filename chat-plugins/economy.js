'use strict';

const fs = require('fs');
const moment = require('moment');
const sqlite3 = require('sqlite3');

let serverIp = '144.217.82.98';

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
			Economy.writeMoney(user.userid, -goldamount, -silveramount, -copperamount, () => {
				Economy.writeMoney(targetUser, goldamount, silveramount, copperamount, () => {
					this.sendReply("You've sent " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper to " + targetUser);
					Economy.logTransaction(user.name + " has transfered " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper to " + targetUser);
					if (Users.getExact(targetUser) && Users.getExact(targetUser)) Users.getExact(targetUser).popup(user.name + " has sent you " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper.");
				});
			});
		}))));
	}
};
