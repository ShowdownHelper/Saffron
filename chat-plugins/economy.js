/*
'use strict';

const fs = require('fs');
const path = require('path');
const moment = require('moment');

let serverIp = '144.217.82.98';

let accounts = {};
try {
	accounts = JSON.parse(fs.readFileSync('config/economy.json', 'utf8'));
} catch (e) {
	if (e.code !== 'ENOENT') throw e;
}

function save() {
	if (Object.keys(accounts).length < 1) return fs.writeFileSync('config/economy.json', JSON.stringify(accounts));
	let data = "{\n";
	for (let u in accounts) {
		data += '\t"' + u + '": ' + JSON.stringify(accounts[u]) + ",\n";
	}
	data = data.substr(0, data.length - 2); // remove the last comma
	data += "\n}";
	fs.writeFileSync('config/economy.json', data);
}

function getPlatinum(user) {
	user = toId(user);
	let userPlat = 0;
	for (let users in accounts) {
		if (accounts[users].includes(user)) {
			userPlat = accounts[users].plat;
			break;
		}
	}
	return userPlat;
}

function getGold(user) {
	user = toId(user);
	let userGold = 0;
	for (let users in accounts) {
		if (accounts[users].includes(user)) {
			userGold = accounts[users].gold;
			break;
		}
	}
	return userGold;
}

function getSilver(user) {
	user = toId(user);
	let userSilv = 0;
	for (let users in accounts) {
		if (accounts[users].includes(user)) {
			userSilv = accounts[users].silv;
      break;
    }
	}
	return userSilv;
}

function getCopper(user) {
	user = toId(user);
	let userCopp = 0;
	for (let users in accounts) {
		if (accounts[users].includes(user)) {
			userCopp = accounts[users].copp;
      break;
    }
	}
	return userCopp;
}

let Economy = global.Economy = {
	readMoney: function (user, callback) {
		user = toId(user);
		if (!callback) return false;
	let platinum = getPlatinum();
	callback(platinum);
	let gold = getGold();
	callback(gold);
	let silver = getSilver();
	callback(silver);
	let copper = getCopper();
	callback(copper);
  },
  writeMoney: function (user, copperamount, silveramount, goldamount, platinumamount, callback) {
    user = toId(user);
    let userPlat = getPlatinum(user);
    let userGold = getGold(user);
    let userSilv = getSilver(user);
    let userCopp = getCopper(user);
         
				let copper = copperamount + userCopp;
				let silver = silveramount + userSilv;
				let gold = goldamount + userGold;
				let platinum = platinumamount + userPlat;
    
				if (copper > 99) {
					copper -= 100;
					silver++;
				}
        
				if (copper < 0 && silver > 0) {
					copper += 100 + copper;
					silver--;
				}
					else if (copper < 0 && gold > 0) {
						copper += 100;
						silver += 99;
						gold--;
					}
						else if (copper < 0 && platinum > 0) {
							copper += 100;
							silver += 99;
							gold += 99;
							platinum--;
						}
							else {
								copper = 0;
							}

				if (silver > 99) {
					silver -= 100;
					gold++;
				}
        
				if (silver < 0 && gold > 0) {
					silver += 100;
					gold--;
				}
					else if (silver < 0 && platinum > 0) {
						silver += 100;
						gold += 99;
						platinum--;
					}
						else {
							silver = 0;
						}
        
        if (gold > 99) gold -= 100;
					platinum++;
        
				if (gold < 0 && platinum > 0) {
					gold += 100 + gold;
					platinum--;
				}
					else {
						gold = 0;
					}
        
				if (platinum < 0) {
					platinum = 0;
				}
    
   		 accounts[user] = {
    	  plat: platinum,
      	gold: gold,
      	silv: silver,
      	copp: copper,
  		};
    save();
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
			this.sendReplyBox(Chat.escapeHTML(target) + " has " + platinum + " Platinum, " + gold + " Gold, " + silver + " Silver, and " + copper + " Copper.");
			if (this.broadcasting) room.update();
			}))));
		},
	
	gm: 'givemoney',
	givemoney: function (target, room, user) {
		if (!user.can('rangeban')) return false;
		if (!target) return this.sendReply("Usage: /givemoney [user], [platinumamount], [goldamount], [silveramount], [copperamount].");
		let splitTarget = target.split(',');
		if (!splitTarget[4]) return this.sendReply("Usage: /givemoney [user], [platinumamount], [goldamount], [silveramount], [copperamount].");
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/givemoney - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/givemoney - [user] can't be longer than 19 characters.");

		let platinumamount = Math.round(Number(splitTarget[1]));
		if (isNaN(platinumamount)) return this.sendReply("/givemoney - [platinumamount] must be a number.");
		if (platinumamount > 99) return this.sendReply("/givemoney - You can't give more than 99 Gold at a time.");
		if (platinumamount.length < 1) return this.sendReply("/givemoney - [platinumamount] may not be blank.");

		let goldamount = Math.round(Number(splitTarget[2]));
		if (isNaN(goldamount)) return this.sendReply("/givemoney - [goldamount] must be a number.");
		if (goldamount > 99) return this.sendReply("/givemoney - You can't give more than 99 Gold at a time.");
		if (goldamount.length < 1) return this.sendReply("/givemoney - [goldamount] may not be blank.");

		let silveramount = Math.round(Number(splitTarget[3]));
		if (isNaN(silveramount)) return this.sendReply("/givemoney - [silveramount] must be a number.");
		if (silveramount > 99) return this.sendReply("/givemoney - You can't give more than 99 Silver at a time.");
		if (silveramount.length < 1) return this.sendReply("/givemoney - [silveramount] may not be blank.");

		let copperamount = Math.round(Number(splitTarget[4]));
		if (isNaN(copperamount)) return this.sendReply("/givemoney - [amount] must be a number.");
		if (copperamount > 99) return this.sendReply("/givemoney - You can't give more than 99 Copper at a time.");
		if (copperamount.length < 1) return this.sendReply("/givemoney - [copperamount] may not be blank.");
		if (goldamount + silveramount + copperamount < 1) return this.sendReply("/givemoney - You can't give less than one Copper, you stingy jerk.");

		Economy.writeMoney(targetUser, goldamount, silveramount, copperamount);
		this.sendReply(Chat.escapeHTML(targetUser) + " has received " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper.");
	},

	takemoney: function (target, room, user) {
		if (!user.can('rangeban')) return false;
		if (!target) return this.sendReply("Usage: /takemoney [user], [platinumamount], [goldamount], [silveramount], [copperamount].");
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
		if (goldamount > 99) return this.sendReply("/takemoney - Taking more than 99 Gold at a time? What are you, a Tory?");
		if (goldamount.length < 1) return this.sendReply("/takemoney - [goldamount] may not be blank.");

		let silveramount = Math.round(Number(splitTarget[3]));
		if (isNaN(silveramount)) return this.sendReply("/takemoney - [silveramount] must be a number.");
		if (silveramount > 99) return this.sendReply("/takemoney - You can't take more than 99 Silver at a time.");
		if (silveramount.length < 1) return this.sendReply("/takemoney - [silveramount] may not be blank.");

		let copperamount = Math.round(Number(splitTarget[4]));
		if (isNaN(copperamount)) return this.sendReply("/takemoney - [amount] must be a number.");
		if (copperamount > 99) return this.sendReply("/takemoney - You can't take more than 99 Copper at a time.");
		if (copperamount.length < 1) return this.sendReply("/takemoney - [copperamount] may not be blank.");

		Economy.writeMoney(targetUser, -platinumamount, -goldamount, -silveramount, -copperamount);
		this.sendReply("You removed " + platinumamount + " Platinum, " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper from " + Chat.escapeHTML(targetUser));
	},

	transfer: 'transfermoney',
	transfermoney: function (target, room, user) {
		if (!target) return this.sendReply("Usage: /transfermoney [user], [platinumamount], [goldamount], [silveramount], [copperamount].");
		let splitTarget = target.split(',');
		for (let u in splitTarget) splitTarget[u] = splitTarget[u].trim();
		if (!splitTarget[4]) return this.sendReply("Usage: /transfermoney [user], [platinumamount], [goldamount], [silveramount], [copperamount].");

		let targetUser = splitTarget[0];
		if (toId(targetUser).length < 1) return this.sendReply("/transfermoney - [user] may not be blank.");
		if (toId(targetUser).length > 19) return this.sendReply("/transfermoney - [user] can't be longer than 19 characters.");

		let platinumamount = Math.round(Number(splitTarget[1]));
		if (isNaN(platinumamount)) return this.sendReply("/givemoney - [platinumamount] must be a number.");
		if (platinumamount > 100) return this.sendReply("/givemoney - You can't give more than 100 Platinum at a time.");
		if (platinumamount.length < 1) return this.sendReply("/givemoney - [goldamount] may not be blank.");
    
		let goldamount = Math.round(Number(splitTarget[2]));
		if (isNaN(goldamount)) return this.sendReply("/givemoney - [goldamount] must be a number.");
		if (goldamount > 99) return this.sendReply("/givemoney - You can't give more than 99 Gold at a time.");
		if (goldamount.length < 1) return this.sendReply("/givemoney - [goldamount] may not be blank.");

		let silveramount = Math.round(Number(splitTarget[3]));
		if (isNaN(silveramount)) return this.sendReply("/givemoney - [silveramount] must be a number.");
		if (silveramount > 99) return this.sendReply("/givemoney - You can't give more than 99 Silver at a time.");
		if (silveramount.length < 1) return this.sendReply("/givemoney - [silveramount] may not be blank.");

		let copperamount = Math.round(Number(splitTarget[4]));
		if (isNaN(copperamount)) return this.sendReply("/givemoney - [copperamount] must be a number.");
		if (copperamount > 99) return this.sendReply("/givemoney - You can't give more than 99 Copper at a time.");
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
					this.sendReply("You've sent " + platinumamount + " Platinum, " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper to " + targetUser);
					if (Users.getExact(targetUser) && Users.getExact(targetUser)) Users.getExact(targetUser).popup(user.name + " has sent you " + platinumamount + " Platinum, " + goldamount + " Gold, " + silveramount + " Silver, and " + copperamount + " Copper.");
				});
			});
		}))));
	}
};

*/
