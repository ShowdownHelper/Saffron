'use strict';

const moment = require('moment');

const MAX_FRIENDS = 50;
const MAX_BESTFRIENDS = 3;
const MAX_DATING = 1;

let buddy = global.buddy = {

	sendBack: function(userid, rgb, callback) {
		let friendback;
		userid = Alts.getMain(toId(userid));
		Prime.database.all("SELECT friend FROM friends WHERE userid=$userid AND bestfriend=0 AND dating=0", {$userid: userid}, function (err, rows) {
			if (err) return //console.log("getFriends: " + err);
			let friends = [];
			for (let row in rows) {
				let friendid = rows[row].friend;
				friends.push(friendid);
			}
			Prime.database.all("SELECT friend FROM friends WHERE userid=$userid AND bestfriend=1", {$userid: userid}, (err, results1) => {
				if (err) return //console.log("getBestFriends: " + err);
				let bestfriends = [];
				for (let zult in results1) {
					let bffid = results1[zult].friend + ' (Best Buddy)';
					bestfriends.push(bffid);
				}
				Prime.database.all("SELECT friend FROM friends WHERE userid=$userid AND dating=1", {$userid: userid}, (err, results2) => {
					if (err) return //console.log("getDating: " + err);
					let dating = [];
					for (let zults in results2) {
						let dateid = results2[zults].friend + ' (Dating)';
						dating.push(dateid);
					}
					let output = [];
					for (let w = 0; w < dating.length; w++) {
						output.push(dating[w]);
					}
					for (let y = 0; y < bestfriends.length; y++) {
						output.push(bestfriends[y]);
					}
					for (let z = 0; z < friends.length; z++) {
						output.push(friends[z]);
					}
					friends = output;
					if (friends.length < 1) {
						friendback = ("");
						if (callback) return callback(friendback);
					} else {
						let count = 0;
						let friendList = [];
						buddy.assembleObjects(friends, count, friendList, assem => {
							buddy.notifyStatus(userid, status => {
								let output = "";
								output += '<div style="max-height: 150px; overflow-y: auto; overflow-x: hidden; border: 2px solid; border-radius: 5px; background-color: rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+');"><b>Buddies of ' + Prime.nameColor(userid, true) + ' (' + friends.length + '):</b><br />';
								output += (status ? "(<i>does</i> get notified when buddies come online)" : "(<i>does NOT</i> get notified when buddies come online)");
								output += '<table border="1" cellspacing ="0" cellpadding="3">';
								output += "<tr><td><u>Name:</u></td><td><u>Last Seen:</u></td><td><u>Points:</u></td></tr>";
								for (let u in friendList) {
									let seen = (assem[u].date ? moment(assem[u].date).format("MMMM Do YYYY, h:mm:ss A") + " EST. (" + moment(assem[u].date).fromNow() + ")" : "<font color=\"red\">Never</font>");
									let points =friendList[u].points;
									let thisdating = 0;
									let thisbff = 0;
									if ((assem[u].name).endsWith(' (Dating)')) {
										assem[u].name = (assem[u].name).replace(" (Dating)","");
										thisdating = 1;
									} else if ((assem[u].name).endsWith(' (Best Buddy)')) {
										assem[u].name = (assem[u].name).replace(" (Best Buddy)","");
										thisbff = 1;
									}
									assem[u].name = Prime.nameColor(assem[u].name, true);
									if (Users(assem[u].name) && Users(assem[u].name).connected) seen = '<font color="green">Currently Online</font>';
									if (thisdating === 1) {
										assem[u].name = assem[u].name + ' (Dating)';
										thisdating = 0;
									} else if (thisbff === 1) {
										assem[u].name = assem[u].name + ' (Best Buddy)';
										thisbff = 0;
									}
									output += "<tr><td><b>" + assem[u].name + "</b></td><td>" + seen + "</td><td>" + points + "</td></tr>";
								}
								output += "</table>";
								buddy.getAdded(userid, function (added) {
									if (added.length > 0) {
										output += "<button name=\"send\" value=\"/friendslist getadded " + toId(userid) + "\">" + added.length +
										(added.length === 1 ? " user has" : " users have") + " added <b>" + userid + "</b> to their buddy list.</button>";
									}
									output += "</div><br/>";
									friendback = output;
									if (callback) return callback(friendback);
								});
							});
						});
					}
				});
			});
		});
	},
	
	assembleObjects: function(friends, count, friendList, callback) {
		if (!friends[count] && friendList.length > 0) return callback(friendList);
		let thisdating = 0;
		let thisbff = 0;
		if (friends[count].endsWith(' (Dating)')) {
			friends[count] = friends[count].replace(" (Dating)","");
			thisdating = 1;
		} else if (friends[count].endsWith(' (Best Buddy)')) {
			friends[count] = friends[count].replace(" (Best Buddy)","");
			thisbff = 1;
		}
		buddy.getInfo(friends[count], thisdating, thisbff, friendObject => {
			friendList.push(friendObject);
			count++;
			buddy.assembleObjects(friends, count, friendList, callback);
		});
	},	
		
	getInfo: function(friend, thisdating, thisbff, callback) {
		Prime.lastSeen(friend, function (date) {
			Economy.readMoney(friend, function (bucks) {
				if (thisdating === 1) {
					friend = friend + ' (Dating)';
					thisdating = 0;
				} else if (thisbff === 1) {
					friend = friend + ' (Best Buddy)';
					thisbff = 0;
				}
				let friendObject = {
					name: friend,
					date: date,
					points: bucks
				};
				if (callback) return callback(friendObject);
			});
		});
	},
	
	getAdded: function(userid, callback) {
		if (!callback) return false;
		userid = toId(userid);
		Prime.database.all("SELECT userid FROM friends WHERE friend=$userid", {$userid: userid}, function (err, rows) {
			if (err) return //console.log("getAdded: " + err);
			let added = [];
			for (let row in rows) added.push(rows[row].userid);
			callback((added.length > 0 ? added : false));
		});
	},
	
	notifyStatus: function(userid, callback) {
		if (!callback) return false;
		userid = toId(userid);
		Prime.database.all("SELECT notifyStatus FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
			if (err) return //console.log("notifyStatus: " + err);
			callback(rows[0].notifyStatus === 1);
		});
	},
};

function getFriends(userid, callback) {
	if (!callback) return false;
	userid = Alts.getMain(toId(userid));
	Prime.database.all("SELECT friend FROM friends WHERE userid=$userid AND bestfriend=0 AND dating=0", {$userid: userid}, function (err, rows) {
		if (err) return //console.log("getFriends: " + err);
		let friends = [];
		for (let row in rows) {
			let friendid = rows[row].friend;
			friends.push(friendid);
		}
		Prime.database.all("SELECT friend FROM friends WHERE userid=$userid AND bestfriend=1", {$userid: userid}, (err, results1) => {
			if (err) return //console.log("getBestFriends: " + err);
			let bestfriends = [];
			for (let zult in results1) {
				let bffid = results1[zult].friend + ' (Best Buddy)';
				bestfriends.push(bffid);
			}
			Prime.database.all("SELECT friend FROM friends WHERE userid=$userid AND dating=1", {$userid: userid}, (err, results2) => {
				if (err) return //console.log("getDating: " + err);
				let dating = [];
				for (let zults in results2) {
					let dateid = results2[zults].friend + ' (Dating)';
					dating.push(dateid);
				}
				let output = [];
				for (let x = 0; x < dating.length; x++) {
					output.push(dating[x]);
				}
				for (let y = 0; y < bestfriends.length; y++) {
					output.push(bestfriends[y]);
				}
				for (let z = 0; z < friends.length; z++) {
					output.push(friends[z]);
				}
				callback((output.length > 0 ? output : false));
			});
		});
	});
}

function getAdded(userid, callback) {
	if (!callback) return false;
	userid = Alts.getMain(toId(userid));
	Prime.database.all("SELECT userid FROM friends WHERE friend=$userid", {$userid: userid}, function (err, rows) {
		if (err) return //console.log("getAdded: " + err);
		let added = [];
		for (let row in rows) added.push(rows[row].userid);
		callback((added.length > 0 ? added : false));
	});
}

function notifyStatus(userid, callback) {
	if (!callback) return false;
	userid = toId(userid);
	Prime.database.all("SELECT notifyStatus FROM users WHERE userid=$userid", {$userid: userid}, function (err, rows) {
		if (err) return //console.log("notifyStatus: " + err);
		callback(rows[0].notifyStatus === 1);
	});
}

function getOnlineTimes(friends, count, options) {
	if (!friends[count]) return showFriends(options[0], friends, options[1]);
	let thisdating = 0;
	let thisbff = 0;
	if (friends[count].endsWith(' (Dating)')) {
		friends[count] = friends[count].replace(" (Dating)","");
		thisdating = 1;
	} else if (friends[count].endsWith(' (Best Buddy)')) {
		friends[count] = friends[count].replace(" (Best Buddy)","");
		thisbff = 1;
	}
	Prime.lastSeen(friends[count], function (date) {
		Economy.readMoney(friends[count], function (bucks) {
			if (thisdating === 1) {
				friends[count] = friends[count] + ' (Dating)';
				thisdating = 0;
			} else if (thisbff === 1) {
				friends[count] = friends[count] + ' (Best Buddy)';
				thisbff = 0;
			}
			friends[count] = [friends[count], date, bucks];
			count++;
			getOnlineTimes(friends, count, options);
		});
	});
}

function showFriends(target, friends, self) {
	notifyStatus(target, status => {
		let output = "";
		output += "<div style=\"max-height: 150px; overflow-y: auto; overflow-x: hidden;\"><b>Buddies of " + Prime.nameColor(target, true) + " (" + friends.length + "):</b><br />";
		output += (status ? "(<i>does</i> get notified when buddies come online)" : "(<i>does NOT</i> get notified when buddies come online)");
		output += '<table border="1" cellspacing ="0" cellpadding="3">';
		output += "<tr><td><u>Name:</u></td><td><u>Last Seen:</u></td><td><u>Points:</u></td></tr>";

		for (let u in friends) {
			let seen = (friends[u][1] ? moment(friends[u][1]).format("MMMM Do YYYY, h:mm:ss A") + " EST. (" + moment(friends[u][1]).fromNow() + ")" : "<font color=\"red\">Never</font>");
			let thisdating = 0;
			let thisbff = 0;
			if (friends[u][0].endsWith(' (Dating)')) {
				friends[u][0] = friends[u][0].replace(" (Dating)","");
				thisdating = 1;
			} else if (friends[u][0].endsWith(' (Best Buddy)')) {
				friends[u][0] = friends[u][0].replace(" (Best Buddy)","");
				thisbff = 1;
			}
			friends[u][0] = Prime.nameColor(friends[u][0], true);
			if (Users(friends[u][0]) && Users(friends[u][0]).connected) seen = '<font color="green">Currently Online</font>';
			if (thisdating === 1) {
				friends[u][0] = friends[u][0] + ' <font color=#C07FCC>(Dating)</font>';
				thisdating = 0;
			} else if (thisbff === 1) {
				friends[u][0] = friends[u][0] + ' <font color=#993400>(Best Buddy)</font>';
				thisbff = 0;
			}
			output += "<tr><td><b>" + friends[u][0] + "</b></td><td>" + seen + "</td><td>" + friends[u][2] + "</td></tr>";
		}
		output += "</table>";

		getAdded(target, function (added) {
			if (added.length > 0) {
				output += "<button name=\"send\" value=\"/friendslist getadded " + toId(target) + "\">" + added.length +
				(added.length === 1 ? " user has" : " users have") + " added <b>" + target + "</b> to their buddy list.</button>";
			}
			self.sendReplyBox(output);
			self.room.update();
		});
	});
}

function friendsNotify(user, offline) {
	user = toId(user);
	Prime.database.all("SELECT userid FROM friends WHERE friend=$userid", {$userid: user}, function (err, rows) {
		if (err) return //console.log("friendsNotify: " + err);
		if (!Users(user) || !Users(user).connected) return;
		if (rows.length > 0) {
			for (let row in rows) {
				if (!Users(rows[row].userid) || !Users(rows[row].userid).connected) continue;
				let cooldown = (offline ? Users(user).notifyCooldownOffline : Users(user).notifyCooldown);
				if (cooldown && (Date.now() - cooldown) < 5 * 60 * 1000) continue;
				if (!offline) Users(user).notifyCooldown = Date.now();
				if (offline) Users(user).notifyCooldownOffline = Date.now();
				notifyStatus(rows[row].userid, function (status) {
					if (!status) return;
					Users(rows[row].userid).send('|pm|~BuddyList Notif|' + Users(rows[row].userid).getIdentity() + '|/raw ' + Prime.nameColor(user, true) +
					(offline ? ' has gone <font color="red">offline.</font>' : ' has come <font color="green">online.</font>'));
				});
			}
		}
	});
}
Prime.friendsNotify = friendsNotify;

exports.commands = {
	buddylist: 'friends',
	buddies: 'friends',
	buddy: 'friends',
	pals: 'friends',
	friendos: 'friends',
	friendslist: 'friends',
	friends: {
		'': 'list',
		view: 'list',
		list: function (target, room, user) {
			if (!this.runBroadcast()) return;
			if (!target) target = user.name;
			getFriends(target, friends => {
				if (!friends) {
					this.sendReplyBox(Prime.nameColor(target, true) + " has no buddies.");
					return room.update();
				}
				getOnlineTimes(friends, 0, [target, this]);
			});
		},

		add: function (target, room, user) {
			if (!target) return this.errorReply("Please specify a user to add.");
			let friend = toId(target);
			if (friend.length < 1) return this.errorReply("Please specify a valid username.");
			if (friend.length > 19) return this.errorReply("Usernames may not be longer than 19 characters.");
			if (friend === user.userid) return this.errorReply("This server doesn\'t support your narcissism.");

			Prime.database.all("SELECT * FROM friends WHERE userid=$userid", {$userid: user.userid}, (err, rows) => {
				if (err) return //console.log("/friend add (1): " + err);
				if (rows.length >= MAX_FRIENDS) return this.errorReply("You may not add more than " + MAX_FRIENDS + " buddies to your buddy list.");
				Prime.database.all("SELECT * FROM friends WHERE userid=$userid AND friend=$friend", {$userid: user.userid, $friend: friend}, (err, rows) => {
					if (err) return //console.log("/friend add (2): " + err);
					if (rows.length < 1) {
						Prime.database.run("INSERT INTO friends(userid, friend, bestfriend, dating) VALUES ($userid, $friend, 0, 0)", {$userid: user.userid, $friend: friend}, err => {
							if (err) return //console.log("/friend add (3): " + err);
							return this.sendReply("You've added " + friend + " to your buddy list.");
						});
					} else {
						return this.errorReply("This user has already been added to your buddy list.");
					}
				});
			});
		},
		bestfriend: 'bestbuddy',
		bestbuddy: function (target, room, user) {
			if (!target) return this.errorReply("Please specify a user to add.");
			let friend = toId(target);
			if (friend.length < 1) return this.errorReply("Please specify a valid username.");
			if (friend.length > 19) return this.errorReply("Usernames may not be longer than 19 characters.");
			if (friend === user.userid) return this.errorReply("This server doesn\'t support your narcissism.");

			Prime.database.all("SELECT * FROM friends WHERE userid=$userid", {$userid: user.userid}, (err, rows) => {
				if (err) return //console.log("/friend add (1): " + err);
				if (rows.length >= MAX_FRIENDS) return this.errorReply("You may not add more than " + MAX_FRIENDS + " buddies to your buddy list.");
				Prime.database.all("SELECT * FROM friends WHERE userid=$userid AND bestfriend=1", {$userid: user.userid}, (err, rows) => {
					if (rows.length >= MAX_BESTFRIENDS) return this.errorReply("You may not add more than " + MAX_BESTFRIENDS + " best buddies to your buddy list.");
					Prime.database.all("SELECT * FROM friends WHERE userid=$userid AND friend=$friend", {$userid: user.userid, $friend: friend}, (err, rows) => {
						if (err) return //console.log("/friend add (2): " + err);
						if (rows.length < 1) {
							Prime.database.run("INSERT INTO friends(userid, friend, bestfriend, dating) VALUES ($userid, $friend, 1, 0)", {$userid: user.userid, $friend: friend}, err => {
								if (err) return //console.log("/friend add (3): " + err);
								return this.sendReply("You've added " + friend + " as your best buddy.");
							});
						} else {
							Prime.database.all("SELECT * FROM friends WHERE userid=$userid AND friend=$friend AND bestfriend=1", {$userid: user.userid, $friend: friend}, (err, rows) => {
								if (rows.length < 1) {
									Prime.leaguedatabase.all("UPDATE friends SET bestfriend=1 WHERE userid=$userid AND friend=$friend", {$userid: user.userid, $friend: friend}, err => {
								if (err) return //console.log("/friend add (3): " + err);
								return this.sendReply("You've added " + friend + " as your best buddy.");
							});
								} else {
									return this.errorReply("This user is already marked as your best buddy.");
								}
							});
						}
					});
				});
			});
		},
		
		dating: function (target, room, user) {
			if (!target) return this.errorReply("Please specify a user to add.");
			let friend = toId(target);
			if (friend.length < 1) return this.errorReply("Please specify a valid username.");
			if (friend.length > 19) return this.errorReply("Usernames may not be longer than 19 characters.");
			if (friend === user.userid) return this.errorReply("This server doesn\'t support your narcissism.");

			Prime.database.all("SELECT * FROM friends WHERE userid=$userid", {$userid: user.userid}, (err, rows) => {
				if (err) return //console.log("/friend add (1): " + err);
				if (rows.length >= MAX_FRIENDS) return this.errorReply("You may not add more than " + MAX_FRIENDS + " buddies to your buddy list.");
				Prime.database.all("SELECT * FROM friends WHERE userid=$userid AND dating=1", {$userid: user.userid}, (err, rows) => {
					if (rows.length >= MAX_DATING) return this.errorReply("You may not add more than " + MAX_DATING + " romantic partner to your buddy list. Also, you\'re a terrible person.");
					Prime.database.all("SELECT * FROM friends WHERE userid=$userid AND friend=$friend", {$userid: user.userid, $friend: friend}, (err, rows) => {
						if (err) return //console.log("/friend add (2): " + err);
						if (rows.length < 1) {
							Prime.database.run("INSERT INTO friends(userid, friend, bestfriend, dating) VALUES ($userid, $friend, 0, 1)", {$userid: user.userid, $friend: friend}, err => {
								if (err) return //console.log("/friend add (3): " + err);
								return this.sendReply("You've added " + friend + " as your romantic partner.");
							});
						} else {
							Prime.database.all("SELECT * FROM friends WHERE userid=$userid AND friend=$friend AND dating=1", {$userid: user.userid, $friend: friend}, (err, rows) => {
								if (rows.length < 1) {
									Prime.leaguedatabase.all("UPDATE friends SET dating=1 WHERE userid=$userid AND friend=$friend", {$userid: user.userid, $friend: friend}, err => {
								if (err) return //console.log("/friend add (3): " + err);
								return this.sendReply("You've added " + friend + " as your romantic partner.");
							});
								} else {
									return this.errorReply("This user is already marked as your romantic partner.");
								}
							});
						}
					});
				});
			});
		},

		delete: 'remove',
		del: 'remove',
		rem: 'remove',
		remove: function (target, room, user) {
			if (!target) return this.errorReply("Please specify a user to remove from your buddy list.");
			let friend = toId(target);
			if (friend.length < 1) return this.errorReply("Please specify a valid username.");
			if (friend.length > 19) return this.errorReply("Usernames may not be longer than 19 characters.");

			Prime.database.all("SELECT * FROM friends WHERE userid=$userid AND friend=$friend", {$userid: user.userid, $friend: friend}, (err, rows) => {
				if (err) return //console.log("/friend del (1): " + err);
				if (rows.length < 1) {
					return this.errorReply("This user is not on your buddy list.");
				} else {
					Prime.database.run("DELETE FROM friends WHERE userid=$userid AND friend=$friend", {$userid: user.userid, $friend: friend}, err => {
						if (err) return //console.log("/friend del (2): " + err);
						return this.sendReply("This user has been removed from your buddy list.");
					});
				}
			});
		},

		removeall: 'clear',
		clear: function (target, room, user) {
			if (!user.confirmClearFriends) {
				user.confirmClearFriends = true;
				return this.errorReply("[BuddyMonitor] This will remove all buddies from your buddy list. If you are sure you want to do this, enter the command again.");
			}
			delete user.confirmClearFriends;
			Prime.database.run("DELETE FROM friends WHERE userid=$userid", {$userid: user.userid}, err => {
				if (err) return //console.log("/friends clear: " + err);
				return this.sendReply("Your buddy list has been cleared.");
			});
		},

		notify: function (target, room, user) {
			notifyStatus(user.userid, status => {
				let newStatus = (status ? 0 : 1);
				Prime.database.all("SELECT * FROM users WHERE userid=$userid", {$userid: user.userid}, (err, rows) => {
					if (err) return //console.log("/friends notify (1): " + err);
					if (rows.length < 1) {
						Prime.database.run("INSERT INTO users(userid, notifystatus) VALUES ($userid, $status)", {$userid: user.userid, $status: newStatus}, err => {
							if (err) return //console.log("/friends notify (2): " + err);
							return this.sendReply((newStatus === 1 ? "You will now be notified when your buddies come online." : "You will no longer be notified when your buddies come online."));
						});
					} else {
						Prime.database.run("UPDATE users SET notifyStatus=$status WHERE userid=$userid", {$status: newStatus, $userid: user.userid}, err => {
							if (err) return //console.log("/friends notify (3): " + err);
							return this.sendReply((newStatus === 1 ? "You will now be notified when your buddies come online." : "You will no longer be notified when your buddies come online."));
						});
					}
				});
			});
		},

		added: 'getadded',
		getadded: function (target, room, user) {
			if (!target) target = user.userid;
			if (!this.runBroadcast()) return;
			getAdded(target, users => {
				if (!users) {
					this.sendReplyBox("No one has added " + Prime.nameColor(target, true) + " to their buddy list.");
					room.update();
					return;
				}
				for (let u in users) {
					users[u] = '<button name="send" value="/friendslist list ' + users[u] + '">' + Prime.nameColor(users[u], true) + '</button>';
				}
				this.sendReplyBox("These users have added " + Prime.nameColor(target, true) + " to their buddy list:<br />" + users.join(''));
				room.update();
			});
		},

		help: function (target, room, user) {
			if (!this.runBroadcast()) return;
			this.sendReplyBox(
				"/buddylist add [user] - Adds a user to your buddy list. (Max " + MAX_FRIENDS + " per user)<br />" +
				"/buddylist bestfriend [user] - Adds a user to your buddy list as a best buddy. (Max " + MAX_BESTFRIENDS + " per user)<br />" +
				"/buddylist dating [user] - Adds a user to your buddy list as a romantic partner. (Max " + MAX_DATING + " per user)<br/>" +
				"/buddylist remove [user] - Removes a user from your buddy list.<br />" +
				"/buddylist clear - Clears your buddy list.<br />" +
				"/buddylist - Displays your friendslist.<br />" +
				"/buddylist view [user] - Displays another users buddy list.<br />" +
				"/buddylist added [user] - Shows whose added a user as a buddy to their buddy list.<br />" +
				"/buddylist notify - Toggles being notified or not when a buddy comes online (disabled by default).<br/>" +
				"Thanks for making this for me jd; you\'re a real friendo! -Lights"
			);
		},
	},
	friendshelp: 'friendslisthelp',
	friendslisthelp: function (target, room, user) {
		return this.parse("/friends help");
	},
};