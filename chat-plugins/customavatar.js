'use strict'
/*Custom Avatar script. ~SilverTactic (Siiilver)*/
var fs = require('fs-extra');
var path = require('path');

function hasAvatar (user) {
	if (Config.customavatars[toId(user)] && fs.existsSync('config/avatars/' + Config.customavatars[toId(user)])) 
		return Config.customavatars[toId(user)];
	return false;
}

function loadAvatars() {
	var formatList = ['.png', '.gif', '.jpeg', '.jpg'];
	fs.readdirSync('config/avatars')
	.filter(function (avatar) {
		return formatList.indexOf(path.extname(avatar)) > -1;
	})
	.forEach(function (avatar) {
		Config.customavatars[path.basename(avatar, path.extname(avatar))] = avatar;
	});
}
loadAvatars();

function setAvatar(link, allowedFormats, targetUser, self) {
	new Promise (function (resolve, reject) {
		require("request").get(link)
		.on('error', function (err) {
			console.log(err);
			reject("Avatar unavailable. Try choosing a different one.");
		})
		.on('response', function (response) {
			if (response.statusCode !== 200) reject('Avatar unavailable. Try choosing a different one.');
			let type = response.headers['content-type'].split('/');
			if (type[0] !== 'image') reject('Link is not an image link.');
			if (!~allowedFormats.indexOf(type[1])) reject('Format not supported. The supported formats are ' + allowedFormats.join(', '));
	
			if (hasAvatar(targetUser)) fs.unlinkSync('config/avatars/' + Config.customavatars[toId(targetUser)]);
			let file = toId(targetUser) + '.' + type[1];
			response.pipe(fs.createWriteStream('config/avatars/' + file));
			resolve(file);
		});
	})
	.then(function (file) {
		Config.customavatars[toId(targetUser)] = file;
		let getUser = Users.getExact(targetUser);
		if (getUser) getUser.avatar = file;

		let desc = 'custom avatar has been set to <br><div style = "width: 80px; height: 80px; display: block"><img src = "' + link + '" style = "max-height: 100%; max-width: 100%"></div>';
		self.sendReply('|html|' + targetUser + '\'s ' + desc);
		if (getUser) {
			getUser.send('|html|Your custom avatar has been set. Refresh your page if you don\'t see it.');
			getUser.popup('|html|<center>Your ' + desc + '<br>Refresh your page if you don\'t see it under your username.</center>');
		}
	}.bind(this))
	.catch (function (err) {
		self.errorReply('Error setting ' + targetUser + '\'s avatar: ' + err);
	}.bind(this));
}

function removeAvatar(avatars, target){
	fs.unlinkSync('config/avatars/' + avatars[toId(target)]);
	delete avatars[toId(target)];
}

if (Config.watchconfig) {
	fs.watchFile(path.resolve(__dirname, 'config/config.js'), function (curr, prev) {
		if (curr.mtime <= prev.mtime) return;
		loadAvatars();
	});
}

let avy = global.avy = {
	deleteAvy: function(userid){
		fs.unlinkSync('config/avatars/' + Config.customavatars[userid]);
		let avatars = Config.customavatars;
		delete avatars[userid];
		if (Users.getExact(userid)) Users.getExact(userid).avatar = 1;
	},
	//user 1 avy moved to user 2
	shiftAvy: function(user1, user2){
		let user1Av = hasAvatar(user1);
		let user2Av = hasAvatar(user1);
		let newAv = toId(user2) + path.extname(user1Av);
		fs.copySync('config/avatars/' + user1Av, 'config/avatars/' + newAv);
		let avatars = Config.customavatars;
		avatars[toId(user2)] = newAv;
		if (Users.getExact(user2)) Users.getExact(user2).avatar = newAv;
	},
};

var cmds = {
	'': 'help',
	help: function (target, room, user) {
		if (!this.canBroadcast()) return;
		return this.sendReplyBox('<b>Custom Avatar commands</b><br>' +
			'(All commands require &)<br><br>' +
			'<li>/ca set <small>or</small> /setavatar <em>User</em>, <em>URL</em> - Sets a user\'s custom avatar to the specified image URL.' +
			'<li>/ca delete <small>or</small> /deleteavatar <em>User</em> - Deletes a user\'s custom avatar.'
		);
	},

	add: 'set',
	set: function (target, room, user, connection, cmd) {
		let userid = user.userid;
		let self = this;
		glevel.readXp(userid, xp => {
			let levelPass = (xp >= 3550) ? true : false;
			let canTargetOthers = (user.can('rangeban')) ? true : false;
			if (!canTargetOthers && !levelPass) return false;
			if (!target) return self.sendReply('|html|/ca set <em>User</em>, <em>URL</em> - Sets a user\'s custom avatar to the specified image.');
			target = target.split(',');
			if (target.length < 2)  return self.sendReply('|html|/ca set <em>User</em>, <em>URL</em> - Sets a user\'s custom avatar to the specified image.');
			if (!canTargetOthers && toId(target[0]) != userid) return self.sendReply("You do not have permission to change other user's avatars.");
			let targetUser = Users.getExact(target[0]) ? Users.getExact(target[0]).name : target[0];
			let link = target[1].trim();
			if (!link.match(/^https?:\/\//i)) link = 'http://' + link;
			var allowedFormats = ['png', 'jpg', 'jpeg', 'gif'];
			setAvatar(link, allowedFormats, targetUser, self);
			Alts.setAccountType(toId(target[0]), alts => {
				if (alts[0] === 'Main' && alts[1]) {
					for (let i in alts[1]) setAvatar(link, allowedFormats, alts[1][i], self);
				} else if (alts[0] === 'Alt') {
					Alts.setAccountType(alts[1][0], mainAlts => {
						if (mainAlts[1].length >= 2) {
							for (let i in mainAlts[1]) {
								if (mainAlts[1][i] !== target[0]) setAvatar(link, allowedFormats, mainAlts[1][i], self);
							}
						}
					});
				}
			});
		});
	},

	remove: 'delete',
	'delete': function (target, room, user, connection, cmd) {
		let userid = user.userid;
		let self = this;
		glevel.readXp(userid, xp => {
			let levelPass = (xp >= 3550) ? true : false;
			let canTargetOthers = (user.can('rangeban')) ? true : false;
			if (!canTargetOthers && !levelPass) return false
			if (!target || !target.trim()) return self.sendReply('|html|/' + cmd + ' <em>User</em> - Deletes a user\'s custom avatar.');
			target = Users.getExact(target) ? Users.getExact(target).name : target;
			let avatars = Config.customavatars;
			if (!hasAvatar(target)) return self.errorReply(target + ' does not have a custom avatar.');
			removeAvatar(avatars, target);
			Alts.setAccountType(toId(target), alts => {
				if (alts[0] === 'Main' && alts[1]) {
					for (let i in alts[1]) removeAvatar(avatars, alts[1][i]);
				} else if (alts[0] === 'Alt') {
					Alts.setAccountType(alts[1][0], mainAlts => {
						if (mainAlts[1].length >= 2) {
							for (let i in mainAlts[1]) {
								if (mainAlts[1][i] !== target[0]) removeAvatar(avatars, mainAlts[1][i]);
							}
						}
					});
				}
			});
			self.sendReply(target + '\'s custom avatar has been successfully removed.');
			if (Users.getExact(target)) {
				Users.getExact(target).send('Your custom avatar has been removed.');
				Users.getExact(target).avatar = 1;
			}
		});
	},
};

exports.commands = {
	ca: 'customavatar',
	customavatar: cmds,
	deleteavatar: 'removeavatar',
	removeavatar: cmds.delete,
	setavatar: cmds.set
}