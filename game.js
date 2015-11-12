/* global angular $ _ Savefile */

/* TODO

- Allow you to keep the same board state between matches
  - Possibly 5 matches per board, with a mega-scoring on your highest score?

- Add iconography for buttons


*/

var app = angular.module('app', ['720kb.tooltips']);
Savefile = new Savefile();

var Button = function(conf) {
    this.name = '';
    this.value = 10;
    this.valueMultiplier = 1;
    this.growthSelf = 0;
    this.adjacentGrowth = 0;
    this.nearbyGrowth = 0;
    this.rowGrowth = 0;
    this.rowMultiplier = 0;
    this.columnGrowth = 0;
    this.columnMultiplier = 0;
    
    this.adjacentButtons = [];
    this.nearbyButtons = [];
    this.rowButtons = [];
    this.columnButtons = [];
    
    _.extend(this, conf);
    this.id = this.name.toLowerCase();
}

app.controller("MainCtrl", ['$scope', '$interval', '$timeout', function(scope, $interval, $timeout) {
    angular.extend(scope, {
        disableInteraction: true,
        gameEnded: false,
        player: {
            series: 0,
            upgradeMoney: 0,
            upgrades: {},
            highscores: [],
            highscoreNames: [],
            clicksTotal: 10
        },
        money: 0,
        clicks: 10,
        clickNames: [],
        
        seriesButtons: [],
        seriesCounter: 0,
        seriesScores: [],
        seriesScoresNames: [],
        
        upgrades: {}
    });
    
    angular.extend(scope, {
        btnCurrencyClick: function(button, applyGrowth, multi) {
            var addMoney = 0;
            var bonusValue = 0;
            if(scope.player.upgrades['blitzcrank'] && scope.clicks % 2 == 0) {
                bonusValue += 150;
            }

            if(scope.player.upgrades['bigPlays'] && scope.clicks <= 1) {
                addMoney += scope.getButtonMoney(button, button.value + bonusValue, multi);
            }
            addMoney += scope.getButtonMoney(button, button.value + bonusValue, multi);
            
            
            scope.money += addMoney;

            if(!applyGrowth) {
                return;
            }
            scope.clickNames.push(button.name);
            
            scope.clicks -= 1;
            button.value += button.growthSelf;
            _.each(button.adjacentButtons, function(otherButton) {
                otherButton.value += button.adjacentGrowth;
            });
            _.each(button.nearbyButtons, function(otherButton) {
                otherButton.value += button.nearbyGrowth;
            });
            _.each(button.rowButtons, function(otherButton) {
                otherButton.value += button.rowGrowth;
            });
            _.each(button.columnButtons, function(otherButton) {
                otherButton.value += button.columnGrowth;
            });
            if(button.rowMultiplier !== 0) {
                _.each(button.rowButtons, function(otherButton) {
                    otherButton.valueMultiplier += button.rowMultiplier/10 - 1;
                });
            }
            if(button.columnMultiplier !== 0) {
                _.each(button.columnButtons, function(otherButton) {
                    otherButton.valueMultiplier += button.columnMultiplier/10 - 1;
                });
            }
            
            scope.checkEndGame();
        },
        
        btnUtilityClick: function(data, type) {
            scope.clicks -= 1;

            if(type === 'rowMoney') {
                scope.clickNames.push('Row #' + data);
                _.each(scope.buttons, function(otherButton) {
                    if(data === otherButton.x) {
                        var multi = 1;
                        if(!scope.player.upgrades['rowMyBoat']) {
                            multi = 0.5;
                        }
                        scope.btnCurrencyClick(otherButton, false, multi);
                    }
                });
            }
            
            if(type === 'diagonalMoney') {
                scope.clickNames.push('Diagonal');
                for(var i = 0; i <= 4; i++) {
                    var multi = 1;
                    if(scope.player.upgrades['doubleDiagonal']) {
                        multi = 2;
                    }
                    scope.btnCurrencyClick(scope.buttons[0 + i*6], false, multi);
                }
            }
            
            scope.checkEndGame();
        },
        
        btnBuyUpgradeClick: function(upgrade) {
            if(scope.player.upgradeMoney >= upgrade.cost) {
                scope.player.upgradeMoney -= upgrade.cost;
                scope.player.upgrades[upgrade.id] = true;
                delete scope.upgrades[upgrade.id];
                scope.save();
                init();
            }
        },
        
        checkEndGame: function() {
            if(scope.clicks == 0) {
                scope.endGame();
            } else if(scope.clicks < 0) {
                console.error("Player has negative clicks " + scope.clicks);
            }
        },
        
        btnResetGame: function() {
            scope.player = {
                series: 0,
                upgradeMoney: 0,
                upgrades: {},
                highscores: [],
                highscoreNames: [],
                clicksTotal: 10
            };
            scope.save();
            init();
            console.log('Reset game');
        },
        
        btnRestartGame: function() {
            init();
        },
        
        endGame: function() {
            scope.disableInteraction = true;
            scope.gameEnded = true;
            
            var insertAt = scope.player.highscores.length;
            for(var i = 0; i < scope.player.highscores.length; i++) {
                var highscore = scope.player.highscores[i];
                if(scope.money > highscore) {
                    insertAt = i;
                    break;
                }
            }
            if(insertAt > -1) {
                scope.player.highscores.splice(insertAt, 0, scope.money);
                scope.player.highscoreNames.splice(insertAt, 0, scope.clickNames.join(', '));
            }
            
            scope.newHighscore = insertAt+1;
            scope.newMoney = Math.floor(scope.money) + 100;
            if(scope.newHighscore === 1) {
                if(scope.player.highscores.length >= 2) {
                    var oldScore = Math.floor(scope.player.highscores[1]);
                    scope.newMoney = ((scope.money - oldScore) * 15) + 100 + scope.money;
                } else {
                    scope.newMoney = Math.floor(scope.newMoney*2.5);
                }
            }
            
            $timeout(function() {
                scope.player.upgradeMoney += scope.newMoney;
                scope.save();
                scope.newHighscore = null;
                init();
                scope.disableInteraction = false;
            }, 4000);
        },
        
        tryLoad: function() {
            var loadObject = Savefile.LoadGameFromStorage(scope.player);
            console.log('Loading savefile', loadObject);
            if(loadObject === undefined) {
                return;
            }
            scope.player = loadObject;
            _.each(scope.player.upgrades, function(value, upgradeId) {
                delete scope.upgrades[upgradeId];
            });
        },
        
        save: function() {
            Savefile.SaveGameToStorage(scope.player);
        },
        
        getButtonMoney: function(button, value, multi) {
            if(value === undefined) {
                value = button.value;
            }
            if(multi === undefined) {
                multi = 1;
            }
            return Math.round(value * button.valueMultiplier * multi);
        },
        
        getRowMoney: function(row) {
            var money = 0;
            if(row === -1) {// diagonal
                for(var i = 0; i <= 4; i++) {
                    money += scope.buttons[0 + i*6].value * scope.buttons[0 + i*6].valueMultiplier;
                }
                if(scope.player.upgrades['doubleDiagonal']) {
                    money *= 2;
                }
            } else {
                _.each(scope.buttons, function(button) {
                    if(button.x === row) {
                        var multi = 1;
                        if(!scope.player.upgrades['rowMyBoat']) {
                            multi = 0.5;
                        }
                        money += scope.getButtonMoney(button, button.value, multi);
                    }
                });
            }
            return Math.round(money);
        },
        
        filterUpgrades: function(upgrade) {
            if(!scope.player.upgrades[upgrade.id]) {
                console.log("Showing " + upgrade.id);
                return true;
            } else {
                console.log("Filtering " + upgrade.id);
                return false;
            }
        }
    })

    init();
    scope.disableInteraction = false;
    
    function init() {
        scope.player = {
            series: 0,
            upgradeMoney: 0,
            upgrades: {},
            highscores: [],
            highscoreNames: [],
            clicksTotal: 10
        },
        scope.tryLoad();
        scope.upgrades = {
        	team: {
        		id: 'team',
        		name: 'Team',
        		cost: 500*2,
        		tooltip: "Adds the 'Team' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	turbulent: {
        		id: 'turbulent',
        		name: 'Turbulent',
        		cost: 500*5,
        		tooltip: "Adds the 'Turbulent' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	average: {
        		id: 'average',
        		name: 'Average',
        		cost: 500*5,
        		tooltip: "Adds the 'Average' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	gimmeRows: {
        		id: 'gimmeRows',
        		name: 'Gimme Rows',
        		cost: 500*5,
        		tooltip: 'Adds the ability to gain money from all 5 rows at 0.5x.',
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	diagonalTrick: {
        		id: 'diagonalTrick',
        		name: 'Diagonal Trick',
        		cost: 500*8,
        		tooltip: 'Adds the ability to gain money from 1 diagonal.',
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	totally: {
        		id: 'totally',
        		name: 'Totally',
        		cost: 500*15,
        		tooltip: 'Shows row totals.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	moarClick: {
        		id: 'moarClick',
        		name: 'Moar Click',
        		cost: 500*20,
        		tooltip: 'Gives an extra click per match.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	know: {
        		id: 'know',
        		name: 'Know',
        		cost: 500*10,
        		tooltip: "Adds the 'Know' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	trinket: {
        		id: 'trinket',
        		name: 'Trinket',
        		cost: 500*10,
        		tooltip: "Adds the 'Trinket' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	madMoney: {
        		id: 'madMoney',
        		name: 'Mad Money',
        		cost: 500*15,
        		tooltip: 'Gives all buttons a 1.2x multiplier.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	greed: {
        		id: 'greed',
        		name: 'Greed',
        		cost: 500*12,
        		tooltip: "Adds the 'Greed' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	adjacentBoost: {
        		id: 'adjacentBoost',
        		name: 'Adjacent Boost',
        		cost: 500*18,
        		tooltip: 'Gives +$10 to all adjacency boosts.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	rogersNeighbor: {
        		id: 'rogersNeighbor',
        		name: 'Mr. Rogers\' Neighbor',
        		cost: 500*20,
        		tooltip: 'Gives +$5 to all nearby boosts.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	harass: {
        		id: 'harass',
        		name: 'Harass',
        		cost: 500*10,
        		tooltip: "Adds the 'Harass' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	rowMyBoat: {
        		id: 'rowMyBoat',
        		name: 'Row My Boat',
        		cost: 500*30,
        		tooltip: 'Row buttons gain an additional 0.5x multiplier.',
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	goldper10: {
        		id: 'goldper10',
        		name: 'Gold Per 10',
        		cost: 500*20,
        		tooltip: "Support: Gains $15 nearby boost.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	clickorama: {
        		id: 'clickorama',
        		name: 'Click-O-Rama',
        		cost: 500*17,
        		tooltip: 'Gives an extra click per match.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	rocket: {
        		id: 'rocket',
        		name: 'Rocket',
        		cost: 1000*25,
        		tooltip: "Adds the 'Rocket' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	linedUp: {
        		id: 'linedUp',
        		name: 'Lined Up',
        		cost: 500*20,
        		tooltip: "Line: Gains $30 base value.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	blast: {
        		id: 'blast',
        		name: 'Blast',
        		cost: 500*15,
        		tooltip: "Adds the 'Blast' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	fast: {
        		id: 'fast',
        		name: 'Fast',
        		cost: 500*20,
        		tooltip: "Adds the 'Fast' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	completeAvarice: {
        		id: 'completeAvarice',
        		name: 'Complete Avarice',
        		cost: 500*40,
        		tooltip: "Greed: Gains $10 self boost, loses $10 row boost.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	aboveAverage: {
        		id: 'aboveAverage',
        		name: 'Above Average',
        		cost: 500*35,
        		tooltip: "Average: Gains $5 nearby boost, $5 adjacent boost.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	standTall: {
        		id: 'standTall',
        		name: 'Stand Tall',
        		cost: 1000*40,
        		tooltip: "Buttons with column multipliers now affect themselves.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	randomStar: {
        		id: 'randomStar',
        		name: 'Random Star',
        		cost: 500*10,
        		tooltip: 'Gives a random button a 2x multiplier each match.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	bigPlays: {
        		id: 'bigPlays',
        		name: 'Big Plays',
        		cost: 1000*40,
        		tooltip: 'Your last click gives double the money.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	depth: {
        		id: 'depth',
        		name: 'Depth',
        		cost: 1000*25,
        		tooltip: "Adds the 'Depth' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	clickamole: {
        		id: 'clickamole',
        		name: 'Click-A-Mole',
        		cost: 1000*30,
        		tooltip: 'Gives an extra click per match.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	boostsalot: {
        		id: 'boostsalot',
        		name: 'Boosts-A-Lot',
        		cost: 1000*75,
        		tooltip: 'Gives 3 random buttons a 2.0x multiplier each match.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	myMatesRow: {
        		id: 'myMatesRow',
        		name: "My Mate's Row",
        		cost: 500*50,
        		tooltip: 'Gives +$5 to all row boosts and 1.3x to all row multipliers.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	hard: {
        		id: 'hard',
        		name: 'Hard',
        		cost: 500*40,
        		tooltip: "Adds the 'Hard' button.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	doubleDiagonal: {
        		id: 'doubleDiagonal',
        		name: 'Double Diagonal',
        		cost: 1000*90,
        		tooltip: 'Gives the Diagonal button an x2 multiplier.',
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	yetanotherclick: {
        		id: 'yetanotherclick',
        		name: 'Yet Another Click',
        		cost: 1000*40,
        		tooltip: 'Gives an extra click per match.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	unidentifiedProfitableObject: {
        		id: 'unidentifiedProfitableObject',
        		name: 'Unidentified Profitable Object',
        		cost: 1000*100,
        		tooltip: 'Rocket: Gains $15 self boost.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	readySetRow: {
        		id: 'readySetRow',
        		name: 'Ready, Set, Row!',
        		cost: 1000*80,
        		tooltip: "Buttons with row multipliers now affect themselves.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	clickAddiction: {
        		id: 'clickAddiction',
        		name: 'Click Addiction',
        		cost: 1000*65,
        		tooltip: 'Gives an extra click per match.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	diehard: {
        		id: 'diehard',
        		name: 'Die-Hard',
        		cost: 1000*60,
        		tooltip: "Hard: Gains $30 base value.",
        		icon: 'glyphicon-align-justify',
        		apply: function() {
        			
        		}
        	},
        	columnBoost: {
        		id: 'columnBoost',
        		name: 'Column Boost',
        		cost: 1000*80,
        		tooltip: 'Gives +$10 to all column boosts.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	ridinTheLine: {
        		id: 'ridinTheLine',
        		name: "Ridin' the Line",
        		cost: 1000*55,
        		tooltip: 'Line: Gains $5 row boost.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	scratchMyBack: {
        		id: 'scratchMyBack',
        		name: 'Scratch My Back',
        		cost: 1000*100,
        		tooltip: 'All buttons gain half of their adjacency boost as self boost.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	lilSlugger: {
        		id: 'lilSlugger',
        		name: 'Lil Slugger',
        		cost: 1000*70,
        		tooltip: 'Slug: Gains $30 self growth.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	jumbolaya: {
        		id: 'jumbolaya',
        		name: 'Jumbolaya',
        		cost: 1000*110,
        		tooltip: 'Jumbo: Gains $30 self growth and x1.3 self multiplier.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	hungriestHungryHippo: {
        		id: 'hungriestHungryHippo',
        		name: 'Hungriest Hungry Hippo',
        		cost: 1000*100,
        		tooltip: 'Hungry: Gains $20 base value and $20 self growth.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        	blitzcrank: {
        		id: 'blitzcrank',
        		name: 'Blitz Crank',
        		cost: 1000*100,
        		tooltip: 'Blitz: Gains $150 base value on every even click.',
        		icon: 'glyphicon-hand-up',
        		apply: function() {
        		}
        	},
        };
        
        scope.upgrades = _.filter(scope.upgrades, function(upgrade) {
            return scope.player.upgrades[upgrade.id] === undefined;
        });
        
        scope.buttons = [
            new Button({ name: 'Jumbo', value: 95 }),
            new Button({ name: 'Support', value: 10, nearbyGrowth: 15 }),
            new Button({ name: 'Group', value: 20, adjacentGrowth: 25 }),
            new Button({ name: 'Carry', value: 70, growthSelf: 15 }),
            new Button({ name: 'Slug', value: 0, adjacentGrowth: 15, rowMultiplier: 15 }),
            new Button({ name: 'Quick', value: 5, adjacentGrowth: 10, nearbyGrowth: 10 }),
            new Button({ name: 'Flight', value: 10, growthSelf: 0, columnMultiplier: 20 }),
            new Button({ name: 'Flit', value: 0, adjacentGrowth: 10, columnMultiplier: 15 }),
            new Button({ name: 'Tango', value: 10, rowMultiplier: 15, rowGrowth: 5 }),
            new Button({ name: 'Weakness', value: 50, growthSelf: -20, adjacentGrowth: 30 }),
            new Button({ name: 'Hungry', value: 20, growthSelf: 10, nearbyGrowth: 10 }),
            new Button({ name: 'Line', value: 0, rowGrowth: 20 }),
            new Button({ name: 'Blitz', value: -20, growthSelf: -10, columnMultiplier: 18, columnGrowth: 15 }),
        ];

        if(scope.player.upgrades['greed'])
            scope.buttons.push(new Button({ name: 'Greed', value: 60, growthSelf: 35, adjacentGrowth: -10 }));
        if(scope.player.upgrades['turbulent'])
            scope.buttons.push(new Button({ name: 'Turbulent', value: 70, adjacentGrowth: 10 }));
        if(scope.player.upgrades['harass'])
            scope.buttons.push(new Button({ name: 'Harass', value: 60, growthSelf: 40, rowGrowth: -10 }));
        if(scope.player.upgrades['average'])
            scope.buttons.push(new Button({ name: 'Average', value: 0, adjacentGrowth: 15, nearbyGrowth: 10 }));
        if(scope.player.upgrades['rocket'])
            scope.buttons.push(new Button({ name: 'Rocket', value: 10, growthSelf: 35, adjacentGrowth: 5 }));
        if(scope.player.upgrades['know'])
            scope.buttons.push(new Button({ name: 'Know', value: -10, rowGrowth: 10, adjacentGrowth: 10, nearbyGrowth: 5 }));
        if(scope.player.upgrades['team'])
            scope.buttons.push(new Button({ name: 'Team', value: 10, adjacentGrowth: 30 }));
        if(scope.player.upgrades['trinket'])
            scope.buttons.push(new Button({ name: 'Trinket', value: 0, rowGrowth: 20  }));
        if(scope.player.upgrades['blast'])
            scope.buttons.push(new Button({ name: 'Blast', value: 15, growthSelf: 20, adjacentGrowth: 15 }));
        if(scope.player.upgrades['fast'])
            scope.buttons.push(new Button({ name: 'Fast', value: 50, growthSelf: 25 }));
        if(scope.player.upgrades['depth'])
            scope.buttons.push(new Button({ name: 'Depth', value: 10, growthSelf: -10, columnMultiplier: 25 }));
        if(scope.player.upgrades['hard'])
            scope.buttons.push(new Button({ name: 'Hard', value: 120, growthSelf: -10 }));

        testBalanceBudget(scope.buttons);
        
        scope.buttons = shuffle(scope.buttons);
        scope.buttons = scope.buttons.slice(-15);

        while(scope.buttons.length < 25) {
            scope.buttons.push(new Button({ name: 'Standard', value: 60 }));
        }

        scope.buttonsWidth = 5;
        scope.buttonsHeight = 5;
        scope.buttons = shuffle(scope.buttons);
        setAdjacency(scope.buttons);

        applyUpgrades();
        scope.money = 0;
        scope.clicks = scope.player.clicksTotal;
        scope.clickNames = [];
        scope.gameEnded = false;

        testBalanceBudget(scope.buttons);

    }
    
    function applyUpgrades() {
        var button;
        _.each(scope.buttons, function(button) {
            if(scope.player.upgrades['madMoney']) {
                button.valueMultiplier += 0.2;
            }
            
            if(scope.player.upgrades['adjacentBoost']) {
                if(button.adjacentGrowth) {
                    button.adjacentGrowth += 10;
                }
            }
            if(scope.player.upgrades['scratchMyBack']) {
                if(button.adjacentGrowth) {
                    button.growthSelf += Math.round(button.adjacentGrowth/2);
                }
            }
            if(scope.player.upgrades['rogersNeighbor']) {
                if(button.nearbyGrowth) {
                    button.nearbyGrowth += 5;
                }
            }
            if(scope.player.upgrades['columnBoost']) {
                if(button.columnGrowth) {
                    button.columnGrowth += 10;
                }
            }
            if(scope.player.upgrades['myMatesRow']) {
                if(button.rowGrowth) {
                    button.rowGrowth += 5;
                }
                if(button.rowMultiplier) {
                    button.rowMultiplier += 3;
                }
            }
        });
        
        if(scope.player.upgrades['unidentifiedProfitableObject']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'rocket';
            });
            if(button) {
                button.growthSelf += 15;
            }
        }
        
        if(scope.player.upgrades['goldper10']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'support';
            });
            if(button) {
                button.nearbyGrowth += 15;
            }
        }
        
        if(scope.player.upgrades['lilSlugger']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'slug';
            });
            if(button) {
                button.growthSelf += 30;
            }
        }
        
        if(scope.player.upgrades['hungriestHungryHippo']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'hungry';
            });
            if(button) {
                button.growthSelf += 20;
                button.value += 20;
            }
        }
        
        if(scope.player.upgrades['jumbolaya']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'jumbo';
            });
            if(button) {
                button.growthSelf += 30;
                button.valueMultiplier += 0.3;
            }
        }
        
        if(scope.player.upgrades['linedUp']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'line';
            });
            if(button) {
                button.value += 30;
            }
        }
        
        if(scope.player.upgrades['ridinTheLine']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'line';
            });
            if(button) {
                button.rowGrowth += 5;
            }
        }
        
        if(scope.player.upgrades['completeAvarice']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'greed';
            });
            if(button) {
                button.growthSelf += 10;
                button.rowGrowth -= 10;
            }
        }
        
        if(scope.player.upgrades['aboveAverage']) {
            button = _.find(scope.buttons, function(button) {
                return button.id == 'average';
            });
            if(button) {
                button.nearbyGrowth += 5;
                button.adjacentGrowth += 5;
            }
        }
        
        if(scope.player.upgrades['randomStar']) {
            button = scope.buttons.pick();
            button.valueMultiplier += 1;
            button.starred = true;
        }
        
        if(scope.player.upgrades['boostsalot']) {
            button = scope.buttons.pick();
            button.valueMultiplier += 1.0;
            button.starred = true;
            button = scope.buttons.pick();
            button.valueMultiplier += 1.0;
            button.starred = true;
            button = scope.buttons.pick();
            button.valueMultiplier += 1.0;
            button.starred = true;
        }
        
        if(scope.player.upgrades['moarClick']) {
            scope.player.clicksTotal += 1;
            scope.player.upgrades['moarClick'] = false;
        }
        if(scope.player.upgrades['clickorama']) {
            scope.player.clicksTotal += 1;
            scope.player.upgrades['clickorama'] = false;
        }
        if(scope.player.upgrades['clickamole']) {
            scope.player.clicksTotal += 1;
            scope.player.upgrades['clickamole'] = false;
        }
        if(scope.player.upgrades['yetanotherclick']) {
            scope.player.clicksTotal += 1;
            scope.player.upgrades['yetanotherclick'] = false;
        }
        if(scope.player.upgrades['clickAddiction']) {
            scope.player.clicksTotal += 1;
            scope.player.upgrades['clickAddiction'] = false;
        }
        
    }
    
    function testBalanceBudget(buttons) {
        /* Balance Budget
        100 points to spend
        1 value = 1 point
        1 growthSelf = 2 points
        1 adjacentGrowth = 3 points
        1 nearbyGrowth = 6 points
        1 rowGrowth = 5 points
        1 columnMultiplier = 4 points  */

        _.each(buttons, function(button) {
            var points = 0;
            points += button.value;
            points += button.growthSelf * 2;
            points += button.adjacentGrowth * 3;
            points += button.nearbyGrowth * 6;
            points += button.rowGrowth * 5;
            points += button.rowMultiplier * 4;
            points += button.columnGrowth * 5;
            points += button.columnMultiplier * 4;
            if(points > 100) {
                console.error(button.name + " is over budget: " + points);
            }
            else if(points < 90) {
                console.warn(button.name + " is under budget: " + points);
            }
            else {
                console.log(button.name + " is great: " + points);
            }
        })
    }
    
    function setAdjacency(buttons) {
        var buttonsCalc = {};
        for(var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var x = Math.floor(i / 5)+1;
            var y = Math.floor(i % 5)+1;
            button.x = x;
            button.y = y;
            buttonsCalc['b' + x + ',' + y] = button;
        }
        
        // west, east, north, south
        var adjacentX = [-1, 1, 0, 0];
        var adjacentY = [0, 0, -1, 1];
        // northwest, north, northeast, west, east, southwest, south, southeast
        var nearbyX = [-1, 0, 1, -1, 1, -1, 0, 1];
        var nearbyY = [-1, -1, -1, 0, 0, 1, 1, 1];
        
        _.each(buttonsCalc, function(button) {
            // adjacent
            for(var i = 0; i < adjacentX.length; i++) {
                var newButton = buttonsCalc['b' + (button.x+adjacentX[i]) + ',' + (button.y+adjacentY[i])];
                if(newButton !== undefined) {
                    button.adjacentButtons.push(newButton);
                }
            }
            
            // nearby
            for(var i = 0; i < nearbyX.length; i++) {
                var newButton = buttonsCalc['b' + (button.x+nearbyX[i]) + ',' + (button.y+nearbyY[i])];
                if(newButton !== undefined) {
                    button.nearbyButtons.push(newButton);
                }
            }
            
            // row
            button.rowButtons = _.filter(buttonsCalc, function(filterButton) { return button.x === filterButton.x && (scope.player.upgrades['readySetRow'] || button != filterButton) });

            // column
            button.columnButtons = _.filter(buttonsCalc, function(filterButton) { return button.y === filterButton.y && (scope.player.upgrades['standTall'] || button != filterButton) });
        });
        
        console.log(buttons[12]);
    }
    
    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex ;
        
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        
        return array;
    }
}]);

if (!Array.prototype.pick) {
	Array.prototype.pick = function() {
		var O = Object(this);
		return O[Math.floor(Math.random()*this.length)];
	}
}

if (!Math.randInt) {
	Math.randInt = function(min, max) {
		if(!min) min = 0;
		if(!max) max = 100;
		return Math.floor(Math.random() * (max - min) + min);
	}
}
