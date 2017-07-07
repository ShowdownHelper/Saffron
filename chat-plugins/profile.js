'use strict'
/**************************************************
* Profile Overhaul for Pokemon Showdown by Lights *
**************************************************/

const moment = require('moment');
let serverIp = '149.56.131.9';

function getProfileOptions(userid, callback) {
	userid = Alts.getMain(userid);
	Prime.database.all("SELECT * FROM profile WHERE userid=$userid", {$userid: userid}, function (err, results) {
		if (results.length == 0) {
			Prime.database.run("INSERT INTO profile(userid, pbackground, pcolor, pcolor2, ppokemon1 , ppokemon2, ppokemon3, ppokemon4, ppokemon5, ppokemon6, pabout, leagues) VALUES ('"+userid+"','0','0','0','0','0','0','0','0','0','0','0')", function (err) {
				if (err) return console.log(err);
			});
		}	
	});
	setTimeout(function() {
		Prime.database.all("SELECT pbackground, pcolor, pcolor2, ppokemon1, ppokemon2, ppokemon3, ppokemon4, ppokemon5, ppokemon6, pabout, leagues FROM profile WHERE userid='"+userid+"'", function (err, results) {
			let background = 0;
			let color = 0;
			let color2 = 0;
			let pokemon = [];
			let about = 0;
			let leagues = 0;
			if (results[0].pbackground !== '0') {
				background = results[0].pbackground;
			}
			if (results[0].pcolor !== '0') {
				color = results[0].pcolor;
			}
			if (results[0].pcolor2 !== '0') {
				color2 = results[0].pcolor2;
			}
			if (results[0].ppokemon1 !== '0') {
				let poke1 = results[0].ppokemon1;
				let poke2 = ((results[0].ppokemon2 !== '0') ? results[0].ppokemon2 : false); 
				let poke3 = ((results[0].ppokemon3 !== '0') ? results[0].ppokemon3 : false);
				let poke4 = ((results[0].ppokemon4 !== '0') ? results[0].ppokemon4 : false);
				let poke5 = ((results[0].ppokemon5 !== '0') ? results[0].ppokemon5 : false);
				let poke6 = ((results[0].ppokemon6 !== '0') ? results[0].ppokemon6 : false);
				let arr = [poke1, poke2, poke3, poke4, poke5, poke6];
				for (let x in arr) {
					if (arr[x]) pokemon.push(arr[x]);
				}
			}
			if (results[0].pabout !== '0') {
				about = results[0].pabout;
			}
			if (results[0].leagues !== '0') {
				leagues = results[0].leagues.split('|');
				leagues.pop();
			}
			let arr = [background, color, color2, pokemon, about, leagues];
			if (callback) return callback(arr);
		});
	}, 100);
}
function hexToRgb(hex, callback) {
	if (!hex) return callback(false);
    //Expand shorthand to full form 
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
	//convert hex to rgba
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	//assemble the output
	let rgbObj;
    if (result) {
		rgbObj = {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16),
			a: '0.8'
    	};
	} else {
		rgbObj = {
			r: '100',
			g: '100',
			b: '100',
			a: '0.8'
		};
	}
	if (callback) return callback(rgbObj);
}

exports.commands = {

	profile: {
	
		'': 'view',
		view: function (target, room, user) {
			if (!target) target = user.name;
			if (toId(target).length > 19) return this.sendReply("Usernames may not be more than 19 characters long.");
			if (toId(target).length < 1) return this.sendReply(target + " is not a valid username.");
			let targetUser = Users.get(target);
			let username = (targetUser ? targetUser.name : target);
			let userid = toId(username);
			let avatar = (Config.customavatars[userid] ? "http://" + serverIp + ":" + Config.port + "/avatars/" + Config.customavatars[userid] : "http://play.pokemonshowdown.com/sprites/trainers/167.png");
			if (targetUser) {
				avatar = (isNaN(targetUser.avatar) ? "http://" + serverIp + ":" + Config.port + "/avatars/" + targetUser.avatar : "http://play.pokemonshowdown.com/sprites/trainers/" + targetUser.avatar + ".png");
			}
			let userSymbol = (Users.usergroups[userid] ? Users.usergroups[userid].substr(0, 1) : "Regular User");
			let userGroup = (Config.groups[userSymbol] ? Config.groups[userSymbol].name : "Regular User");
			let regdate = "(Unregistered)";
			let self = this;
			getProfileOptions(userid, options => {
				let background = ((options[0] !== 0) ? options[0] : false);
				let primaryColor = ((options[1] !== 0) ? options[1] : '646464');
				let secondaryColor = ((options[2] !== 0) ? options[2] : '6B2AC9');
				let team = ((options[3].length >= 1) ? options[3] : false);
				let aboutMe = ((options[4] !== 0) ? options[4] : false);
				let leagues = ((options[5] !== 0) ? options[5]: false);
				hexToRgb(primaryColor, rgb => {
					hexToRgb(secondaryColor, rgb1 => {
						hexToRgb(background, back => {
							Economy.readMoney(userid, bucks => {
								Prime.regdate(userid, date => {
									if (date) regdate = regdate = moment(date).format("MMMM DD, YYYY");
									Prime.lastSeen(userid, online => {
										Prime.getTitle(userid, title => {
											glevel.getProfileLevel(userid, level => {
												buddy.sendBack(userid, rgb, friends => {
													Prime.profileShowcase(userid, rgb, showcase => {
														showProfile(bucks, regdate, online, title, level, friends, showcase);
													});
												});
											});
										});
									});
								});
								function showProfile(bucks, regdate, lastOnline, title, level, friends, showcase) {
									lastOnline = (lastOnline ? moment(lastOnline).format("MMMM Do YYYY, h:mm:ss A") + ' EST. (' + moment(lastOnline).fromNow() + ')' : "Never");
									if (targetUser && targetUser.connected) lastOnline = '<font color=green>Currently Online</font>';
									let profile = '';
				/*mainDiv*/			profile += '<div style="' + ((background) ? 'background-color: rgba('+back.r+','+back.g+','+back.b+','+back.a+');' : '') + 'border: 2px solid; border-radius: 5px;">';
									profile += '<div style="float: left; border: 2px solid; border-radius: 5px; background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+'); height: 100px; width: 99.7%; overflow-y: scroll;"> <img src="' + avatar + '" height=80 width=80 align=left>';
									if (team) {
										profile += '<div style="float: right; padding: 5px;">';
										for (let q in team) {
											profile += '<img src="' + team[q] + '">';
										}
										profile += '</div>';
									}
									profile += '<div style="float: left; width: 40%">';
									profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Name: </font>' + Prime.nameColor(userid, true) + (title === "" ? "" : " (" + title + ")") + '<br />';
									profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Registered: </font></b>' + regdate + '<br />';
									profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Rank: </font></b>' + userGroup + '</b></font><br />';
									if (bucks) profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Points: </font></b>' + bucks + '<br />';
									profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Last Online: </font></b>' + lastOnline;
									profile += '</div></div><br clear="all"><br/>';
				/*subCells*/
									if (aboutMe) profile += '<div style="border: 2px solid; border-radius: 5px; background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+'); max-height: 100px;"><center><strong>About ' + Prime.nameColor(userid, true) + ':</strong><br/><br/>' + aboutMe + '<br/></center></div><br/>';
									profile += friends;
									//profile xp interace
									let xp = level[1];
									if (xp < 1) xp = 0;
									level = level[0];
									let levelArray = [0, 100, 190, 290, 480, 770, 1100, 1500, 2070, 2730, 3550, 4460, 5550, 6740, 8120, 9630, 11370, 13290, 15520, 18050, 21060, 24560, 28310, 32720, 37290, 42300, 47440, 52690, 58100, 63600, 69250, 75070, 81170, 87470, 93970, 100810, 107890, 115270, 122960, 131080, 140080];
									let currentLevelXp = levelArray[level];
									let nextLevelXp = levelArray[level + 1];
									let remainingXp = +nextLevelXp - +xp;
									if (xp == 0) remainingXp = 100;
									let val1 = +xp - +currentLevelXp;
									let val2 = +nextLevelXp - +currentLevelXp;
									let xpBarPercent = ((+val1 / +val2) * 100);
									let percent = xpBarPercent.toFixed(0);
									profile += '<div style="max-height: 300px; overflow-y: scroll; border: 2px solid; border-radius: 5px; background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+');">'
									if (level > 0) {
										let levelColor;
										if (level < 5) {
											levelColor = 'black';
										} else if (level === 5 || level === 6 || level === 7 || level === 8 || level === 9) {
											levelColor = '#43E86C';
										} else if (level === 10 || level === 11 || level === 12) {
											levelColor = '#66C1F2';
										} else if (level === 13 || level === 14 || level === 15 || level === 16) {
											levelColor = '#BA85FF';
										} else if (level === 17 || level === 18 || level === 19) {
											levelColor = '#FFCA38';
										} else {
											levelColor = '#FF1424';
										}
										profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Level: </font><font color=' + levelColor + '>' + level + '</font></b><br/>';
									} else {
										profile += '&nbsp;You need to gain 100 XP to reach level 1.<br/>';
									}
									profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Current XP: </font>' + xp + '</font></b><br/>';
									profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Remaining XP Needed: </font>' + (+remainingXp + +1) + '</font></b><br/>';
									profile += '&nbsp;<div style="background-color: rgba(0, 0, 0, 1); height: 20px; width: 400px; border: 2px solid; border-radius: 20px; margin-bottom: 0;"><div style="background-color: rgba('+rgb1.r+','+rgb1.g+','+rgb1.b+', .8); width: '+percent+'%; height: 16px; border: 2px solid; border-radius: 16px;"><center><b>'+percent+'%</b></center></div></div><br/>';
									profile += '</div><br/>';
									//profile card showcase
									profile += ((showcase) ? showcase : '');
									//profile league info
									/*
									if (leagues) { 
										let z = leagues.length;
										profile += '<br/><div style="max-height: 300px; overflow-y: scroll; border: 2px solid; border-radius: 5px; background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+');"><center><b>Leagues</b><br/><table border=0>';
										for (let j = 0; j < z; j++) {
											if (j > 3 && j % 4 === 0) profile += '</tr> <tr>';
											let displayName = leagues[j].charAt(0).toUpperCase() + leagues[j].slice(1);
											profile += '<td><button style="border: 2px solid #'+secondaryColor+'; border-radius: 15px 0px ; background: black ; color: white;" name="send" value="/profile league ' + userid + ', ' + leagues[j] + '">' + displayName + '</button></td>';
										}
										profile += '</table></center></div>';
									}
								*/
									profile += '</div>';
									setTimeout(function() {
										user.send('|popup||wide||html|' + profile);
										room.update();
									}, 150);
								}
							});
						});
					});
				});
			});
		},
		/*
		league: function (target, room, user) {
			let parts = target.split(',');
			target = parts[0].trim();
			let targetLeague = toId(parts[1]).trim();
			if (toId(target).length > 19) return this.sendReply("Usernames may not be more than 19 characters long.");
			if (toId(target).length < 1) return this.sendReply(target + " is not a valid username.");
			let targetUser = Users.get(target);
			let username = (targetUser ? targetUser.name : target);
			let userid = toId(username);
			let avatar = (Config.customavatars[userid] ? "http://" + serverIp + ":" + Config.port + "/avatars/" + Config.customavatars[userid] : "http://play.pokemonshowdown.com/sprites/trainers/167.png");
			if (targetUser) {
				avatar = (isNaN(targetUser.avatar) ? "http://" + serverIp + ":" + Config.port + "/avatars/" + targetUser.avatar : "http://play.pokemonshowdown.com/sprites/trainers/" + targetUser.avatar + ".png");
			}
			let userSymbol = (Users.usergroups[userid] ? Users.usergroups[userid].substr(0, 1) : "Regular User");
			let userGroup = (Config.groups[userSymbol] ? Config.groups[userSymbol].name : "Regular User");
			let regdate = "(Unregistered)";
			let self = this;
			getProfileOptions(userid, options => {
				let background = ((options[0] !== 0) ? options[0] : false);
				let primaryColor = ((options[1] !== 0) ? options[1] : '646464');
				let secondaryColor = ((options[2] !== 0) ? options[2] : '6B2AC9');
				let team = ((options[3].length >= 1) ? options[3] : false);
				let aboutMe = ((options[4] !== 0) ? options[4] : false);
				let leagues = ((options[5] !== 0) ? options[5] : false);
				if (leagues) {
					hexToRgb(primaryColor, rgb => {
						hexToRgb(secondaryColor, rgb1 => {
							hexToRgb(background, back => {
								league.getLeagueName(userid, leagueOutput => {
									let userLeagueList = [];
									for (let q = 0; q < leagueOutput.length; q++) {
										let league = toId(leagueOutput[q]);
										userLeagueList.push(league);
									}
									if (userLeagueList.indexOf(targetLeague) !== -1) {
										let leagueName = targetLeague;
										leagueName = leagueName.trim().toLowerCase();
										leagueName = leagueName.charAt(0).toUpperCase() + leagueName.slice(1);
										league.getProfileInfo(userid, leagueName, profileInfo => {
											Prime.leaguedatabase.all("SELECT name FROM sqlite_master WHERE type='table' AND name like '%UserInfo'", function (err, tableNames) {
												for (let i = 0; i < tableNames.length; i++){
													Prime.leaguedatabase.all("SELECT LeagueName FROM "+tableNames[i].name+" WHERE UserId='LeagueName'", function (err, results){
														if(results.length > 0){
															let checkedName = toId(results[0].LeagueName);
															checkedName = checkedName.trim().toLowerCase();
															checkedName = checkedName.charAt(0).toUpperCase() + checkedName.slice(1);
															if(checkedName == leagueName) {
																let tableName = tableNames[i].name.replace("UserInfo", "Settings");
																Prime.leaguedatabase.all("SELECT * FROM "+tableName+"", function (err, results) {
																	let badgeReq = results[0].BadgeReq;
																	let frontier = results[0].Frontier;
																	let frontierBadgeReq = results[0].FrontierBadgeReq;
																	let frontierMax = results[0].FrontierMax;
																	let e4badges = results[0].E4Badges;
																	let e4BadgeReq = results[0].E4BadgeReq;
																	let e4Max = results[0].E4Max;
																	let factions = results[0].Factions;
																	let factionsEnabled = false;
																	let factionName;
																	let memFactionName;
																	if (factions > 1) factionsEnabled = true;
																	let challType = profileInfo.challengeInfo.misc.chall;
																	let challFac = false;
																	let memFac = false;
																	if (factionsEnabled) {
																		challFac = profileInfo.challengeInfo.misc.challFac;
																		let num = +challFac + +8;
																		factionName = results[num];
																		memFac = profileInfo.membershipInfo.faction;
																		num = +memFac + +8;
																		memFactionName = results[num];
																	}
																	tableName = tableName.replace("Settings", "BadgeData");
																	league.getBadgeData(challType, factionsEnabled, tableName, challFac, badgeData => {
																		tableName = tableName.replace("BadgeData", "LeagueAuth");
																		let level = profileInfo.membershipInfo.leagueRank;
																		Prime.leaguedatabase.all("SELECT RankName, Badges FROM "+tableName+" WHERE Level="+level+"", function (err, data) {
																			let rankName = false;
																			let needsType = false;
																			let typeVar = false;
																			if (data.length > 0) {
																				rankName = data[0].RankName;
																				typeVar = data[0].Badges;
																				if (typeVar === 1 || typeVar === 3) {
																					needsType = true;
																				}
																			}
																			Economy.readMoney(userid, bucks => {
																				Prime.regdate(userid, date => {
																					if (date) regdate = regdate = moment(date).format("MMMM DD, YYYY");
																					Prime.lastSeen(userid, online => {
																						Prime.getTitle(userid, title => {
																							showProfile(bucks, regdate, online, title);
																						});
																					});
																				});
																			});
																			function showProfile(bucks, regdate, lastOnline, title) {
																				lastOnline = (lastOnline ? moment(lastOnline).format("MMMM Do YYYY, h:mm:ss A") + ' EST. (' + moment(lastOnline).fromNow() + ')' : "Never");
																				if (targetUser && targetUser.connected) lastOnline = '<font color=green>Currently Online</font>';
																				let profile = '';
																				profile += '<div style="' + ((background) ? 'background-color: rgba('+back.r+','+back.g+','+back.b+','+back.a+');' : '') + 'border: 2px solid; border-radius: 5px;">';
																				profile += '<div style="float: left; border: 2px solid; border-radius: 5px; background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+'); height: 100px; width: 99.7%; overflow-y: scroll;"> <img src="' + avatar + '" height=80 width=80 align=left>';
																				if (team) {
																					profile += '<div style="float: right; padding: 5px;">';
																					for (let q in team) {
																						profile += '<img src="' + team[q] + '">';
																					}
																					profile += '</div>';
																				}
																				profile += '<div style="float: left; width: 40%">';
																				profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Name: </font>' + Prime.nameColor(userid, true) + (title === "" ? "" : " (" + title + ")") + '<br />';
																				profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Registered: </font></b>' + regdate + '<br />';
																				profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Rank: </font></b>' + userGroup + (Users.councilMembers[userid] ? ' (<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Monotype Council Member</b></font>)' : '') + '<br />';
																				if (bucks) profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Points: </font></b>' + bucks + '<br />';
																				profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Last Online: </font></b>' + lastOnline;
																				profile += '</div></div><br clear="all">';
																				if (rankName){
																					profile += '<br/><div style="' + ((background) ? 'background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+');' : '') + 'border: 2px solid; border-radius: 5px;"><center><strong><font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;">Membership Info</font></strong></center><br/>';
																					profile += (needsType) ? '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Rank: </b></font>' + rankName + '<br/><font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Type: </b></font>' + profileInfo.membershipInfo.leagueType + '</center><br/>' : '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Rank: </b></font>' + rankName + '<br/>';
																					if (factionsEnabled && profileInfo.membershipInfo.faction !== 0 && profileInfo.membershipInfo.leagueType !== 'NULL') profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Faction: </b></font>' + memFactionName + '<br/>';
																					profile += '<br/></div>';
																				}
																				if (badgeData) {
																					profile += '<br/><div style="' + ((background) ? 'background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+');' : '') + 'border: 2px solid; border-radius: 5px;"><center><strong><font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;">Challenger Info</font></strong></center><br/>';
																					let challvar;
																					if (challType === 1) {
																						challvar = 'Main';
																					} else if (challType === 2) {
																						challvar = 'Side';
																					} else {
																						challvar = 'Elite';
																					}
																					profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Challenging: </b></font>' + challvar + '<br/>';
																					if (challType !== 2 && factionsEnabled) {
																						profile += '&nbsp;<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Faction: </b></font>' + factionName + '<br/>';
																					}
																					profile += '<br/></div>';
																					profile += '<br/><div style="' + ((background) ? 'background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+');' : '') + 'border: 2px solid; border-radius: 5px;"><center><strong><font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Registered Team</b></font></strong><br/><br/><table border=0>';
																					let challTeam = [profileInfo.challengeInfo.team.poke1, profileInfo.challengeInfo.team.poke2, profileInfo.challengeInfo.team.poke3, profileInfo.challengeInfo.team.poke4, profileInfo.challengeInfo.team.poke5, profileInfo.challengeInfo.team.poke6];
																					let spriteArray = [];
																					for (let z = 0; z < 6; z++) {
																						let pokeName = challTeam[z];
																						league.getSprite(pokeName, spriteUrl => {
																							spriteArray.push(spriteUrl);
																						});
																					}
																					for (let q = 0; q < 6; q++) {
																						profile += '<td style="vertical-align: bottom;"><center><img src="' + spriteArray[q] + '"></center></td>';
																					}
																					profile += '<tr>';
																					for (let w = 0; w < 6; w++) {
																						profile += '<td style="padding: 10px;"><center><b>' + challTeam[w] + '</b></center></td>';
																					}
																					profile += '</table></center><br/></div>';
																					let ownedBadges = [];
																					let mainBadges = [];
																					let badgeArr = [];
																					if (challType === 1) {
																						badgeArr = [profileInfo.challengeInfo.badges.main.normal, profileInfo.challengeInfo.badges.main.fire, profileInfo.challengeInfo.badges.main.fighting, profileInfo.challengeInfo.badges.main.water, profileInfo.challengeInfo.badges.main.flying, profileInfo.challengeInfo.badges.main.grass, profileInfo.challengeInfo.badges.main.poison, profileInfo.challengeInfo.badges.main.electric, profileInfo.challengeInfo.badges.main.ground, profileInfo.challengeInfo.badges.main.psychic, profileInfo.challengeInfo.badges.main.rock, profileInfo.challengeInfo.badges.main.ice, profileInfo.challengeInfo.badges.main.bug, profileInfo.challengeInfo.badges.main.dragon, profileInfo.challengeInfo.badges.main.ghost, profileInfo.challengeInfo.badges.main.dark, profileInfo.challengeInfo.badges.main.steel, profileInfo.challengeInfo.badges.main.fairy];
																						for (let i = 0; i < 18; i++) {
																							if (badgeArr[i] === 1) {
																								ownedBadges.push(badgeData[i]);
																							}
																						}
																					} else if (challType === 2) {
																						badgeArr = [profileInfo.challengeInfo.badges.side.side1, profileInfo.challengeInfo.badges.side.side2, profileInfo.challengeInfo.badges.side.side3, profileInfo.challengeInfo.badges.side.side4, profileInfo.challengeInfo.badges.side.side5, profileInfo.challengeInfo.badges.side.side6, profileInfo.challengeInfo.badges.side.side7, profileInfo.challengeInfo.badges.side.side8, profileInfo.challengeInfo.badges.side.side9, profileInfo.challengeInfo.badges.side.side10]
																						for (let i = 0; i < 10; i++) {
																							if (badgeArr[i] === 1) {
																								ownedBadges.push(badgeData[i]);
																							}
																						}
																					} else if (challType === 3) {
																						badgeArr = [profileInfo.challengeInfo.badges.main.normal, profileInfo.challengeInfo.badges.main.fire, profileInfo.challengeInfo.badges.main.fighting, profileInfo.challengeInfo.badges.main.water, profileInfo.challengeInfo.badges.main.flying, profileInfo.challengeInfo.badges.main.grass, profileInfo.challengeInfo.badges.main.poison, profileInfo.challengeInfo.badges.main.electric, profileInfo.challengeInfo.badges.main.ground, profileInfo.challengeInfo.badges.main.psychic, profileInfo.challengeInfo.badges.main.rock, profileInfo.challengeInfo.badges.main.ice, profileInfo.challengeInfo.badges.main.bug, profileInfo.challengeInfo.badges.main.dragon, profileInfo.challengeInfo.badges.main.ghost, profileInfo.challengeInfo.badges.main.dark, profileInfo.challengeInfo.badges.main.steel, profileInfo.challengeInfo.badges.main.fairy, profileInfo.challengeInfo.badges.elite.normal, profileInfo.challengeInfo.badges.elite.fire, profileInfo.challengeInfo.badges.elite.fighting, profileInfo.challengeInfo.badges.elite.water, profileInfo.challengeInfo.badges.elite.flying, profileInfo.challengeInfo.badges.elite.grass, profileInfo.challengeInfo.badges.elite.poison, profileInfo.challengeInfo.badges.elite.electric, profileInfo.challengeInfo.badges.elite.ground, profileInfo.challengeInfo.badges.elite.psychic, profileInfo.challengeInfo.badges.elite.rock, profileInfo.challengeInfo.badges.elite.ice, profileInfo.challengeInfo.badges.elite.bug, profileInfo.challengeInfo.badges.elite.dragon, profileInfo.challengeInfo.badges.elite.ghost, profileInfo.challengeInfo.badges.elite.dark, profileInfo.challengeInfo.badges.elite.steel, profileInfo.challengeInfo.badges.elite.fairy];
																						for (let i = 0; i < 36; i++) {
																							if (i < 18) {
																								if (badgeArr[i] === 1) {
																									mainBadges.push(badgeData[i]);
																								}
																							} else {
																								if (badgeArr[i] === 1) {
																									ownedBadges.push(badgeData[i]);
																								}
																							}
																						}
																					}
																					if (ownedBadges.length > 0) {
																						profile += '<br/><div style="' + ((background) ? 'background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+');' : '') + 'border: 2px solid; border-radius: 5px;"><center><strong><font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>League Badges</b></font></strong><br/>';
																						if (challType === 1) {
																							profile += '<br/><center><table border=0>';
																							for (let q = 0; q < ownedBadges.length; q++) {
																								if (q !== 0 && q % 8 === 0) profile += '</table><table border=0>';
																								profile += '<td><center>' + ownedBadges[q][1] + '<br/>' + ownedBadges[q][0] + '<br/><img src="' + ownedBadges[q][2] + '" height="40" width="40"></td>';
																							}
																							profile += '</table>';
																						} else if (challType === 2) {
																							profile += '<br/><center><table border=0>';
																							for (let q = 0; q < ownedBadges.length; q++) {
																								if (q !== 0 && q % 5 === 0) profile += '</table><table border=0>';
																								profile += '<td><center>' + ownedBadges[q][1] + '<br/>' + ownedBadges[q][0] + '<br/><img src="' + ownedBadges[q][2] + '" height="40" width="40"></td>';
																							}
																							profile += '</table>';
																						} else if (challType === 3) {
																							profile += '<font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><b>Main</b><br/></font><center><table border=0>';
																							for (let q = 0; q < mainBadges.length; q++) {
																								if (q !== 0 && q % 8 === 0) profile += '</table><table border=0>';
																								profile += '<td><center>' + mainBadges[q][1] + '<br/>' + mainBadges[q][0] + '<br/><img src="' + mainBadges[q][2] + '" height="40" width="40"></td>';
																							}
																							profile += '</table></center><font color=#'+secondaryColor+' style="text-shadow: 1px 1px 0 #000;"><br/><b>Elite</b><br/></font><center><table border=0>';
																							for (let q = 0; q < ownedBadges.length; q++) {
																								if (q !== 0 && q % 8 === 0) profile += '</table><table border=0>';
																								profile += '<td><center>' + ownedBadges[q][1] + '<br/>' + ownedBadges[q][0] + '<br/><img src="' + ownedBadges[q][2] + '" height="40" width="40"></td>';
																							}
																							profile += '</table><br/>';
																						}
																						profile += '</div>';
																					}
																					profile += '</center>';
																				}
																				profile += '<br/><div style="' + ((background) ? 'background-color:rgba('+rgb.r+','+rgb.g+','+rgb.b+','+rgb.a+');' : '') + 'border: 2px solid; border-radius: 5px;"><br/><center><button style="border: 2px solid #'+secondaryColor+'; border-radius: 15px 0px ; background: black ; color: white;" name="send" value="/profile view ' + userid + '">Main Profile</button><br/><br/></div></div>';
																				setTimeout(function() {
																					user.send('|popup||wide||html|' + profile);
																					room.update();
																				}, 250);
																			}
																		});
																	});
																});
															}
														}
													});
												}
											});
										});
									} else self.sendReply("This user is not in this league.");
								});
							});
						});
					});
				} else return self.sendReply("This user is not in any leagues.");
			});
		},
		*/
		
		mini: function (target, room, user) {
			if (!target) target = user.name;
			if (toId(target).length > 19) return this.sendReply("Usernames may not be more than 19 characters long.");
			if (toId(target).length < 1) return this.sendReply(target + " is not a valid username.");
			if (!this.runBroadcast()) return;
			let targetUser = Users.get(target);
			let username = (targetUser ? targetUser.name : target);
			let userid = toId(username);
			let avatar = (Config.customavatars[userid] ? "http://" + serverIp + ":" + Config.port + "/avatars/" + Config.customavatars[userid] : "http://play.pokemonshowdown.com/sprites/trainers/167.png");
			if (targetUser) {
				avatar = (isNaN(targetUser.avatar) ? "http://" + serverIp + ":" + Config.port + "/avatars/" + targetUser.avatar : "http://play.pokemonshowdown.com/sprites/trainers/" + targetUser.avatar + ".png");
			}
			let badges = () => {
				let badges = Db('userBadges').get(userid);
				let css = 'border:none;background:none;padding:0;';
				if (typeof badges !== 'undefined' && badges !== null) {
					let output = ' <table style="' + css + '"> <tr>';
					for (let i = 0; i < badges.length; i++) {
						if (i !== 0 && i % 4 === 0) output += '</tr> <tr>';
						output += '<td><button style="' + css + '" name="send" value="/badges info, ' + badges[i] + '">' +
						'<img src="' + Db('badgeData').get(badges[i])[1] + '" height="16" width="16" alt="' + badges[i] + '" title="' + badges[i] + '" >' + '</button></td>';
					}
					output += '</tr> </table>';
					return output;
				}
				return '';
			};

			let userSymbol = (Users.usergroups[userid] ? Users.usergroups[userid].substr(0, 1) : "Regular User");
			let userGroup = (Config.groups[userSymbol] ? Config.groups[userSymbol].name : "Regular User");
			let regdate = "(Unregistered)";
			let friendCode = Db('friendcodes').has(userid) ? Db('friendcodes').get(userid) : false;
			Economy.readMoney(userid, bucks => {
				Prime.regdate(userid, date => {
					if (date) regdate = regdate = moment(date).format("MMMM DD, YYYY");
					Prime.lastSeen(userid, online => {
						Prime.getTitle(userid, title => {
							glevel.getProfileLevel(userid, level => {
								showProfile(bucks, regdate, online, title, level);
							});
						});
					});
				});
				let self = this;
				function showProfile(bucks, regdate, lastOnline, title, level) {
					lastOnline = (lastOnline ? moment(lastOnline).format("MMMM Do YYYY, h:mm:ss A") + ' EST. (' + moment(lastOnline).fromNow() + ')' : "Never");
					if (targetUser && targetUser.connected) lastOnline = '<font color=green>Currently Online</font>';
					let profile = '';
					profile += '<div style="float: left; border: 2px solid #A53DC4; height: 100px; width: 99.5%"> <img src="' + avatar + '" height=80 width=80 align=left>';
					profile += '<div style="float: left; width: 80%">';
					profile += '&nbsp;<font color=#6B2AC9><b>Name: </font>' + Prime.nameColor(userid, true) + (title === "" ? "" : " (" + title + ")") + '<br />';
					level = level[0];
					if (level > 0) {
						let levelColor;
						if (level < 5) {
							levelColor = '#B8B8B8';
						} else if (level === 5 || level === 6 || level === 7 || level === 8 || level === 9) {
							levelColor = '#43E86C';
						} else if (level === 10 || level === 11 || level === 12) {
							levelColor = '#66C1F2';
						} else if (level === 13 || level === 14 || level === 15 || level === 16) {
							levelColor = '#BA85FF';
						} else if (level === 17 || level === 18 || level === 19) {
							levelColor = '#FFCA38';
						} else {
							levelColor = '#FF1424';
						}
						profile += '&nbsp;<font color=#6B2AC9><b>Level: </font><font color=' + levelColor + '>' + level + '</font></b><br/> ';
					}
					profile += '&nbsp;<font color=#6B2AC9><b>Registered: </font></b>' + regdate + '<br />';
					profile += '&nbsp;<font color=#6B2AC9><b>Rank: </font></b>' + userGroup + '</b></font><br />';
					if (bucks) profile += '&nbsp;<font color=#6B2AC9><b>Points: </font></b>' + bucks + '<br />';
					profile += '&nbsp;<font color=#6B2AC9><b>Last Online: </font></b>' + lastOnline;
					profile += '</div><img src="http://cdn.bulbagarden.net/upload/thumb/7/72/708Phantump.png/250px-708Phantump.png" height="80" width="80"></div>';
					profile += '<br clear="all">';
					self.sendReplyBox(profile);
					room.update();
				}
			});
		},
		
		edit: function(target, room, user) {
			if (!target) return this.parse('/profile help');
			let userid = user.userid;
			let self = this;
			Prime.database.all("SELECT * FROM profile WHERE userid='"+userid+"'", function (err, results) {
				if (results.length === 0) {
					Prime.database.run("INSERT INTO profile(userid, pbackground, pcolor, pcolor2, ppokemon1, ppokemon2, ppokemon3, ppokemon4, ppokemon5, ppokemon6, pabout) VALUES ('"+userid+"','0','0','0','0','0','0','0','0','0','0')");
				}
			});
			let parts = target.split('|');
			if (parts.length < 2) return this.parse('/profile help');
			let element = toId(parts[0]);
			let newValue;
			if (parts.length === 2) newValue = parts[1].trim();
			let acceptedValues = ['background', 'primarycolor', 'secondarycolor', 'team', 'about'];
			glevel.readXp(userid, xp => {
				let pass = false;
				let levelPass = false;
				if (acceptedValues.indexOf(element) === -1) {
					this.sendReply("You must specify a valid element to edit: " + acceptedValues);
				} else {
					switch(element) {
						case 'background':
							if (xp >= 3550) levelPass = true;
							if (parts.length !== 2) return this.parse('/profile help');
							if (!user.can('lock') && !levelPass) return self.sendReply("/profile edit - Access Denied");
							if (newValue.length < 8) {
								Prime.database.run('UPDATE profile SET pbackground="'+newValue+'" WHERE userid="'+userid+'"');
								return self.sendReply("Background hex set to: " + newValue);
							} else {
								return self.sendReply("You must specify a valid Hex color (example: #000000)");
							}
							break;
						case 'primarycolor':
							if (xp >= 5550) levelPass = true;
							if (parts.length !== 2) return this.parse('/profile help');
							if (!user.can('lock') && !levelPass) return self.sendReply("/profile edit - Access Denied");
							if (newValue.length < 8) {
								Prime.database.run('UPDATE profile SET pcolor="'+newValue+'" WHERE userid="'+userid+'"');
								return self.sendReply("Primary color hex set to: " + newValue);
							} else {
								return self.sendReply("You must specify a valid Hex color (example: #000000)");
							}
							break;
						case 'secondarycolor':
							if (xp >= 5550) levelPass = true;
							if (parts.length !== 2) return this.parse('/profile help');
							if (!user.can('lock') && !levelPass) return self.sendReply("/profile edit - Access Denied");
							if (newValue.length < 8) {
								Prime.database.run('UPDATE profile SET pcolor2="'+newValue+'" WHERE userid="'+userid+'"');
								return self.sendReply("Secondary color hex set to: " + newValue);
							} else {
								return self.sendReply("You must specify a valid Hex color (example: #000000)");
							}
							break;
						case 'team':
							if (parts.length > 7) return this.parse('/profile help');
							if (xp >= 2070) levelPass = true;
							if (!user.can('lock') && !levelPass) return self.sendReply("/profile edit - Access Denied");
							let replyMsg = "Team set to:";
							let clear = false;
							let length = parts.length;
							for (let x = 1; x < length; x++) {
								let pokeName = parts[x].trim();
								if (pokeName == 'clear') clear = true;
								let column = 'ppokemon' + x;
								if (!clear) {
									Prime.validatePoke(pokeName, self, pokeid => {
										Prime.getSprite(pokeid, spriteUrl => {
											Prime.database.run('UPDATE profile SET '+column+'="'+spriteUrl+'" WHERE userid="'+userid+'"');
											if (x !== (parts.length - 1)) {
												replyMsg += " " + pokeid + ",";
											} else replyMsg += " " + pokeid + ".";
										});
									});
								} else {
									length = x;
									Prime.database.run("UPDATE profile SET ppokemon1=$p1, ppokemon2=$p2, ppokemon3=$p3, ppokemon4=$p4, ppokemon5=$p5, ppokemon6=$p6 WHERE userid=$userid", {$p1: '1', $p2: '1', $p3: '1', $p4: '1', $p5: '1', $p6: '1', $userid: userid});
								}
							}
							return self.sendReply(replyMsg);
							break;
						case 'about':
							if (xp >= 290) levelPass = true;
							if (parts.length !== 2) return this.parse('/profile help');
							if (newValue.length < 501) pass = true;
							newValue.replace("'", "/'");
							newValue.replace('"', '/"');
							if (!user.can('lock') && !levelPass) return self.sendReply("/profile edit - Access Denied");
							if (!pass) return self.sendReply("About me cannot be longer than 500 characters.");
							Prime.database.run('UPDATE profile SET pabout="'+newValue+'" WHERE userid="'+userid+'"');
							return self.sendReply("About set to: " + newValue);
							break;
					}
				}
			});
		},
		
		help: function(target, room, user) {
			if (!this.canBroadcast) return false;
			return this.sendReplyBox(
				"/profile view [user] - Displays the profile of the user. Not recommended for mobile displays. if you wish to view your profile, simply use /profile.<br />" +
				"/profile mini [user] - Displays the mini profile of a user.<br/>" +
				"/profile edit [element]| [new value] - Allows you to Customize your profile. The following things can be changed:<br/>" +
				"[unlocked at level 3] --- about - Lets you change the text in the second panel of your profile. Character limit of 500 characters.<br/>" +
				"[unlocked at level 8] --- team - Lets you change the Pokemon in the top right corner of your profile. May choose between 1 and 6. Must be valid Pokemon names.<br/>" +
				"Example of the correct command when setting multiple Pokemon: `/profile edit team| Bulbasaur| Charmander| Squirtle`.<br/>" +
				"To remove the Team from your profile, use: `/profile edit team| clear`.<br/>" +
				"[unlocked at Level 10] --- background - Lets you change the background of your profile. You must specify a valid hex color (example: #000000)<br/>" +
				"[unlocked at level 12] --- primarycolor - Lets you change the primary color of your profile. You must specify a valid hex color (example: #000000)<br/>" +
				"[unlocked at level 12] --- secondarycolor - Lets you change the secondary color of your profile. You must specify a valid hex color (example: #000000)<br/>" +
				"Profile overhaul by Lights."
			);
		},
	},
};