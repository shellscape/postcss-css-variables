import AppDispatcher from '../dispatcher/AppDispatcher';
import PlaygroundConstants from '../constants/PlaygroundConstants';
import PlaygroundSettingsStore from '../stores/PlaygroundSettingsStore';

import assign from 'object-assign';
import Immutable from 'immutable';
import events from 'events';
let EventEmitter = events.EventEmitter;


import postcss from 'postcss';
import cssvariables from 'postcss-var-replace';


let CHANGE_EVENT = 'CHANGE_EVENT';



let keyboardActionStream = assign({}, EventEmitter.prototype);

let playgroundProcessor = postcss()
	.use(cssvariables());

let postcssUnprocessedInputText = '';
let processingResult = Immutable.Map({
	input: '',
	output: '',
	error: null
});


let PlaygroundStore = assign({}, EventEmitter.prototype, {

	getKeyboardActionStream: function() {
		return keyboardActionStream;
	},


	getInputText: function() {
		return postcssUnprocessedInputText;
	},

	getOutputResult: function() {
		return processingResult;
	},



	emitChange: function() {
		this.emit(CHANGE_EVENT);
	},

	addChangeListener: function(callback) {
		this.on(CHANGE_EVENT, callback);
	},

	removeChangeListener: function(callback) {
		this.removeListener(CHANGE_EVENT, callback);
	},

	dispatchToken: AppDispatcher.register(function(action) {

		switch(action.actionType) {
			case PlaygroundConstants.PLAYGROUND_KEYBOARD_ACTION:
				keyboardActionStream.emit('KEYBOARD_ACTION');
				break;

			// Whenever the plugin option updates,
			// we need to update the output
			case PlaygroundConstants.PLAYGROUND_SET_POSTCSS_CSS_VARIABLES_PRESERVE:
				AppDispatcher.waitFor([
					PlaygroundSettingsStore.dispatchToken
				]);
				updateProcessor(PlaygroundSettingsStore.getPluginSettings());
				break;

			case PlaygroundConstants.PLAYGROUND_INPUT_UPDATED:
				postcssUnprocessedInputText = action.value;
				PlaygroundStore.emitChange();
				break;

			case PlaygroundConstants.PLAYGROUND_START_PROCESS_INPUT:
				updateOutput();
				break;

			default:
				// no op
		}

		// No errors. Needed by promise in Dispatcher.
		return true;
	})
});


function updateProcessor(settings) {
	settings = settings || {};

	playgroundProcessor = postcss()
		.use(cssvariables(settings.get('postcss-var-replace').toObject()));

	// Whenever the plugin option updates,
	// we need to update the output
	updateOutput();
}


function updateOutput() {
	processingResult = processingResult.set('input', postcssUnprocessedInputText);

	playgroundProcessor.process(postcssUnprocessedInputText).then(function(result) {
		_setOuput(result.css, null);
	}).catch(function(error) {
		// Because there was an error, reset the output text
		_setOuput('', error);
		//console.warn(error);
	});
}

function _setOuput(text, error) {
	processingResult = processingResult.set('output', text);
	processingResult = processingResult.set('error', error);
	PlaygroundStore.emitChange();
}



export default PlaygroundStore;