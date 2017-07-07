/* Custom color plugin
 * by jd and panpawn
 */
'use strict';

const fs = require('fs');

function load() {
	fs.readFile('config/customcolors.json', 'utf8', function (err, file) {
		if (err) return;
		Prime.customColors = JSON.parse(file);
	});
}
setInterval(function () {
	load();
}, 1000);

function updateColor() {
	fs.writeFileSync('config/customcolors.json', JSON.stringify(Prime.customColors));

	let newCss = '/* COLORS START */\n';

	for (let name in Prime.customColors) {
		newCss += generateCSS(name, Prime.customColors[name]);
	}
	newCss += '/* COLORS END */\n';

	let file = fs.readFileSync('config/custom.css', 'utf8').split('\n');
	if (~file.indexOf('/* COLORS START */')) file.splice(file.indexOf('/* COLORS START */'), (file.indexOf('/* COLORS END */') - file.indexOf('/* COLORS START */')) + 1);
	fs.writeFileSync('config/custom.css', file.join('\n') + newCss);
	Prime.reloadCSS();
}
//Prime.updateColor = updateColor();

function generateCSS(name, color) {
	let css = '';
	let rooms = [];
	name = toId(name);
	Rooms.rooms.forEach((curRoom, id) => {
		if (id === 'global' || curRoom.type !== 'chat' || curRoom.isPersonal) return;
		if (!isNaN(Number(id.charAt(0)))) return;
		rooms.push('#' + id + '-userlist-user-' + name + ' strong em');
		rooms.push('#' + id + '-userlist-user-' + name + ' strong');
		rooms.push('#' + id + '-userlist-user-' + name + ' span');
	});
	css = rooms.join(', ');
	css += '{\ncolor: ' + color + ' !important;\n}\n';
	css += '.chat.chatmessage-' + name + ' strong {\n';
	css += 'color: ' + color + ' !important;\n}\n';
	return css;
}

exports.commands = {
	customcolour: 'customcolor',
	customcolor: {
		set: function (target, room, user) {
			if (!this.can('customcolor')) return false;
			target = target.split(',');
			for (let u in target) target[u] = target[u].trim();
			if (!target[1]) return this.parse('/help customcolor');
			if (toId(target[0]).length > 19) return this.errorReply("Usernames are not this long...");

			this.sendReply("|raw|You have given <b><font color=" + target[1] + ">" + Chat.escapeHTML(target[0]) + "</font></b> a custom color.");
			Rooms('upperstaff').add('|raw|' + Chat.escapeHTML(target[0]) + " has recieved a <b><font color=" + target[1] + ">custom color</fon></b> from " + Chat.escapeHTML(user.name) + ".").update();
			Prime.customColors[toId(target[0])] = target[1];
			Alts.setAccountType(toId(target[0]), alts => {
				if (alts[0] === 'Main' && alts[1]) {
					for (let i in alts[1]) Prime.customColors[alts[1][i]] = target[1];
				} else if (alts[0] === 'Alt') {
					Alts.setAccountType(alts[1][0], mainAlts => {
						if (mainAlts[1].length >= 2) {
							for (let i in mainAlts[1]) {
								if (mainAlts[1][i] !== target[0]) Prime.customColors[mainAlts[1][i]] = target[1];
							}
						}
					});
				}
			});
			updateColor();
		},
		delete: function (target, room, user) {
			if (!this.can('customicon')) return false;
			if (!target) return this.parse('/help customcolor');
			if (!Prime.customColors[toId(target)]) return this.errorReply('/customcolor - ' + target + ' does not have a custom color.');
			delete Prime.customColors[toId(target)];
			Alts.setAccountType(toId(target[0]), alts => {
				if (alts[0] === 'Main' && alts[1]) {
					for (let i in alts[1]) delete Prime.customColors[alts[1][i]];
				} else if (alts[0] === 'Alt') {
					Alts.setAccountType(alts[1][0], mainAlts => {
						if (mainAlts[1].length >= 2) {
							for (let i in mainAlts[1]) {
								if (mainAlts[1][i] !== target[0]) delete Prime.customColors[mainAlts[1][i]];
							}
						}
					});
				}
			});
			updateColor();
			this.sendReply("You removed " + target + "'s custom color.");
			Rooms('upperstaff').add(user.name + " removed " + target + "'s custom color.").update();
			if (Users(target) && Users(target).connected) Users(target).popup(user.name + " removed your custom color.");
			return;
		},
		preview: function (target, room, user) {
			if (!this.runBroadcast()) return;
			target = target.split(',');
			for (let u in target) target[u] = target[u].trim();
			if (!target[1]) return this.parse('/help customcolor');
			return this.sendReplyBox('<b><font size="3" color="' + target[1] + '">' + Chat.escapeHTML(target[0]) + '</font></b>');
		},
		reload: function (target, room, user) {
			if (!this.can('hotpatch')) return false;
			updateColor();
			this.privateModCommand("(" + user.name + " has reloaded custom colours.)");
		},
		'': function (target, room, user) {
			return this.parse("/help customcolor");
		},
	},
	customcolorhelp: [
		"Commands Include:",
		"/customcolor set [user], [hex] - Gives [user] a custom color of [hex]",
		"/customcolor delete [user], delete - Deletes a user's custom color",
		"/customcolor reload - Reloads colours.",
		"/customcolor preview [user], [hex] - Previews what that username looks like with [hex] as the color.",
	],
};