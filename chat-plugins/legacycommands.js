'use strict';
const MD5 = require('MD5');
const http = require('http');
const fs = require('fs');
const moment = require('moment');
const nani = require('nani').init("niisama1-uvake", "llbgsBx3inTdyGizCPMgExBVmQ5fU");
const defineWord = require('define-word');
let colorCache = {};
let mainColors = {};
Prime.customColors = {};
Prime.staffSymbol = {};
let regdateCache = {};
Users.vips = [];

const polltiers = ['Random Battle', 'Anything Goes', 'Ubers', 'OverUsed', 'Underused',
	'RarelyUsed', 'NeverUsed', 'PU', 'LC', 'Random Doubles Battle', 'VGC 2016',
	'Battle Spot Doubles', 'Random Triples Battle', 'Challenge Cup 1v1', 'Balanced Hackmons',
	'1v1, Monotype', 'Inverse Battle', 'Almost Any Ability', 'STABmons', 'Hackmons Cup',
	'[Seasonal]', 'Battle Factory', 'Doubles OU', 'CAP', 'Gen 5 OU'];

const bubbleLetterMap = new Map([
	['a', '\u24D0'], ['b', '\u24D1'], ['c', '\u24D2'], ['d', '\u24D3'], ['e', '\u24D4'], ['f', '\u24D5'], ['g', '\u24D6'], ['h', '\u24D7'], ['i', '\u24D8'], ['j', '\u24D9'], ['k', '\u24DA'], ['l', '\u24DB'], ['m', '\u24DC'],
	['n', '\u24DD'], ['o', '\u24DE'], ['p', '\u24DF'], ['q', '\u24E0'], ['r', '\u24E1'], ['s', '\u24E2'], ['t', '\u24E3'], ['u', '\u24E4'], ['v', '\u24E5'], ['w', '\u24E6'], ['x', '\u24E7'], ['y', '\u24E8'], ['z', '\u24E9'],
	['A', '\u24B6'], ['B', '\u24B7'], ['C', '\u24B8'], ['D', '\u24B9'], ['E', '\u24BA'], ['F', '\u24BB'], ['G', '\u24BC'], ['H', '\u24BD'], ['I', '\u24BE'], ['J', '\u24BF'], ['K', '\u24C0'], ['L', '\u24C1'], ['M', '\u24C2'],
	['N', '\u24C3'], ['O', '\u24C4'], ['P', '\u24C5'], ['Q', '\u24C6'], ['R', '\u24C7'], ['S', '\u24C8'], ['T', '\u24C9'], ['U', '\u24CA'], ['V', '\u24CB'], ['W', '\u24CC'], ['X', '\u24CD'], ['Y', '\u24CE'], ['Z', '\u24CF'],
	['1', '\u2460'], ['2', '\u2461'], ['3', '\u2462'], ['4', '\u2463'], ['5', '\u2464'], ['6', '\u2465'], ['7', '\u2466'], ['8', '\u2467'], ['9', '\u2468'], ['0', '\u24EA'],
]);

const asciiMap = new Map([
	['\u24D0', 'a'], ['\u24D1', 'b'], ['\u24D2', 'c'], ['\u24D3', 'd'], ['\u24D4', 'e'], ['\u24D5', 'f'], ['\u24D6', 'g'], ['\u24D7', 'h'], ['\u24D8', 'i'], ['\u24D9', 'j'], ['\u24DA', 'k'], ['\u24DB', 'l'], ['\u24DC', 'm'],
	['\u24DD', 'n'], ['\u24DE', 'o'], ['\u24DF', 'p'], ['\u24E0', 'q'], ['\u24E1', 'r'], ['\u24E2', 's'], ['\u24E3', 't'], ['\u24E4', 'u'], ['\u24E5', 'v'], ['\u24E6', 'w'], ['\u24E7', 'x'], ['\u24E8', 'y'], ['\u24E9', 'z'],
	['\u24B6', 'A'], ['\u24B7', 'B'], ['\u24B8', 'C'], ['\u24B9', 'D'], ['\u24BA', 'E'], ['\u24BB', 'F'], ['\u24BC', 'G'], ['\u24BD', 'H'], ['\u24BE', 'I'], ['\u24BF', 'J'], ['\u24C0', 'K'], ['\u24C1', 'L'], ['\u24C2', 'M'],
	['\u24C3', 'N'], ['\u24C4', 'O'], ['\u24C5', 'P'], ['\u24C6', 'Q'], ['\u24C7', 'R'], ['\u24C8', 'S'], ['\u24C9', 'T'], ['\u24CA', 'U'], ['\u24CB', 'V'], ['\u24CC', 'W'], ['\u24CD', 'X'], ['\u24CE', 'Y'], ['\u24CF', 'Z'],
	['\u2460', '1'], ['\u2461', '2'], ['\u2462', '3'], ['\u2463', '4'], ['\u2464', '5'], ['\u2465', '6'], ['\u2466', '7'], ['\u2467', '8'], ['\u2468', '9'], ['\u24EA', '0'],
]);

function parseStatus(text, encoding) {
	if (encoding) {
		text = text.split('').map(function (char) {
			return bubbleLetterMap.get(char);
		}).join('');
	} else {
		text = text.split('').map(function (char) {
			return asciiMap.get(char);
		}).join('');
	}
	return text;
}
	
/***********
* Commands *
***********/

exports.commands = {
	lastseen: 'seen',
	seen: function (target, room, user) {
		if (!target) return this.errorReply("Usage: /seen [username] - Show's the last time the user was online.");
		switch (target) {
		case '!names':
		case '!name':
			if (!this.runBroadcast()) return;
			Prime.database.all("SELECT * FROM users WHERE lastSeen NOT NULL", (err, rows) => {
				this.sendReplyBox("There have been " + rows.length + " user names recorded in this database.");
				room.update();
			});
			break;
		default:
			if (!this.runBroadcast()) return;
			let userid = toId(target);
			if (userid.length > 18) return this.errorReply("Usernames cannot be over 18 characters.");
			if (userid.length < 1) return this.errorReply("/seen - Please specify a name.");
			let userName = '<strong class="username">' + Prime.nameColor(target, false) + '</strong>';
			if (userid === user.userid) return this.sendReplyBox(userName + ", have you looked in a mirror lately?");
			if (Users(target) && Users(target).connected) return this.sendReplyBox(userName + ' is currently <font color="green">online</font>.');
			Prime.lastSeen(userid, seen => {
				if (!seen) return this.sendReplyBox(userName + ' has <font color=\"red\">never</font> been seen online on this server.');
				this.sendReplyBox(userName + ' was last seen online on ' + moment(seen).format("MMMM Do YYYY, h:mm:ss A") + ' EST. (' + moment(seen).fromNow() + ')');
				room.update();
			});
			break;
		}
	},

	regdate: function (target, room, user, connection) {
		if (toId(target).length < 1 || toId(target).length > 19) return this.sendReply("Usernames may not be less than one character or longer than 19");
		if (!this.runBroadcast()) return;
		Prime.regdate(target, date => {
			this.sendReplyBox(Prime.nameColor(target, false) + (date ? " was registered on " + moment(date).format("dddd, MMMM DD, YYYY HH:mmA ZZ") : " is not registered."));
			room.update();
		});
	},

	def: 'define',
	define: function (target, room, user) {
		if (!target) return this.sendReply('Usage: /define <word>');
		target = toId(target);
		if (target > 50) return this.sendReply('/define <word> - word can not be longer than 50 characters.');
		if (!this.runBroadcast()) return;

		let options = {
			host: 'api.wordnik.com',
			port: 80,
			path: '/v4/word.json/' + target + '/definitions?limit=3&sourceDictionaries=all' +
			'&useCanonical=false&includeTags=false&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5',
			method: 'GET',
		};

		http.get(options, res => {
			let data = '';
			res.on('data', chunk => {
				data += chunk;
			}).on('end', () => {
				data = JSON.parse(data);
				let output = '<font color=#24678d><b>Definitions for ' + target + ':</b></font><br />';
				if (!data[0]) {
					this.sendReplyBox('No results for <b>"' + target + '"</b>.');
					return room.update();
				} else {
					let count = 1;
					for (let u in data) {
						if (count > 3) break;
						output += '(<b>' + count + '</b>) ' + Chat.escapeHTML(data[u]['text']) + '<br />';
						count++;
					}
					this.sendReplyBox(output);
					return room.update;
				}
			});
		});
	},

	u: 'urbandefine',
	ud: 'urbandefine',
	urbandefine: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse('/help urbandefine');
		if (target.toString() > 50) return this.sendReply('Phrase can not be longer than 50 characters.');
		let self = this;
		let options = {
			host: 'api.urbandictionary.com',
			port: 80,
			path: '/v0/define?term=' + encodeURIComponent(target),
			term: target,
		};

		http.get(options, res => {
			let data = '';
			res.on('data', chunk => {
				data += chunk;
			}).on('end', () => {
				data = JSON.parse(data);
				let definitions = data['list'];
				if (data['result_type'] === 'no_results') {
					this.sendReplyBox('No results for <b>"' + Chat.escapeHTML(target) + '"</b>.');
					return room.update();
				} else {
					if (!definitions[0]['word'] || !definitions[0]['definition']) {
						self.sendReplyBox('No results for <b>"' + Chat.escapeHTML(target) + '"</b>.');
						return room.update();
					}
					let output = '<b>' + Chat.escapeHTML(definitions[0]['word']) + ':</b> ' + Chat.escapeHTML(definitions[0]['definition']).replace(/\r\n/g, '<br />').replace(/\n/g, ' ');
					if (output.length > 400) output = output.slice(0, 400) + '...';
					this.sendReplyBox(output);
					return room.update();
				}
			});
		});
	},

	masspm: 'pmall',
	pmall: function (target, room, user) {
		if (!this.can('pmall')) return false;
		if (!target) return this.parse('/help pmall');

		let pmName = ' Server PM [Do not reply]';

		Users.users.forEach(function (user) {
			let message = '|pm|' + pmName + '|' + user.getIdentity() + '|' + target;
			user.send(message);
		});
	},
	pmallhelp: ["/pmall [message] - PM all users in the server."],

	staffpm: 'pmallstaff',
	pmstaff: 'pmallstaff',
	pmallstaff: function (target, room, user) {
		if (!this.can('forcewin')) return false;
		if (!target) return this.parse('/help pmallstaff');

		let pmName = ' Staff PM [Do not reply]';

		Users.users.forEach(function (user) {
			if (!user.isStaff) return;
			let message = '|pm|' + pmName + '|' + user.getIdentity() + '|' + target;
			user.send(message);
		});
	},
	pmallstaffhelp: ["/pmallstaff [message] - Sends a PM to every staff member online."],

	pmroom: 'rmall',
	roompm: 'rmall',
	rmall: function (target, room, user) {
		if (!this.can('declare', null, room)) return this.errorReply("/rmall - Access denied.");
		if (room.id === 'lobby') return this.errorReply("This command cannot be used in Lobby.");
		if (!target) return this.sendReply("/rmall [message] - Sends a pm to all users in the room.");
		target = target.replace(/<(?:.|\n)*?>/gm, '');

		let pmName = '~Room PM (' + Chat.escapeHTML(room.title) + ') [Do not reply]';

		for (let i in room.users) {
			let message = '|pm|' + pmName + '|' + room.users[i].getIdentity() + '| ' + target;
			room.users[i].send(message);
		}
		this.privateModCommand('(' + Chat.escapeHTML(user.name) + ' mass PMd: ' + target + ')');
	},
	rmallhelp: ["/rmall [message] - Sends a PM to every user in a room."],

	afk: 'away',
	busy: 'away',
	work: 'away',
	eating: 'away',
	working: 'away',
	sleep: 'away',
	sleeping: 'away',
	gaming: 'away',
	nerd: 'away',
	nerding: 'away',
	mimis: 'away',
	away: function (target, room, user, connection, cmd) {
		if (!user.isAway && user.name.length > 19) return this.sendReply("Your username is too long for any kind of use of this command.");

		target = target ? target.replace(/[^a-zA-Z0-9]/g, '') : 'AWAY';
		if (cmd !== 'away') target = cmd;
		let newName = user.name;
		let status = parseStatus(target, true);
		let statusLen = status.length;
		if (statusLen > 14) return this.sendReply("Your away status should be short and to-the-point, not a dissertation on why you are away.");

		if (user.isAway) {
			let statusIdx = newName.search(/\s\-\s[\u24B6-\u24E9\u2460-\u2468\u24EA]+$/);
			if (statusIdx > -1) newName = newName.substr(0, statusIdx);
			if (user.name.substr(-statusLen) === status) return this.sendReply("Your away status is already set to \"" + target + "\".");
		}

		newName += ' - ' + status;
		if (newName.length > 18) return this.sendReply("\"" + target + "\" is too long to use as your away status.");

		// forcerename any possible impersonators
		let targetUser = Users.getExact(user.userid + target);
		if (targetUser && targetUser !== user && targetUser.name === user.name + ' - ' + target) {
			targetUser.resetName();
			targetUser.send("|nametaken||Your name conflicts with " + user.name + (user.name.substr(-1) === "s" ? "'" : "'s") + " new away status.");
		}

		if (user.can('lock', null, room)) {
			this.add("|raw|-- " + Prime.nameColor(user.userid, true) + " is now " + target.toLowerCase() + ".");
			this.parse('/hide');
		}
		user.forceRename(newName, user.registered);
		user.updateIdentity();
		user.isAway = true;
	},
	awayhelp: ["/away [message] - Sets a users away status."],

	back: function (target, room, user) {
		if (!user.isAway) return this.sendReply("You are not set as away.");
		user.isAway = false;

		let newName = user.name;
		let statusIdx = newName.search(/\s\-\s[\u24B6-\u24E9\u2460-\u2468\u24EA]+$/);
		if (statusIdx < 0) {
			user.isAway = false;
			if (user.can('lock', null, room)) this.add("|raw|-- " + Prime.nameColor(user.userid, true) + " is no longer away.");
			return false;
		}

		let status = parseStatus(newName.substr(statusIdx + 3), false);
		newName = newName.substr(0, statusIdx);
		user.forceRename(newName, user.registered);
		user.updateIdentity();
		user.isAway = false;
		if (user.can('lock', null, room)) {
			this.add("|raw|-- " + Prime.nameColor(user.userid, true) + " is no longer " + status.toLowerCase() + ".");
			this.parse('/show');
		}
	},
	backhelp: ["/back - Sets a users away status back to normal."],

	showauth: 'hideauth',
	show: 'hideauth',
	hide: 'hideauth',
	hideauth: function (target, room, user, connection, cmd) {
		if (!user.can('lock')) return this.sendReply("/hideauth - access denied.");
		if (cmd === 'show' || cmd === 'showauth') {
			delete user.hideauth;
			user.updateIdentity();
			return this.sendReply("You have revealed your auth symbol.");
		}
		let tar = ' ';
		if (target) {
			target = target.trim();
			if (Config.groupsranking.indexOf(target) > -1 && target !== '#') {
				if (Config.groupsranking.indexOf(target) <= Config.groupsranking.indexOf(user.group)) {
					tar = target;
				} else {
					this.sendReply('The group symbol you have tried to use is of a higher authority than you have access to. Defaulting to \' \' instead.');
				}
			} else {
				this.sendReply('You have tried to use an invalid character as your auth symbol. Defaulting to \' \' instead.');
			}
		}
		user.hideauth = tar;
		user.updateIdentity();
		this.sendReply('You are now hiding your auth symbol as \'' + tar + '\'.');
		this.logModCommand(user.name + ' is hiding auth symbol as \'' + tar + '\'');
	},

	rpoll: 'roompoll',
	roompoll: function (target, room, user) {
		if (!target) {
			if (!this.can('broadcast', null, room) || room.battle) return false;
			if (!room.RPoll) return this.parse('/help roompoll');
			return this.parse('/poll create ' + room.RPoll);
		}
		let parts = target.split(" ");
		let action = toId(parts[0] || " ");
		let details = parts.slice(1).join(" ");
		if (action === "help") return this.parse('/help roompoll');
		if (action === "change" || action === "set") {
			if (!this.can('declare', null, room) || room.battle) return false;
			if (!toId(details || " ")) return this.parse('/help roompoll');
			if (details.split(",").length < 3) return this.errorReply("You did not include enough arguments for the poll.");
			room.RPoll = details.replace(/^\/poll/i, "");
			if (room.chatRoomData) {
				room.chatRoomData.RPoll = room.RPoll;
				Rooms.global.writeChatRoomData();
			}
			return this.sendReply("The roompoll has been set.");
		}
		if (action === 'view') {
			if (!this.can('declare', null, room)) return false;
			if (!room.RPoll) return this.errorReply("No roompoll has been set yet.");
			return this.sendReply("The roompoll is: /poll create " + room.RPoll);
		}
		if (action === 'end') {
			if (!this.can('broadcast', null, room) || room.battle) return false;
			return this.parse('/poll end');
		} else {
			return this.errorReply("This is not a valid roompoll command, do '/roompoll help' for more information");
		}
	},
	roompollhelp: ["- /roompoll - creates a new roompoll. (Start poll with '/roompoll', display poll with '!pr', end poll with '/endpoll'). Requires: + $ % @ # & ~",
		"- /roompoll set/change [details] - sets the roompoll. Requires: # & ~",
		"- /roompoll view - displays the command for the current roompoll. Requires: # & ~"],

	formatpoll: 'tierpoll',
	tpoll: 'tierpoll',
	tierspoll: 'tierpoll',
	tierpoll: function (target, room, user) {
		if (room.battle) return false;
		if (!this.can('broadcast', null, room)) return false;
		if (room.game && room.id === 'lobby') return this.errorReply("Polls cannot be created in Lobby when there is a room game in progress.");
		this.parse('/poll create Tier for the next tournament?, ' + polltiers.join(', '));
	},

	clearroom:  function (target, room, user) {
		if (!this.can('clearroom', null, room)) return false;
		if (room.battle) return this.sendReply("You cannot clearall in battle rooms.");
		let len = room.log.length;
		let users = [];
		while (len--) {
			room.log[len] = '';
		}
		for (let u in room.users) {
			users.push(u);
			Users.get(u).leaveRoom(room, Users.get(u).connections[0]);
		}
		len = users.length;
		setTimeout(function () {
			while (len--) {
				Users.get(users[len]).joinRoom(room, Users.get(users[len]).connections[0]);
			}
		}, 1000);
	},

	roomkick: 'kick',
	kick: function (target, room, user) {
		if (!target) return this.parse('/help kick');
		if (!this.canTalk()) return false;
		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.errorReply('User "' + this.targetUsername + '" not found.');
		}
		if (!this.can('mute', targetUser, room)) return false;
		if (!(targetUser in room.users)) return this.errorReply("User '" + targetUser + "' is not in this room.");
		this.addModCommand(targetUser.name + ' was kicked from the room by ' + user.name + '.');
		targetUser.popup('You were kicked from ' + room.id + ' by ' + user.name + '.');
		targetUser.leaveRoom(room.id);
	},
	kickhelp: ['/kick [user] - Kicks a user from the room.'],
	roomkickhelp: ['/kick [user] - Kicks a user from the room.'],
        

	togglegdeclares: function (target, room, user) {
		if (!this.can('declare', null, room)) return false;
		if (room.isOfficial && this.can('gdeclare')) return this.errorReply("Only global leaders may toggle global declares in official rooms.");
		if (!room.chatRoomData) return this.errorReply("You can't toggle global declares in this room.");
		let status = !room.disableGlobalDeclares;
		room.disableGlobalDeclares = status;
		room.chatRoomData.disableGlobalDeclares = status;
		Rooms.global.writeChatRoomData();
		this.privateModCommand("(" + user.name + " has " + (status ? "disabled" : "enabled") + " global declares in this room.)");
	},

	etour: function (target, room, user) {
		if (!target) return this.parse("/help etour");
		this.parse("/tour create " + target + ", elimination");
	},
	etourhelp: ["/etour [format] - Creates an elimination tournament."],

	endpoll: function (target, room, user) {
		this.parse("/poll end");
	},

	votes: function (target, room, user) {
		if (!room.poll) return this.errorReply("There is no poll running in this room.");
		if (!this.runBroadcast()) return;
		this.sendReplyBox("votes: " + room.poll.totalVotes);
	},

	endtour: function (target, room, user) {
		this.parse("/tour end");
	},

	title: function (target, room, user, connection) {
		let userid = user.userid;
		let self = this;
		glevel.readXp(user.userid, xp => {
			let levelPass = (xp >= 13290) ? true : false;
			let canTargetOthers = (user.hasConsoleAccess(connection)) ? true : false;
			if (!canTargetOthers && !levelPass) return false;
			if (!target) return self.parse("/help title");
			let targets = target.split(',');
			for (let u in targets) targets[u] = targets[u].trim();
			if (!targets[0]) return self.parse("/help title");
			if (!canTargetOthers && toId(target[0]) != user.userid) return self.sendReply("You do not have permission to change other user's Titles.");
			let cmd = targets[0];
			let targetUser, title, hex;
			if (targets[1]) targetUser = targets[1];
			if (targets[2]) title = targets[2];
			if (targets[3]) hex = targets[3];

			switch (toId(cmd)) {
			case "set":
				if (!targets[2]) return self.parse("/help title");
				if (!Users(targetUser)) return self.errorReply('"' + targetUser + '" is not online.');
				if (title.length < 1) return self.errorReply("Title must be at least one character long.");
				if (title.length > 25) return self.errorReply("Titles may not be longer than 25 characters.");
				if (hex && hex.length > 7) return self.errorReply("The hex may not be longer than 7 characters (including #).");
				title = '<font color="#' + ((hex && hex.length > 1) ? toId(hex) : 'b30000') + '"><b>' + Chat.escapeHTML(title) + '</b></font>';
				Prime.setTitle(targetUser, title);
				if (Users(targetUser).connected) Users(targetUser).popup("|html|" + Prime.nameColor(user.name) + " has set your user title to \"" + title + "\".");
				self.sendReply("|raw|You've set " + Prime.nameColor(targetUser) + "'s title to \"" + title + "\".");
				Rooms('upperstaff').add("|raw|" + Prime.nameColor(user.name, true) + " has set " + Prime.nameColor(targetUser, true) + "'s user title to " + title + ".").update();
				Prime.messageSeniorStaff("/html " + Prime.nameColor(user.name, true) + " has set " + Prime.nameColor(targetUser, true) + "'s user title to " + title + ".");
				break;
			case "delete":
				if (!targets[1]) return self.parse("/help title");
				Prime.getTitle(targetUser, title => {
					if (title === "") return self.sendReply(targetUser + " does not have a title.");
					Prime.setTitle(targetUser, "", () => {
						if (Users(targetUser) && Users(targetUser).connected) Users(targetUser).popup("|html|" + Prime.nameColor(user.name) + " has removed your user title.");
						self.sendReply("You have removed " + targetUser + "'s user title.");
						Rooms('upperstaff').add("|raw|" + Prime.nameColor(user.name, true) + " has removed " + Prime.nameColor(targetUser, true) + "'s user title.").update();
						Prime.messageSeniorStaff("/html " + Prime.nameColor(user.name, true) + " has removed " + Prime.nameColor(targetUser, true) + "'s user title.");
					});
				});
				break;
			case "view":
				if (!targets[1]) return self.parse("/help title");
				if (!self.runBroadcast()) return;
				Prime.getTitle(targetUser, title => {
					if (title === "") {
						self.sendReplyBox(Prime.nameColor(targetUser, true) + " does not have a title.");
					} else {
						self.sendReplyBox(Prime.nameColor(targetUser, true) + "'s user title is \"" + title + "\".");
					}
					room.update();
				});
				break;
			case "clearall":
				if (!target) return self.parse("/help title");
				Prime.database.run("UPDATE users SET title=NULL", function (err) {
						if (err) return console.log(err);
						if (callback) return callback();
				});
				break;
			}
		});
	},
	titlehelp: ["/title set, user, title - Sets a title.",
				"/title delete, user - Deletes a users title.",
				"/title view, user - Shows a users title [broadcastable]",
				"/title clearall - Clears all user titles. (Requires ~)",
			],
			
	dev: {
		addtable: function(target, room, user, connection) {
			if (!user.hasConsoleAccess(connection)) return this.errorReply("/dev - Access Denied");
			if (!target) return this.errorReply("usage: /dev addtable [name]| column1, TYPE| column2, TYPE| etc.");
			let options = target.split('|');
			if (options.length < 2) return this.errorReply("usage: /dev addtable [name]| column1, TYPE| column2, TYPE| etc.");
			let columnArr = [];
			let err = false;
			for (let i = 1; i < options.length; i++) {
				let thisCol = options[i].split(',');
				if (thisCol.length !== 2) err = true;
				let acceptedTypes = ['TEXT', 'INTEGER'];
				thisCol[0] = thisCol[0].trim();
				thisCol[1] = thisCol[1].trim();
				if (acceptedTypes.indexOf(thisCol[1]) === -1) err = true;
				let addCol = {
					name: thisCol[0],
					type: thisCol[1]
				};
				columnArr.push(addCol);
			}
			if (err) return this.errorReply("error");
			let SQL = 'CREATE TABLE if not exists "'+options[0]+'"(';
			for (let x in columnArr) {
				SQL += '"'+columnArr[x].name+'" '+columnArr[x].type+', ';
			}
			SQL += ')';	
			Prime.database.run(SQL);
			Rooms('staff').add(user.name + " used /dev database (addtable)");
			Rooms('staff').update();
		},
		addcolumn: function(target, room, user, connection) {
			if (!user.hasConsoleAccess(connection)) return this.errorReply("/dev - Access Denied");
			if (!target) return this.errorReply("usage: /dev addcolumn [table], [name], [data type]");
			let options = target.split(',');
			if (options.length !== 3) return this.errorReply("usage: /dev addcolumn [table], [name], [data type]");
			options[0] = options[0].trim();
			options[1] = options[1].trim();
			options[2] = options[2].trim();
			let self = this;
			Prime.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name='"+options[0]+"'", function (err, check) {
				if (check.length !== 1) return self.errorReply("There is no table named " + options[0] + " in the user database.");
				let acceptedTypes = ['TEXT', 'INTEGER'];
				if (acceptedTypes.indexOf(options[2]) !== -1) {
					Prime.database.run('ALTER TABLE "'+options[0]+'" ADD "'+options[1]+'" '+options[2]+'', function (err) {
						if (err) {
							self.errorReply("ERROR");
						} else {
							Rooms('staff').add(user.name + " used /dev database (addcolumn)");
							Rooms('staff').update();
						}
					});
				}
			});
		},
		deletetable: function(target, room, user, connection) {
			if (!user.hasConsoleAccess(connection)) return this.errorReply("/dev - Access Denied");
			if (!target) return this.errorReply("usage: /dev deletetable [table]");
			let options = target.trim();
			let self = this;
			Prime.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name='"+options+"'", function (err, check) {
				if (check.length !== 1) {
					return self.errorReply("There is no table named " + options + " in the user database.");
				} else {
					Prime.database.run('DROP TABLE "'+options+'"');
					Rooms('staff').add(user.name + " used /dev (deletetable)");
					Rooms('staff').update();
				}
			});
		},
		deletecolumn: function(target, room, user, connection) {
			if (!user.hasConsoleAccess(connection)) return this.errorReply("/dev - Access Denied");
			if (!target) return this.errorReply("usage: /dev deletecolumn [table], [column]");
			let self = this;
			let options = target.split(',');
			if (options.length !== 2) return this.errorReply("usage: /dev deletecolumn [table], [column]");
			options[0] = options[0].trim();
			options[1] = options[1].trim();
			Prime.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name='"+options[0]+"'", function (err, check) {
				if (check.length !== 1) return self.errorReply("There is no table named " + options[0] + " in the user database.");
				Prime.database.all("SELECT "+options[1]+" FROM "+options[0]+"", function (err, col) {
					if (err) {
						self.errorReply("ERROR");
					} else {
						Prime.database.run('ALTER TABLE "'+options[0]+'" DROP COLUMN "'+options[1]+'"', function (err) {
							if (err) {
								self.errorReply("ERROR");
							} else {
								Rooms('staff').add(user.name + " used /dev database (deletecolumn)");
								Rooms('staff').update();
							}
						});
					}
				});
			});
		},
	},

};