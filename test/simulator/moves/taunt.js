'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Taunt', function () {
	afterEach(function () {
		battle.destroy();
	});

	it('should prevent the target from using Status moves and disable them', function () {
		battle = common.createBattle();
		battle.join('p1', 'Guest 1', 1, [{species: 'Sableye', ability: 'prankster', moves: ['taunt']}]);
		battle.join('p2', 'Guest 2', 1, [{species: 'Chansey', ability: 'naturalcure', moves: ['calmmind']}]);
		battle.commitDecisions();
		assert.strictEqual(battle.p2.active[0].boosts['spa'], 0);
		assert.strictEqual(battle.p2.active[0].boosts['spd'], 0);
		battle.commitDecisions();
		assert.strictEqual(battle.p2.active[0].lastMove, 'struggle');
	});

	it('should not prevent the target from using Z-Powered Status moves', function () {
		battle = common.createBattle();
		battle.join('p1', 'Guest 1', 1, [{species: 'Sableye', ability: 'prankster', moves: ['taunt']}]);
		battle.join('p2', 'Guest 2', 1, [{species: 'Charmander', ability: 'blaze', item: 'firiumz', moves: ['sunnyday']}]);
		battle.p2.chooseMove('sunnyday', 0, 'zmove').foe.chooseDefault();
		assert.statStage(battle.p2.active[0], 'spe', 1);
		assert.ok(battle.isWeather('sunnyday'));
	});
});
