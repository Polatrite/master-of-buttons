var Savefile = function() {
    
	$('#loadTextSaveData').click(this.LoadGameFromText);
	$('#resetGame').click(this._resetGameConfirm);
	$('#selectSaveTextData').click(this._selectSaveDataText);
    $('#saveGameTextExport').click(this._displaySaveDataText);
    
    this.isResettingGame = false;
    this.saveSuccessfulCallback = null;

    this.SaveGameToStorage = function(saveObject) {
    	var saveDataStr = this._getSaveGameText(saveObject);
    	
    	//console.log("Saving " + saveDataStr);
    
    	localStorage.setItem('saveData', saveDataStr);
    };
    
    this.LoadGameFromStorage = function(loadObject) {
    	var saveDataStr = localStorage.getItem('saveData');
    	var saveDataObj = this._parseLoadData(saveDataStr);
    	return this._initializeLoadData(loadObject, saveDataObj);
    };
    
    this.LoadGameFromText = function() {
    	this.backupSaveGame();
    	var saveDataStr = $('#loadTextData').val();
    	
    	try {
    		//saveDataStr = atob(saveDataStr);
    		this._parseLoadData(saveDataStr);
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
    
    this.ResetGame = function() {
    	localStorage.removeItem('saveData');
    	this.isResettingGame = true;
    	location.reload(true);
    };
    
    this._displaySaveDataText = function() {
    	var saveDataStr = this._getSaveGameData();
    	//saveDataStr = btoa(saveDataStr);
    
    	var $elem = $('#saveTextData');
    	$elem.val(saveDataStr);
    
    	$('#saveLoadModal').on('shown.bs.modal', this.selectSaveTextData);
    	
    	$('#loadTextData').val('');
    	$('#loadTextDataFailedAlert').addClass('hidden');
    	
    	console.log('saveData save data added to text output');
    };
    
    this._getSaveGameText = function(saveObject) {
    	return JSON.stringify(saveObject);
    };
    
    this._parseLoadData = function (saveDataStr) {
    	if(saveDataStr == null) {
    		return;
    	}
    	
    	var saveDataObj = JSON.parse(saveDataStr);
    	
    	return saveDataObj;
    };
    
    this._initializeLoadData = function(loadObject, saveDataObj) {
    	if(!saveDataObj) {
    		return;
    	}
    	
    	this._repairSave(saveDataObj);
    	$.extend(true, loadObject, saveDataObj);
    	
    	return loadObject;
    };
    
    this._selectSaveDataText = function() {
    	var $elem = $('#saveTextData');
    	$elem.focus();
    	$elem.select();
    };
    
    this.backupSaveGame = function() {
    	var saveDataStr = localStorage.getItem('saveData');
    	localStorage.setItem('backup-saveData', saveDataStr);

    	//console.debug(saveDataStr);
    	console.log("Previous save data backed up, just in case.");
    };
    
    this._repairSave = function(saveData) {
    	if(isNaN(saveData.version) || saveData.version < 3) {
    		this.backupSaveGame();
    	}
    };

    this._resetGameConfirm = function() {
    	var confirm = window.confirm("Are you sure you want to reset your game? This will delete all your data!");
    	if(confirm == true) {
    		this.resetGame();
    	}
    };

};    
