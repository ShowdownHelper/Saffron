'use strict';

let serverid = 'prime';
const fs = require('fs');
const http = require('http');

function load() {
	fs.readFile('config/icons.json', 'utf8', function (err, file) {
		if (err) return;
		Prime.icons = JSON.parse(file);
	});
}
load();

function updateIcons() {
	fs.writeFileSync('config/icons.json', JSON.stringify(Prime.icons));

	let newCss = '/* ICONS START */\n';

	for (let name in Prime.icons) {
		newCss += generateCSS(name, Prime.icons[name]);
	}
	newCss += '/* ICONS END */\n';

	let file = fs.readFileSync('config/custom.css', 'utf8').split('\n');
	if (~file.indexOf('/* ICONS START */')) file.splice(file.indexOf('/* ICONS START */'), (file.indexOf('/* ICONS END */') - file.indexOf('/* ICONS START */')) + 1);
	fs.writeFileSync('config/custom.css', file.join('\n') + newCss);
	Prime.reloadCSS();
}

function generateCSS(name, icon) {
	let css = '';
	let rooms = [];
	name = toId(name);
	Rooms.rooms.forEach((curRoom, id) => {
		if (curRoom.id === 'global' || curRoom.type !== 'chat' || curRoom.isPersonal) return;
		if (!isNaN(Number(id.charAt(0)))) return;
		rooms.push('#' + id + '-userlist-user-' + name);
	});
	css = rooms.join(', ');
	css += '{\nbackground: url("' + icon + '") no-repeat right\n}\n';
	return css;
}

exports.commands = {
	customicon: 'icon',
	icon: function (target, room, user) {
		let userid = user.userid;
		let self = this;
		glevel.readXp(userid, xp => {
			let levelPass = (xp >= 13290) ? true : false
			let canTargetOthers = (user.can('rangeban')) ? true : false;
			if (!canTargetOthers && !levelPass) return false;
			target = target.split(',');
			for (let u in target) target[u] = target[u].trim();
			if (!canTargetOthers && toId(target[0]) != userid) return false;
			if (!target[1]) return self.parse('/help icon');
			if (toId(target[0]).length > 19) return self.errorReply("Usernames are not this long...");
			if (target[1] === 'delete') {
				if (!Prime.icons[toId(target[0])]) return self.errorReply('/icon - ' + target[0] + ' does not have an icon.');
				delete Prime.icons[toId(target[0])];
				Alts.setAccountType(toId(target[0]), alts => {
					if (alts[0] === 'Main' && alts[1]) {
						for (let i in alts[1]) delete Prime.icons[alts[1][i]];
					} else if (alts[0] === 'Alt') {
						Alts.setAccountType(alts[1][0], mainAlts => {
							if (mainAlts[1].length >= 2) {
								for (let i in mainAlts[1]) {
									if (mainAlts[1][i] !== target[0]) delete Prime.icons[mainAlts[1][i]];
								}
							}
						});
					}
				});
				updateIcons();
				self.sendReply("You removed " + target[0] + "'s icon.");
				Rooms('upperstaff').add(user.name + " removed " + target[0] + "'s icon.").update();
				if (Users(target[0]) && Users(target[0]).connected) Users(target[0]).popup(user.name + " removed your icon.");
				return;
			}

			self.sendReply("|raw|You have given <b><font color=" + Prime.hashColor(Chat.escapeHTML(target[0])) + ">" + Chat.escapeHTML(target[0]) + "</font></b> an icon.");
			Rooms('upperstaff').add('|raw|<b><font color="' + Prime.hashColor(Chat.escapeHTML(target[0])) + '">' + Chat.escapeHTML(target[0]) + '</font> has received an icon from ' + Chat.escapeHTML(user.name) + '.</b>').update();
			Prime.icons[toId(target[0])] = target[1];
			Alts.setAccountType(toId(target[0]), alts => {
				if (alts[0] === 'Main' && alts[1]) {
					for (let i in alts[1]) delete Prime.icons[alts[1][i]];
				} else if (alts[0] === 'Alt') {
					Alts.setAccountType(alts[1][0], mainAlts => {
						if (mainAlts[1].length >= 2) {
							for (let i in mainAlts[1]) {
								if (mainAlts[1][i] !== target[0]) delete Prime.icons[mainAlts[1][i]];
							}
						}
					});
				}
			});
			updateIcons();
		});
	},
	iconhelp: [
		"Commands Include:",
		"/icon [user], [image url] - Gives [user] an icon of [image url]",
		"/icon [user], delete - Deletes a user's icon",
	],
};