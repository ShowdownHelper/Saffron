// Code by Legacy Saffron.

'strict mode';

// fs? More like ffs
const fs = require('fs');
const sqlite3 = require('sqlite3');
const moment = require('moment');

//    The
const Legacy = new sqlite3.Database('./databases/Legacy.db');
const Leagues = new sqlite3.Database('./databases/Leagues.db');

const Gangs = new sqlite3.Database('./databases/Gangs.db');
const Guilds = new sqlite3.Database('./databases/Guilds.db');

// Alliteration is Amazing

Legacy.serialize(function() {
		Legacy.run("CREATE TABLE if not exists Users (userid TEXT, lover TEXT, platinum INTEGER, gold INTEGER, silver INTEGER, copper INTEGER, league TEXT, gang TEXT, guild TEXT, lastseen INTEGER, title TEXT)");
		Legacy.run("CREATE TABLE if not exists Leagues (name TEXT, members INTEGER, prestige INTEGER, cobalt INTEGER, colour1 TEXT, colour2 TEXT, colour3 TEXT, logo TEXT, logoheight INTEGER, logowidth INTEGER, background TEXT, desc TEXT)");
		Legacy.run("CREATE TABLE if not exists Gangs (name TEXT, members INTEGER, power INTEGER, territory INTEGER)");
		Legacy.run("CREATE TABLE if not exists Guilds (name TEXT, members INTEGER, rep INTEGER, iridium INTEGER)");
});

class Guild {
		constructor(name, owner) {
			this.name = name;
			this.owner = owner;
		}
  
		create() {
			Guilds.serialize(function() {
				Guilds.run("CREATE TABLE if not exists " + this.name + " (userid TEXT, rank TEXT, rep INTEGER)");
				Guilds.run("INSERT INTO " + this.name + " (userid, rank, rep, iridium) VALUES (" + this.owner + ", Owner, 100, 0)");
			});
			Legacy.run("INSERT INTO Guilds (name, members, rep) VALUES (" + this.name + ", 1, 100)");
		}
}

class League extends Guild {
  
		create() {
			Leagues.serialize(function() {
				Leagues.run("CREATE TABLE if not exists " + this.name + " (userid TEXT, rank TEXT, honour INTEGER)");
				Leagues.run("INSERT INTO " + this.name + " (userid, rank, honour) VALUES (" + this.owner + ", Owner, 100)");
				});
				Legacy.run("INSERT INTO Leagues (name, members, prestige, cobalt, colour1, colour2, colour3, logo, logoheight, logowidth, background, desc) VALUES (" + this.name + ", 1, 100, 0, '#353535', '#828282', '#dddddd', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Logos.svg/1200px-Logos.svg.png', 90, 350, 'https://www.transparenttextures.com/patterns/wood.png', 'This league doesn't have a description yet.')");
		}
}

class Gang extends Guild {
  
		create() {
			Gangs.serialize(function() {
				Gangs.run("CREATE TABLE if not exists " + this.name + " (userid TEXT, rank TEXT, influence INTEGER)");
				Gangs.run("INSERT INTO " + this.name + " (userid, rank, influence) VALUES (" + this.owner + ", Boss, 100)");
			});
		Legacy.run("INSERT INTO Gangs (name, members, power, territory) VALUES (" + this.name + ", 1, 0, 0)");
			}
}
