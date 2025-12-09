var issuesCol = new IssueCollection();

class MinifierService {
	constructor() { }

	/**
	 * Minify when saving function
	 *
	 * @param {Class} editor - The active editor
	 */
	minifyOnSave(editor) {
		if(nova.inDevMode()) {
			//console.log("Syntax; " + editor.document.syntax);
			//console.log("Path: " + editor.document.path);
		}

		if (editor.document.syntax != "javascript" && editor.document.syntax != "css") {
			if(nova.inDevMode()) {
				// console.log("Document " + editor.document.syntax + " is not JS or CSS!");
			}
			return;
		}
		if(nova.inDevMode()) {
			//console.log("Minify should be called on "+ editor.document.path);
		}

		var source = editor.document.path;
		if (editor.document.syntax=="css") {
			// Check if it should be minified (should be a pattern match or something)
			// for now, as long as it's in a subfolder of css/
			if(editor.document.path.indexOf("/css/")==-1) {
				return;
			}

			if(source.substring(source.length-7)=="min.css") {
				if(nova.inDevMode()) {
					// console.log("Don't minify minified CSS!");
				}
				return;
			}
			this.minifyCss(source);
		}

		if (editor.document.syntax=="javascript") {
			// Check if it should be minified (should be a pattern match or something)
			// for now, as long as it's in a subfolder of js/
			if(editor.document.path.indexOf("/js/")==-1) {
				return;
			}

			if(source.substring(source.length-6)=="min.js") {
				if(nova.inDevMode()) {
					// console.log("Don't minify minified JavaScript!");
				}
				return;
			}
			this.minifyJavascript(editor.document);
		}
	}

	/**
	 * Handles minifying the CSS files
	 *
	 * @param {String} source - The editor's document path
	 */
	minifyCss(source) {
		var targetFile = source.replace(/\.[^/\\.]+$/,".min.css");

		var path = nova.path.join(nova.path.join(nova.extension.path, "Jars"),"yuicompressor-2.4.9.jar");
		var args = new Array;
		args.push("java");
		args.push("-jar");
		args.push(path);
		args.push("--output");
		args.push(targetFile);
		args.push("--");
		args.push(source);

		var options = { args: args };
		var process = new Process("/usr/bin/env",options)
		var stdOut = new Array;
		var stdErr = new Array;
		if(nova.inDevMode()) {
			console.log(JSON.stringify(args,true));
		}

		process.onStdout(function(line) { stdOut.push(line.trim()); });
		process.onStderr(function(line) { stdErr.push(line.trim()); });
		process.onDidExit(function() {
			/*
			console.log("onDidExit!");
			if(stdOut.length>0) {
				console.log("stdOut: " . stdOut.splice().join("\n"));
			}
			if(stdErr.length>0) {
				console.log("stdErr: " . stdErr.splice().join("\n"));
			}
			*/
			if(stdErr.length>0) {
				if(nova._minifierNotificationTimer) {
					clearTimeout(nova._minifierNotificationTimer);
				}
				var message = stdErr.splice(0,2).join("\n");

				let request = new NotificationRequest("min-mess");
				request.title = "Minifier CSS Error";
				request.body = message;
				request.actions = [ "Oops!"];
				let promise = nova.notifications.add(request);

/*
				nova._minifierNotificationTimer = setTimeout(function() {
					nova.notifications.cancel("min-mess");
					console.log("So long message!");
				}, 10000);
*/
			} else {
				nova.notifications.cancel("min-mess");
			}
		});

		process.start();
		if(nova.inDevMode()) {
			//console.log("Exit minifyCss()");
		}
	}

	/**
	 * Handles minification of Javascript files
	 *
	 * @param {Class} doc - The Document from the editor to minify
	 */
	minifyJavascript(doc) {
		var source = doc.path;
		//console.log("Enter minifyJavascript()");
		var targetFile = source.replace(/\.[^/\\.]+$/,".min.js");
		var mapFile = source.replace(/\.[^/\\.]+$/,".min.js.map");

		var lastSlashIndex = source.lastIndexOf("/");
		var mapFilename = mapFile.substring(lastSlashIndex+1,mapFile.length);
		var path = nova.path.join(nova.path.join(nova.extension.path, "Jars"),"closure-compiler-v20220601.jar");

		var args = new Array;
		args.push("java");
		args.push("-jar");
		args.push(path);

		args.push("--warning_level");
		args.push("QUIET");
		//args.push("VERBOSE");
		args.push("--compilation_level");
		args.push("SIMPLE");
		args.push("--js");
		args.push(source);
		args.push("--js_output_file");
		args.push(targetFile);

		// Fix for Adobe Animate throwing errors about "Object literal contains illegal duplicate key ..., disallowed in strict mode"
		args.push("--strict_mode_input");
		args.push("false");
		args.push("--jscomp_off");
		args.push("es5Strict");

		args.push("--create_source_map");
		args.push(mapFile);

/*
		// Need to check these for newer version of Closure
		args.push("--rewrite_polyfills");
		args.push("true");
		//args.push("false");
		//args.push("--assume_function_wrapper");
		//args.push("true");
		//args.push("false");
		args.push("--language_out");
		args.push("ECMASCRIPT5");
*/

		// Add sourceMappingURL to file
		args.push("--output_wrapper");
		args.push("%output%\n//# sourceMappingURL=" + mapFilename);
		// Remove file name from sources: entry
		args.push("--source_map_location_mapping");
		args.push(targetFile.substring(0,targetFile.lastIndexOf("/")+1)+"|");
		if(nova.inDevMode()) {
			console.log(JSON.stringify(args,true));
		}

		var options = { args: args  };
		var process = new Process("/usr/bin/env",options)
		var stdOut = new Array;
		var stdErr = new Array;

		process.onStdout(function(line) { /* console.log("::: "+line+" :::"); */ stdOut.push(line); });
		process.onStderr(function(line) { /* console.log(stdErr.length + "::: "+line+" :::"); */ stdErr.push(line); });
		process.onDidExit(function() {
			// If there are errors
			if(stdErr.length>0) {
				if(nova._minifierNotificationTimer) {
					clearTimeout(nova._minifierNotificationTimer);
				}

				var message = "";
				if(stdErr.indexOf("java.lang.UnsupportedClassVersionError")!=-1) {
					message = "You need a different version of Java installed:\n\n" + stdErr;
				} else {
					// Create an issue and add to the issue collector
					// Match 1 - File name
					// Match 2 - line number
					// Match 3 - Error message
					var msg = stdErr[0].match(/(.+):(\d+):\s(.+)/);

					var issue = new Issue();
					issue.message = msg[3].replace("ERROR - ","");
					issue.code =  "E12";
					issue.severity = IssueSeverity.Error;
					issue.line = msg[2];

					// If there are 3 lines of errors, the last one is a pointer to where the column is
					var column = 1;
					if(stdErr.length==3) {
						column = stdErr[2].indexOf("^");
					}
					issue.column = column;

					// Pass to issues
					issuesCol.set(doc.uri, [issue]);

					// Display message
					message = stdErr.splice(0,2);
				}

				var request = new NotificationRequest("min-mess");
				request.title = "Minifier JS Error";
				request.body = message;
				request.actions = [ "Oops!"];
				nova.notifications.add(request);
			} else {
				// Remove issues
				issuesCol.remove(doc.uri);

				// Cancel old notification
				nova.notifications.cancel("min-mess");
			}
		});
		process.start();
		if(nova.inDevMode()) {
			console.log("Exit minifyJavascript()");
		}
	}
}

module.exports = MinifierService;
