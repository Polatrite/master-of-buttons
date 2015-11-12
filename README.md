       if(scope.player.upgrades['greed'])
            scope.buttons.push(new Button({ name: 'Greed', value: 55, growthSelf: 30, adjacentGrowth: -5 }));
        if(scope.player.upgrades['turbulent'])
            scope.buttons.push(new Button({ name: 'Turbulent', value: 70, adjacentGrowth: 10 }));
        if(scope.player.upgrades['harass'])
            scope.buttons.push(new Button({ name: 'Harass', value: 60, growthSelf: 35, adjacentGrowth: -10 }));
        if(scope.player.upgrades['average'])
            scope.buttons.push(new Button({ name: 'Average', value: 10, growthSelf: 15, adjacentGrowth: 10, nearbyGrowth: 5 }));
        if(scope.player.upgrades['rocket'])
            scope.buttons.push(new Button({ name: 'Rocket', value: 5, growthSelf: 40, adjacentGrowth: 5 }));
        if(scope.player.upgrades['know'])
            scope.buttons.push(new Button({ name: 'Know', value: -10, rowGrowth: 10, adjacentGrowth: 10, nearbyGrowth: 5 }));
        if(scope.player.upgrades['team'])
            scope.buttons.push(new Button({ name: 'Team', value: 10, adjacentGrowth: 30 }));
        if(scope.player.upgrades['trinket'])
            scope.buttons.push(new Button({ name: 'Trinket', value: 45, growthSelf: 20, adjacentGrowth: 5 }));
        if(scope.player.upgrades['blast'])
            scope.buttons.push(new Button({ name: 'Blast', value: 15, growthSelf: 20, adjacentGrowth: 15 }));
        if(scope.player.upgrades['fast'])
            scope.buttons.push(new Button({ name: 'Fast', value: 50, growthSelf: 25 }));
        if(scope.player.upgrades['depth'])
            scope.buttons.push(new Button({ name: 'Depth', value: 10, growthSelf: -10, columnGrowth: 25 }));
        if(scope.player.upgrades['hard'])
            scope.buttons.push(new Button({ name: 'Hard', value: 120, growthSelf: -10 }));
