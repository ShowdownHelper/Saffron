// Code by Legacy Saffron. Note of appreciation for Light's help with a few bits.

'strict mode';

const fs = require('fs');
const sqlite3 = require('sqlite3');
const moment = require('moment');

let serverIp = '144.217.82.98';

const Legacy = new sqlite3.Database('./databases/Legacy.db');

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
    Legacy.serialize(function() {
    	Legacy.run("CREATE TABLE if not exists $name (userid TEXT, rank TEXT, rep INTEGER)", {$name: this.name}, (err) => { if (err) console.log(`MakeGuild Error: ${err}`)});
	Legacy.run("INSERT INTO $name  (userid, rank, rep, iridium) VALUES ($owner, Owner, 100, 0)", {$name: this.name, $owner: this.owner}, (err) => { if (err) console.log(`MakeGuild Error: ${err}`)});
    });
    Legacy.run("INSERT INTO Guilds (name, members, rep) VALUES ($name, 1, 100)", {$name: this.name}, (err) => { if (err) console.log(`MakeGuild Error: ${err}`)});
  }
}

class League extends Guild {
  constructor(name, owner) { super(name, owner); }
  create() {
    Legacy.serialize(function() {
    	Legacy.run("CREATE TABLE if not exists $name (userid TEXT, rank TEXT, honour INTEGER)", {$name: this.name}, (err) => { if (err) console.log(`MakeLeague Error: ${err}`)});
	Legacy.run("INSERT INTO $name (userid, rank, honour) VALUES ($owner, Owner, 100)", {$name: this.name, $owner: this.owner}, (err) => { if (err) console.log(`MakeLeague Error: ${err}`)});
    });
    Legacy.run("INSERT INTO Leagues (name, members, prestige, cobalt, colour1, colour2, colour3, logo, logoheight, logowidth, background, desc) VALUES ($name, 1, 100, 0, '#353535', '#828282', '#dddddd', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Logos.svg/1200px-Logos.svg.png', 90, 350, 'https://www.transparenttextures.com/patterns/wood.png', 'This league doesn't have a description yet.')", {$name: this.name}, (err) => { if (err) console.log(`MakeLeague Error: ${err}`)});
  }
}

class Gang extends Guild {
  constructor(name, owner) { super(name, owner); }
  create() {
    Legacy.serialize(function() {
    	Legacy.run("CREATE TABLE if not exists $name (userid TEXT, rank TEXT, influence INTEGER)", {$name: this.name}, (err) => { if (err) console.log(`MakeGang Error: ${err}`)});
	Legacy.run("INSERT INTO $name (userid, rank, influence) VALUES ($owner, Boss, 100)", {$name: this.name, $owner: this.owner}, (err) => { if (err) console.log(`MakeLeague Error: ${err}`)});
    });
  Legacy.run("INSERT INTO Gangs (name, members, power, territory) VALUES ($name, 1, 0, 0)", {$name: this.name}, (err) => { if (err) console.log(`MakeGang Error: ${err}`)});
  }
}
