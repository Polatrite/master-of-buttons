var Savefile = function(curateDataCallback) {
    
    if(!_.isFunction(curateDataCallback)) {
        console.error("Savefile: curateDataCallback is not a valid function.");
        return;
    }
    
	$('#loadTextSaveData').click(this.LoadGameFromText);

	$('#resetGame').click(this.resetGameConfirm);
	$('#selectSaveTextData').click(this.selectSaveDataText);
    $('#saveGameTextExport').click(this.displaySaveDataText);
    
    this.isResettingGame = false;
    
    this.curateDataCallback = curateDataCallback;
    this.saveSuccessfulCallback = null;

    this.SaveGameToStorage = function() {
    	var saveDataStr = this.GetSaveGameData();
    
    	localStorage.setItem('saveData', saveDataStr);
    };
    
    this.LoadGameFromStorage = function() {
    	var saveDataStr = localStorage.getItem('saveData');
    	var saveDataObj = this.ParseLoadData(saveDataStr);
    	this.InitializeLoadData(saveDataObj);
    };
    
    this.LoadGameFromText = function() {
    	this.backupSaveGame();
    	var saveDataStr = $('#loadTextData').val();
    	
    	try {
    		saveDataStr = atob(saveDataStr);
    		this.ParseLoadData(saveDataStr);
    		localStorage.setItem('saveData', saveDataStr);
    		
    		this.isResettingGame = true;
    		location.reload(true);
    	}
    	catch (e) {
    		console.error('Failed to load data from text');
    		console.error(e);
    		$('#loadTextDataFailedAlert').removeClass('hidden');
    		return;
    	}
    
    	$('#saveLoadModal').modal('hide');
    };
    
    this.displaySaveDataText = function() {
    	var saveDataStr = this.GetSaveGameData();
    	saveDataStr = btoa(saveDataStr);
    
    	var $elem = $('#saveTextData');
    	$elem.val(saveDataStr);
    
    	$('#saveLoadModal').on('shown.bs.modal', this.selectSaveTextData);
    	
    	$('#loadTextData').val('');
    	$('#loadTextDataFailedAlert').addClass('hidden');
    	
    	console.log('saveData save data added to text output');
    };
    
    this.getSaveGameData = function() {
        var curatedData = this.curateDataCallback();

    	return JSON.stringify(curatedData);
    };
    
    this.parseLoadData = function (saveDataStr) {
    	if(saveDataStr == null) {
    		return;
    	}
    	
    	var saveDataObj = JSON.parse(saveDataStr);
    	
    	return saveDataObj;
    };
    
    this.initializeLoadData = function(saveDataObj) {
    	if(!saveDataObj) {
    		return;
    	}
    	
    	this.repairSave(saveDataObj);
    	
    	$.extend(true, saveData, saveDataObj);
    };
    
    this.selectSaveDataText = function() {
    	var $elem = $('#saveTextData');
    	$elem.focus();
    	$elem.select();
    };
    
    this.backupSaveGame = function() {
    	var saveDataStr = localStorage.getItem('saveData');
    	localStorage.setItem('backup-saveData', saveDataStr);

    	console.debug(saveDataStr);
    	console.log("Previous save data backed up, just in case.");
    };
    
    this.repairSave = function(saveData) {
    	if(isNaN(saveData.version) || saveData.version < 3) {
    		this.backupSaveGame();
    	}
    };

    this.ResetGame = function() {
    	localStorage.removeItem('saveData');
    	this.isResettingGame = true;
    	location.reload(true);
    };
    
    this.resetGameConfirm = function() {
    	var confirm = window.confirm("Are you sure you want to reset your game? This will delete all your data!");
    	if(confirm == true) {
    		this.resetGame();
    	}
    };

};    
