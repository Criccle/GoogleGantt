var shell = require('shelljs'),
	os = require('os');

var exe = {
	err: null, 
	output: null
};

function getShellOutput (cmd, replace) {
	var output = shell.exec(cmd, {silent:true}).output.trim();
	return replace ? output.replace(/[\n\r]/g,'') : output;
}

function getFtypeArguments (line) {
	var ftypeRegEx = /(["'])(?:(?=(\\?))\2.)*?\1/g;
	var regExMatch = line.match(ftypeRegEx);
	if (regExMatch.length === 2) {
		// Found cmd + input arg
		return {
			cmd : regExMatch[0].replace(/\"/g,''),
			arg : regExMatch[1].replace(/\"/g,'').replace('%1','{path}')
		};
	} else {
		return null;
	}
}

function findModeler () {
	var findGeneric = true,
		assoc = getShellOutput('assoc .mpr', true);
	// Find association

	if (assoc.indexOf('not found') !== -1) {
		exe.err = 'No file association found for .mpr, are you sure you installed Mendix?';
	} else if (assoc.indexOf('.mpr=') === 0) {
		// Found association, getting the Version Selector
		var association = assoc.split('=')[1],
			ftype = getShellOutput('ftype', false).split('\n').filter(function (line) {
				return line.indexOf(association) !== -1;
			});

		if (ftype.length === 1) {
			// ftype found, getting arguments
			var ftypeArgs = getFtypeArguments(ftype[0]);
			if (ftypeArgs !== null) {
				exe.output = ftypeArgs;
				findGeneric = false;
			} 
		}
	} else {
		exe.err = 'Unknown error, cannot find the association for .MPR (Mendix Project) files. Are you on Windows?';
		findGeneric = false;
	}

	if (findGeneric) {
		var ftypeMendix = getShellOutput('ftype mendix', true);
		if (ftypeMendix.indexOf('not found') !== -1) {
			exe.err = 'No file association found for .mpr, are you sure you installed Mendix?';
		} else {
			// ftype found, getting arguments
			var ftypeArgs = getFtypeArguments(ftypeMendix);
			if (ftypeArgs !== null) {
				exe.output = ftypeArgs;
			} else {
				exe.err = 'No file association found for .mpr, are you sure you installed Mendix?';
			}
		}
	}
}

if (os.platform() !== 'win32') {
	exe.err = 'Unfortunately this feature only works in Windows...';
} else {
	findModeler();
}

module.exports = exe;