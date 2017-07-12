'use strict'

/*******************************
* Alt account system by Lights *
*******************************/

const fs = require('fs-extra');
let serverIp = '144.217.82.98';

function updateColor() {
	fs.writeFileSync('config/customcolors.json', JSON.stringify(Legacy.customColors));

	let newCss = '/* COLORS START */\n';

	for (let name in Legacy.customColors) {
		newCss += generateCSS(name, 'namecolor', Legacy.customColors[name]);
	}
	newCss += '/* COLORS END */\n';

	let file = fs.readFileSync('config/custom.css', 'utf8').split('\n');
	if (~file.indexOf('/* COLORS START */')) file.splice(file.indexOf('/* COLORS START */'), (file.indexOf('/* COLORS END */') - file.indexOf('/* COLORS START */')) + 1);
	fs.writeFileSync('config/custom.css', file.join('\n') + newCss);
	Legacy.reloadCSS();
}

function updateIcons() {
	fs.writeFileSync('config/icons.json', JSON.stringify(Legacy.icons));

	let newCss = '/* ICONS START */\n';

	for (let name in Legacy.icons) {
		newCss += generateCSS(name, 'icon', Legacy.icons[name]);
	}
	newCss += '/* ICONS END */\n';

	let file = fs.readFileSync('config/custom.css', 'utf8').split('\n');
	if (~file.indexOf('/* ICONS START */')) file.splice(file.indexOf('/* ICONS START */'), (file.indexOf('/* ICONS END */') - file.indexOf('/* ICONS START */')) + 1);
	fs.writeFileSync('config/custom.css', file.join('\n') + newCss);
	Legacy.reloadCSS();
}

function generateCSS(name, type, value) {
	let css = '';
	let rooms = [];
	name = toId(name);
	Rooms.rooms.forEach((curRoom, id) => {
		if (curRoom.id === 'global' || curRoom.type !== 'chat' || curRoom.isPersonal) return;
		if (!isNaN(Number(id.charAt(0)))) return;
		if (type === 'namecolor') {
			rooms.push('#' + id + '-userlist-user-' + name + ' strong em');
			rooms.push('#' + id + '-userlist-user-' + name + ' strong');
			rooms.push('#' + id + '-userlist-user-' + name + ' span');
		} else if (type === 'icon') {
			rooms.push('#' + id + '-userlist-user-' + name);
		}
	});
	css = rooms.join(', ');
	if (type === 'namecolor') {
		css += '{\ncolor: ' + value + ' !important;\n}\n';
		css += '.chat.chatmessage-' + name + ' strong {\n';
		css += 'color: ' + value + ' !important;\n}\n';
	} else if (type === 'icon') {
		css += '{\nbackground: url("' + value + '") no-repeat right\n}\n';
	}
	return css;
}

//friends
	let total = 0;
	let prio1 = 0;
	let prio2 = 0;
	let bff = 0;
	let dating = 0;
	Legacy.database.all("SELECT * FROM friends WHERE userid=$userid", {$userid: target}, function(err, targ) {
		if (targ && targ[0] && targ[0].friend) {
			total = targ.length;
			Legacy.database.all("SELECT * FROM friends WHERE userid=$userid AND bestfriend=1", {$userid: target}, function(err, targb) {
				if (targb && targb[0] && targb[0].friend) prio1 = targb.length;
				Legacy.database.all("SELECT * FROM friends WHERE userid=$userid AND dating=1", {$userid: target}, function(err, targd) {
					if (targd && targd[0] && targd[0].friend) prio2 = targd.length;
					Legacy.database.all("SELECT * FROM friends WHERE userid=$userid", {$userid: old}, function(err, prev) {
						if (prev && prev[0] && prev[0].friend) {
							for (let i in prev) {
								if (total < 51) {
									if (prev[i].bestfriend === 1 && prio1 < 3) {
										bff = 1;
									} else if (prev[i].dating === 1 && prio2 < 1) dating = 1;
									Legacy.database.run("INSERT INTO friends(userid, friend, bestfriend, dating) VALUES ($userid, $friend, $bff, $dating)", {$userid: target, $friend: prev[i].friend, $bff: bff, $dating: dating}, function(err, done) {
										Legacy.database.run("DELETE FROM friends WHERE userid=$userid AND friend=$friend", {$userid: old, $friend: prev[i].friend}, function(err, asdf) {});
									});
									if (bff === 1 || dating === 1) {
										bff = 0;
										dating = 0;
									}
								}
							}
						}
					});
				});
			});
		}
	});
//inventory
	let items1 = {};
	let items2 = {};
	let combined = {};
	let thisitem;
	let owned;
	let ownedlength;
	//get inventories of each userid
	Legacy.database.all("SELECT * FROM inventory WHERE userid=$userid", {$userid: old}, function(err, items) {
		if (items && items[0]) {
			owned = Object.getOwnPropertyNames(items[0]);
			ownedlength = owned.length;
			Legacy.database.all("SELECT * FROM inventory WHERE userid=$userid", {$userid: target}, function(err, itemst) {
				if (itemst && itemst[0] && itemst[0].userid) {
					//assemble array of objects containing user inventories
					for (let i = 0; i < ownedlength; i++) {
						if (Boolean(items[0][owned[i]]) && items[0][owned[i]] > 0 && owned[i] !== 'userid') items1[owned[i]] = {id: owned[i], amt: items[0][owned[1]]};
						if (Boolean(itemst[0][owned[i]]) && itemst[0][owned[i]] > 0 && owned[i] !== 'userid') items2[owned[i]] = {id: owned[i], amt: itemst[0][owned[1]]};
					}
					
					combined = items1;
					
					for (let i = 0; i < items2.length; i++) {
						thisitem = items2[i].id;
						if (combined[thisitem]) {
							combined[thisitem].amt = (+combined[thisitem].amt + +items2[thisitem].amt);
						} else combined[thisitem] = items2[thisitem];
					}
					items1 = false;
					items2 = false;
					Legacy.database.run("DELETE FROM inventory WHERE userid=$userid1 OR userid=$userid2", {$userid1: old, $userid2: target}, function(err, results) {
						if (!err) {
							let SQL = "INSERT INTO inventory(userid, ";
							let SQL2 = "VALUES ($userid, ";
							let itemIds = Object.getOwnPropertyNames(combined);
							for (let x = 0; x < itemIds.length; x++) {
								SQL += itemIds[x];
								SQL2 += combined[itemIds[x]].toString;
								if (x != (itemIds.length - +1)) {
									SQL += ", ";
									SQL2 += ", ";
								}
							}
							SQL += ") " + SQL2 + ")";
							Legacy.database.run(SQL, {$userid: target});
						}
					});
				}
			});
		}
	});
//profile
	let p1 = false;
	let p2;
	let empty = false;
	Legacy.database.all("SELECT * FROM profile WHERE userid=$userid", {$userid: target}, function (err, results1) {
		if (results1.length == 0) {
			Legacy.database.run("INSERT INTO profile(userid, pbackground, pcolor, pcolor2, pabout, league, gang) VALUES ('"+target+"','0','0','0','0','0','0','0','0','0','0','0')", function (err) {
				if (err) return //console.log(err);
			});
		} else p1 = true;
		Legacy.database.all("SELECT * FROM profile WHERE userid=$userid", {$userid: old}, function (err, results2) {
			if (results2.length > 0) {
				if (results2[0].pbackground === '0' && results2[0].pabout === '0' && results2[0].pcolor === '0' && results2[0].pcolor2 === '0') {
					p2 = false;
				} else p2 = true;
			}
			if (p2 && !p1) {
				Legacy.database.run("UPDATE profile SET userid=$new WHERE userid=$old", {$new: target, $old: old});
      } else if (p1 && p2) {
				let data = {
					p1: {
						background: ((results1[0].pbackground && results1[0].pbackground !== '0') ? results1[0].pbackground : false),
						colorPrimary: ((results1[0].pcolor && results1[0].pcolor !== '0') ? results1[0].pcolor : false),
						colorSecondary: ((results1[0].pcolor2 && results1[0].pcolor2 !== '0') ? results1[0].pcolor2 : false),
						team: ((team[0].length > 0) ? team[0] : false),
						about: ((results1[0].pabout && results1[0].pabout !== '0') ? results1[0].pabout : false)
					},
					p2: {
						background: ((results2[0].pbackground && results2[0].pbackground !== '0') ? results2[0].pbackground : false),
						colorPrimary: ((results2[0].pcolor && results2[0].pcolor !== '0') ? results2[0].pcolor : false),
						colorSecondary: ((results2[0].pcolor2 && results2[0].pcolor2 !== '0') ? results2[0].pcolor2 : false),
						team: ((team[1].length > 0) ? team[1] : false),
						about: ((results2[0].pabout && results2[0].pabout !== '0') ? results2[0].pabout : false)
					}
				};
				if (!Alts.pendingConflicts) Alts.pendingConflicts = [];
				Alts.pendingConflicts.push('p.'+target+'|'+old);
				setupConflicts(target);
				Users(target).pendingConflicts++;
				Users(target).conflictDataCache.profile = data;
				if (Users(target).pendingConflicts === 1) conflictHandler('profile', target);
			} else Legacy.database.run("DELETE FROM profile WHERE userid=$userid", {$userid: old});
		});
//Avatar, Color, Icon
}
);
function shiftMain(userid, alts, i, callback){
	Legacy.database.run("UPDATE users SET linked=$linked WHERE userid=$userid", {$linked: ((userid) ? "a."+userid : ''), $userid: alts[i]}, function(err, done) {
		if (!userid) unlink(alts[i]);
		if (i < (+alts.length - +1)) {
			shiftMain(userid, alts, i++, callback);
		} else return callback(true);
	});
}

function conflictHandler(type, userid) {
	let output = '';
	let data;
	switch(type) {
		case 'profile':
			if (Users(userid).conflictDataCache.profile) {
				data = Users.get(userid).conflictDataCache.profile;
				delete Users.get(userid).conflictDataCache.profile;
			} else break;
			output += '<center><font size=4><b>Profile conflict:</b></font><br/><br/>' +
				'<b>Current account</b><br/>';
				if (data.p1.background) output += '<b>Background</b>: <font color="'+data.p1.background+'">'+data.p1.background+'</font><br/>';
				if (data.p1.colorPrimary) output += '<b>Primary Color</b>: <font color="'+data.p1.colorPrimary+'">'+data.p1.colorPrimary+'</font><br/>';
				if (data.p1.colorSecondary) output += '<b>Secondary Color</b>: <font color="'+data.p1.colorSecondary+'">'+data.p1.colorSecondary+'</font><br/>';
				if (data.p1.about) output += '<b>About</b>: '+data.p1.about+'<br/>';
				if (data.p2.background) output += '<b>Background</b>: <font color="'+data.p2.background+'">'+data.p2.background+'</font><br/>';
				if (data.p2.colorPrimary) output += '<b>Primary Color</b>: <font color="'+data.p2.colorPrimary+'">'+data.p2.colorPrimary+'</font><br/>';
				if (data.p2.colorSecondary) output += '<b>Secondary Color</b>: <font color="'+data.p2.colorSecondary+'">'+data.p2.colorSecondary+'</font><br/>';
				if (data.p2.about) output += '<b>About</b>: '+data.p2.about+'<br/>';
			output += '<b>Please select which profile settings you would like to keep.</b><br/><button name="send" value="/handleconflict p,0">Keep Current</button> <button name="send" value="/handleconflict p,1">Use Old</button><br/><b>If you close this prompt, the settings will be lost after a short time.</b><br/></center>';
			break;
		case 'avy':
			if (Users(userid).conflictDataCache.avatar) {
				data = Users.get(userid).conflictDataCache.avatar;
				delete Users.get(userid).conflictDataCache.avatar;
			} else break;
			output += '<center><font size=4><b>Avatar conflict:</b></font><br/><br/>' +
				'<b>Current account avatar</b>: <img src="'+data[0]+'"><br/><br/>' +
				'<b>Old account avatar</b>: <img src="'+data[1]+'"><br/><br/>' +
				'<b>Please select which avatar you would like to keep.</b><br/><button name="send" value="/handleconflict a,0">Keep Current</button> <button name="send" value="/handleconflict a,1">Use Old</button><br/><b>If you close this prompt, the old avatar will be lost after a short time.</b><br/></center>';
			break;
		case 'icon':
			if (Users(userid).conflictDataCache.icon) {
				data = Users.get(userid).conflictDataCache.icon;
				delete Users.get(userid).conflictDataCache.icon;
			} else break;
			output += '<center><font size=4><b>Icon conflict:</b></font><br/><br/>' +
				'<b>Current account icon</b>: <img src="'+data[0]+'"><br/><br/>' +
				'<b>Old account icon</b>: <img src="'+data[1]+'"><br/><br/>' +
				'<b>Please select which icon you would like to keep.</b><br/><button name="send" value="/handleconflict i,0">Keep Current</button> <button name="send" value="/handleconflict i,1">Use Old</button><br/><b>If you close this prompt, the old icon will be lost after a short time.</b><br/></center>';
			break;
		case 'color':
			if (Users(userid).conflictDataCache.color) {
				data = Users.get(userid).conflictDataCache.color;
				delete Users.get(userid).conflictDataCache.color;
			} else break;
			output += '<center><font size=4><b>Color conflict:</b></font><br/><br/>' +
				'<b>Current account color</b>: ' + Legacy.nameColor(data[0], false) + '</font><br/>' +
				'<b>Old account color</b>: ' + Legacy.nameColor(data[1], false) + '</font><br/>' +
				'<b>Please select which color you would like to keep.</b><br/><button name="send" value="/handleconflict c,0">Keep Current</button> <button name="send" value="/handleconflict c,1">Use Old</button><br/><b>If you close this prompt, the old color will be lost after a short time.</b><br/></center>';
			break;
	}
	Users.get(userid).send('|popup||wide||html|' + output);
}

function setupConflicts(userid) {
	if (!Users(userid).pendingConflicts) Users(userid).pendingConflicts = 0;
	if (!Users(userid).conflictDataCache) Users(userid).conflictDataCache = {profile: false, avatar: false, icon: false, color: false};
}

function ACICheck(target, old) {
	//get required stuff
	let mainAvy = Config.customavatars[target] ? target : false;
	let altAvy = Config.customavatars[old] ? old : false;
	let mainIcon = Legacy.icons[target] ? Legacy.icons[target] : false;
	let altIcon = Legacy.icons[old] ? Legacy.icons[old] : false;
	let mainColor = Legacy.customColors[target] ? Legacy.customColors[target] : false;
	let altColor = Legacy.customColors[old] ? Legacy.customColors[old] : false;
	let data;
	//console.log('ma: ' + mainAvy + ', aa: ' + altAvy + ', mi: ' + mainIcon + ', ai: ' + altIcon + ', mc: ' + mainColor + ', ac: ' + altColor);
	if (!Alts.pendingConflicts) Alts.pendingConflicts = [];
	//console.log('pendingconflicts1: ' + Alts.pendingConflicts);
	//check for conflicts
	if (mainAvy && altAvy) {
		setupConflicts(target);
		Alts.pendingConflicts.push('a.'+target+'|'+old);
		Users(target).pendingConflicts++;
		data = ["http://" + serverIp + ":" + Config.port + "/avatars/" + Config.customavatars[target], "http://" + serverIp + ":" + Config.port + "/avatars/" + Config.customavatars[old]];
		Users(target).conflictDataCache.avatar = data;
		if (Users(target).pendingConflicts === 1) conflictHandler('avy', target);
	} else if (mainAvy || altAvy) (mainAvy) ? avy.shiftAvy(target, old) : avy.shiftAvy(target, old);
	//console.log('pendingconflicts2: ' + Alts.pendingConflicts);
	if (mainIcon && altIcon) {
		setupConflicts(target);
		Alts.pendingConflicts.push('i.'+target+'|'+old);
		Users(target).pendingConflicts++;
		data = [mainIcon, altIcon];
		Users(target).conflictDataCache.icon = data;
		if (Users(target).pendingConflicts === 1) conflictHandler('icon', target);
	} else if (mainIcon || altIcon) (mainIcon) ? iconUpdate(old, mainIcon) : iconUpdate(target, altIcon);
	//console.log('pendingconflicts3: ' + Alts.pendingConflicts);
	if (mainColor && altColor) {
		setupConflicts(target);
		Alts.pendingConflicts.push('c.'+target+'|'+old);
		Users(target).pendingConflicts++;
		data = [target, old];
		Users(target).conflictDataCache.color = data;
		if (Users(target).pendingConflicts === 1) conflictHandler('color', target);
	} else if (mainColor || altColor) (mainColor) ? colorUpdate(old, mainColor) : colorUpdate(target, altColor);
	//console.log('pendingconflicts4: ' + Alts.pendingConflicts);
}

function iconUpdate(userid, icon){
	Legacy.icons[userid] = icon;
	updateIcons();
}

function colorUpdate(userid, hex){
	Legacy.customColors[userid] = hex;
	updateColor();
}

function unlink(userid) {
	if (Legacy.customColors[userid]) {
		delete Legacy.customColors[userid];
		updateColor();
	}
	if (Config.customavatars[userid]) avy.deleteAvy(userid);
	if (Legacy.icons[userid]) {
		delete Legacy.icons[userid];
		updateIcons();
	}
}

function displayAlts(user, userid, online, self){
	let text = 'Linked Alts';
	if (user.altType === 'Alt') {
		text = 'Main Account';
	} else if (user.altType === 'Bot') text = 'Bot Owner';
	let output = '<center><b>Alts of '+Legacy.nameColor(userid, true)+' ' + ((online) ? '(Online)' : '(Offline)') + ':</b><br/>' +
		'<b>Alt Type</b>: ' + user.altType + '<br/>' +
		'<b>'+text+'</b>: ' + ((user.linkedAlts) ? user.linkedAlts.join(', ') : 'None') + '</center>';
	return self.sendReplyBox(output);
}

let Alts = global.Alts = {
	
	setAccountType: function(userid, callback){
		let type = false;
		let alts = [];
		Legacy.database.all("SELECT linked FROM users WHERE userid=$userid", {$userid: userid}, function (err, results) {
			type = ((results && results[0] && results[0].linked) ? true : false);
			if (type) {
				let parts = results[0].linked.split('.');
				type = parts.shift();
				switch (type) {
					case 'b':
						type = 'Bot';
						break;
					case 'a':
						type = 'Alt';
						break;
					case 'm':
						type = 'Main';
						break;
				}
				if (type == 'Main') {
					alts = parts[0].split('|');
				} else alts = parts;
			} else {
				//if the account has no database entry for alts, it will set the account as an alt-less main.
				type = 'Main';
				alts = false;
			}
			return callback([type, alts]);
		});
	},
	getMain: function(userid){
		let userObject = ((Users(userid)) ? Users(userid) : false);
		if (userObject) {
			if (userObject.altType === 'Alt') {
				return userObject.linkedAlts[0];
			} else return userid;
		} else return userid;
	},
};

exports.commands = {
	
	handleconflict: function(target, room, user) {
		if (!target) target = 'all';
		if (!Alts.pendingConflicts) Alts.pendingConflicts = [];
		let parts = target.split(',');
		if (parts.length !== 2) return false;
		if (!user.pendingConflicts || user.pendingConflicts < 1) return false;
		for (let i in parts) parts[i] = toId(parts[i]).trim();
		let tokens = ['p', 'c', 'a', 'i'];
		if (tokens.indexOf(parts[0]) === -1) return false;
		if (parts[1] !== '0' && parts[1] !== '0') return false;
		let conflict = false;
		let options;
		let newPendingConflicts = [];
		for (let i in Alts.pendingConflicts) {
			options = Alts.pendingConflicts[i].split('.');
			options[1] = options[1].split('|');
			//console.log('conflict search ' + i + ': ' + options[0] + ' ' + parts[0] + ' ' + options[1] + ' ' + options[1][0]); 
			if (options[0] && options[0] === parts[0] && options[1] && options[1][0] !== -1) {
				conflict = options;
			} else newPendingConflicts.push(Alts.pendingConflicts);
		}
		//console.log('conflict: ' + conflict);
		Alts.pendingConflict = newPendingConflicts;
		let userid = options[1][1];
		if (!conflict) return false;
		switch(parts[0]) {
			case 'p':
				if (parts[1] === '0') {
					Legacy.database.run("DELETE FROM profile WHERE userid=$olduserid", {$olduserid: userid});
				} else {
					Legacy.database.run("DELETE FROM profile WHERE userid=$userid", {$userid: user.userid}, function(err) {
						if (!err) Legacy.database.run("UPDATE profile SET userid=$userid WHERE userid=$olduserid", {$userid: user.userid, $olduserid: userid});
					});
				}
				break;
			case 'c':
				if (parts[1] === '0') {
					colorUpdate(userid, Legacy.customColors[user.userid]);
				} else colorUpdate(user.userid, Legacy.customColors[userid]);
				break;
			case 'a':
				if (parts[1] === '0') {
					avy.shiftAvy(userid, user.userid);
				} else avy.shiftAvy(user.userid, userid);
				break;
			case 'i':
				if (parts[1] === '0') {
					iconUpdate(userid, Legacy.icons[user.userid]);
				} else iconUpdate(user.userid, Legacy.icons[userid]);
				break;
		}
		user.pendingConflicts--;
		if (user.pendingConflicts > 0) {
			for (let i in Alts.pendingConflicts) {
				options = Alts.pendingConflicts[i].split('.');
				options[1] = options[1].split('|');
				if (options[0] && options[0] === parts[0] && options[1] && options[1][0] !== -1) {
					let token;
					if (options[0] === 'p') {
						token = 'profile';
					} else if (options[0] === 'a') {
						token = 'avy';
					} else if (options[0] === 'i') {
						token = 'icon';
					} else token = 'color';
					conflictHandler(token, false, user.userid);
					break;
				}
			}
		} else user.send('|popup||wide||html|<center><b>All pending Conflicts have been resolved.</b></center>');
	},
    
    alts: {
        link: function(target, room, user) {
            if (!target) return this.sendReply("/alts link [userid] - userid must be an alt of yours.");
            let userid = toId(target).trim();
            if (userid.length > 19) return this.sendReply("User names aren\'t this long.");
            if (!Legacy.pendingLinks) Legacy.pendingLinks = [];
            for (let i in Legacy.pendingLinks) {
                let parts = Legacy.pendingLinks[i].split('|');
                if (userid == parts[0] || user.userid == parts[0] || userid == parts[1] || user.userid == parts[1]) return this.errorReply("One or more of these userIds has a pending link. To clear these, use ``/alts clearpending`` on both accounts and try again.");
            }
            let self = this;
			if (!user.registered) return this.sendReply("Your account must be registered to have alts.");
            if (user.altType !== 'Main') return this.sendReply("Your account is not marked as a 'Main' account; use ``/alts main`` to set this account as your Main.");
			if (user.linkedAlts && user.linkedAlts.indexOf(userid) !== -1) return this.sendReply("The account you selected is already an alt of this account.");
			if (user.linkedAlts.length == 5) return this.sendReply("You may not link more than 5 alts to a Main account.");
            Alts.setAccountType(userid, accountType => {
				if (accountType[0] === 'Alt') return this.sendReply("The account you selected is already an alt account. Login to this account and use ``/alts clear``, then try again.");
				if (accountType[0] === 'Bot') return this.sendReply("You cannot link Bot accounts as alts.");
				if (accountType[1]) return this.sendReply("The account you selected already has alts linked to it. Login to this account and use ``/alts clear``, then try again.");
					
				let pendingLink = user.userid + '|' + userid + '|' + '3';
				Legacy.pendingLinks.push(pendingLink);
				return self.sendReply("Pending account link with " + userid + " created; login to that account and use /alts confirmlink. (Pending links will be cleared if not completed after a short time).");
            });
        },
		
		confirmlink: function(target, room, user) {
            if (!Legacy.pendingLinks) Legacy.pendingLinks = [];
			if (!user.registered) return this.sendReply("Your account must be registered to be linked as an alt.");
			let status = false;
			let self = this;
			let selected;
            for (let i in Legacy.pendingLinks) {
                let parts = Legacy.pendingLinks[i].split('|');
                if (parts[1] == user.userid) {
					status = parts[0];
					selected = i;
				}
            }
			if (!status) return this.sendReply("This account has no pending alt links.");
			if (!user.linkWarning) {
				user.linkWarning = true;
				return this.sendReply("This account has a pending link with the userid '" + status + "'; if you are sure you would like to confirm this link, use this command a second time.");
			} else {
				user.linkWarning = false;
				Legacy.database.run("UPDATE users SET linked='a."+status+"' WHERE userid=$userid", {$userid: user.userid});
				Alts.setAccountType(status, accountType => {
					let newVal = 'm.';
					if (accountType[1]) {
						for (let i in accountType[1]) {
							newVal += accountType[1][i] + '|';
						}
					}
					newVal += user.userid;
					Legacy.database.run("UPDATE users SET linked=$newVal WHERE userid=$userid", {$newVal: newVal, $userid: status});
					user.altType = 'Alt';
					user.linkedAlts = [status];
					user.accountType = 'Trusted';
					delete Legacy.pendingLinks[selected];
					mergeStuff(status, user.userid);
					return self.sendReply("This account has been linked to the userid '" + status + "'.");
				});
			}
		},
		
		unlink: function(target, room, user) {
			if (target) return this.errorReply("This command does not support targets. Just use `/alts unlink`.");
			if (user.altType === 'Main') {
				return this.parse('/alts clear');
			} else if (user.altType === 'Bot') return this.sendReply("You cannot unlink a bot from an owner; please contact a member of upperstaff to have this status removed.");
			let self = this;
			Alts.setAccountType(user.linkedAlts[0], results => {
				results[1].splice(results[1].indexOf(user.userid), 1);
				let newAlts = ((results[1].length > 0) ? 'm.' + results[1].join('|') : '');
				Legacy.database.run("UPDATE users SET linked=$linked WHERE userid=$userid", {$linked: newAlts, $userid: user.linkedAlts[0]}, function(err) {
					if (err) //console.log(err);
					Legacy.database.run("UPDATE users SET linked=$linked WHERE userid=$userid", {$linked: '', $userid: user.userid}, function(err) {
						if (err) //console.log(err);
						user.altType = 'Main';
						self.sendReply("This account has broken its link to the userid '"+user.linkedAlts[0]+"'.");
						user.linkedAlts = false;
						unlink(user.userid);
						return;
					});
				});
			});
		},
        
        main: function(target, room, user) {
            if (target) return this.errorReply("This command does not support targets. Just use `/alts main`.");
            let self = this;
			switch (user.altType) {
				case 'Main':
					return this.sendReply("Your account is already a Main account.");
					break;
				case 'Bot':
					return this.sendReply("Your account is a Bot account, please contact a member of upperstaff to have this status removed.");
					break;
				case 'Alt':
					Alts.setAccountType(user.linkedAlts[0], results => {
						results[1].splice(results[1].indexOf(user.userid), 1);
						results[1].push(user.linkedAlts[0]);
						shiftMain(user.userid, results[1], 0, done => {
							Legacy.database.run("UPDATE users SET linked=$linked WHERE userid=$userid", {$linked: "m."+results[1].join('|'), $userid: user.userid}, function(err) {
								if (err) //console.log(err);
								mergeStuff(user.userid, user.linkedAlts[0]);
								user.altType = 'Main';
								user.linkedAlts = results[1];
								return self.sendReply("Your Main switch was successful, your possessions are being moved to this account. This may take between a few seconds and a few minutes, so please remain patient.");
							});
						});
					});
					break;
			}
        },
        
        clearpending: function(target, room, user) {
            if (target) return this.errorReply("This command does not support targets.");
            if (!Legacy.pendingLinks) Legacy.pendingLinks = [];
            let newPending = [];
            for (let i in Legacy.pendingLinks) {
                let parts = Legacy.pendingLinks[i].split('|');
                if (!user.userid == parts[0] || !user.userid == parts[1]) newPending.push(Legacy.pendingLinks[i]);
            }
            Legacy.pendingLinks = newPending;
            return this.sendReply("All pending links on this account have been cleared.");
        },
        
        clear: function(target, room, user) {
			if (target) return this.errorReply("This command does not support targets. Just use `/alts clear`.");
			if (user.altType === 'Alt') {
				return this.parse('/alts unlink');
			} else if (user.altType === 'Bot') return this.sendReply("You cannot unlink a bot from an owner; please contact a member of upperstaff to have this status removed.");
			let self = this;
			Legacy.database.run("UPDATE users SET linked='' WHERE userid=$userid", {$userid: user.userid}, function(err, done) {
				shiftMain(false, user.linkedAlts, 0, done => {
					user.linkedAlts = false;
					return self.sendReply("All alt links on this account have been removed.");
				});
			});
        },
		
		setbot: function(target, room, user) {
			if (!target) return this.sendReply("/alts setbot [botId], [userid]");
			if (!user.can('rangeban')) return this.sendReply("/alts setbot - Access Denied.");
			let parts = target.split(',');
			if (parts[0].length > 19 || parts[1].length > 19) return this.sendReply("Usernames are not this long.");
			for (let i in parts) parts[i] = toId(parts[i]).trim();
			let self = this;
			Legacy.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: parts[0]}, function(err, results) {
				if (!results || !results[0] || !results[0].userid) {
					return self.sendReply("This bot has not logged into Legacy; ensure that the owner connects their bot to the server first.");
				} else {
					Legacy.database.run("UPDATE users SET linked='b."+parts[1]+"' WHERE userid=$userid", {$userid: parts[0]});
					return self.sendReply("The userid '"+parts[0]+"' has been set as a Bot account with '"+parts[1]+"' as it's owner.");
				}
			});
		},
		
		view: function(target, room, user) {
			if (target) {
				if (!this.can('ban')) return this.sendReply("/alts view - Access Denied.");
				if (target.length < 19) {
					target = toId(target).trim();
				} else return this.sendReply("Usernames are not this long.");
			} else target = user.userid;
			let online = Users(target);
			if (online) {
				displayAlts(online, online.name, true, this);
			} else {
				Alts.setAccountType(target, reply => {
					let obj = {
						altType: reply[0],
						linkedAlts: reply[1]
					};
					displayAlts(obj, target, false, this);
				});
			}
		},
        
        '': 'help',
        help: function(target, room, user) {
			if (!this.runBroadcast()) return;
			return this.sendReplyBox("/alts link [userid] - creates a pending alt link with the selected account.<br/>" +
				"/alts confirmlink - confirms a pending alt link.<br/>" + 
				"/alts main - sets your current account as your main account.<br/>" +
				"/alts clearpending - clears pending links with the current userid.<br/>" +
				"/alts unlink - breaks the link between an alt and its main account.<br/>" + 
				"/alts clear - breaks the link between a main account and all of its alts.<br/>" +
				"/alts view [user]* - displays all linked alts of a user. If no user is selected, your own alts are displayed (Requires @ to view other users' alts)<br/>" +
				"/alts setbot [botId], [ownerId] - registers an account as a bot and sets the owner.<br/>" +
				"If you would like to link an alternate account to a Main account; simply use `/alts link [userid]` on your main account with userid being the name of your alt account, then login to your alt account and use `/alts confirmlink`.");
        },
    },
};
