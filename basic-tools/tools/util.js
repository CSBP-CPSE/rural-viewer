'use strict';
	
export default class Util {
	
	/**
	* Merges an object into another object. 
	*
	* Parameters :
	*	a : Object, the object that will receive the properties 
	*	b : Object, the object to merge into object A
	* Return : the modified Object
	*/
	static Mixin(a, b) {				
		for (var key in b) {
			if (b.hasOwnProperty(key)) a[key] = b[key];
		}

		// TODO : Why did I use arguments[0] instead of a?
		return arguments[0];
	}
	
	/**
	* Debounces a function. The function will be executed after a timeout 
	* unless the function is called again in which case, the timeout will
	* reset
	*
	* Parameters :
	*	delegate : Function, the Function to debounce
	*	threshold : Integer, the timeout length, in milliseconds
	* Return : Function, the debounced function
	*/
	static Debounce(delegate, threshold) {
		var timeout;
	
		return function debounced () {
			
			function delayed () {
				delegate.apply(this, arguments);
				
				timeout = null; 
			}
	 
			if (timeout) clearTimeout(timeout);
	 
			timeout = setTimeout(delayed.bind(this), threshold || 100); 
		};
	}
	
	/**
	* Formats a String using substitute strings
	*
	* Parameters :
	*	str : String, the String to format
	*	subs : Array(String), An array of Strings to substitute into the String
	* Return : String, the formatted String
	*/
	static Format(str, subs) {
		if (!subs || subs.length == 0) return str;
		
		var s = str;

		for (var i = 0; i < subs.length; i++) {
			var reg = new RegExp("\\{" + i + "\\}", "gm");
			s = s.replace(reg, subs[i]);
		}

		return s;
	}
	
	static FirstProperty(obj) {
		var props = Object.getOwnPropertyNames(obj);
		
		return obj[props[0]];
	}
	
	static JoinData(dArray){
		var ds = ""
		for (var i = 0; i < dArray.length; i++) {
			var d = dArray[i];			
			if (i > 0){
				var lines = d.split('\n');
				// remove one line, starting at the first position
				lines.splice(0,1);
				// join the array back into a single string
				d = lines.join('\n');
			}
			ds = ds.concat(d);
		}
		
		return ds
	}

	static ParseCsv(csv) {		
		var s = 0;
		var i = 0;
		
		var lines = [[]];
		
		while (s < csv.length) {
			if (csv[s] == '"') {
				s++;
				
				var e = csv.indexOf('"', s);
				var st = csv.substr(s, e - s);
				
				if (st == "-999"){st = ".";}
				
				lines[i].push(st);
				
				
				e++;
			}
			else {
				var e1 = csv.indexOf(',', s);
				var e2 = csv.indexOf('\n', s);
								
				var e = (e1 >??-1 && e1 <??e2) ? e1 : e2;							
				
				var st = csv.substr(s, e - s);
				
				if (st == "-999"){st = ".";}
				
				lines[i].push(st);
					
				if (e == e2) {					
					lines.push([]);
					
					i++;
				}
			}
				
			s = e + 1;
		}
		return lines;
		
		//return csv.trim().split(/\r\n|\n/).map(l => {
		//	return l.split(',');
		//});
	}
	
	static DisableFocusable(nodes, disabled) {
		var focusable = ["button", "fieldset", "input", "optgroup", "option", "select", "textarea"];
		
		nodes.forEach(n => {
			var selection = n.querySelectorAll(focusable);
			
			if (selection.length ==??0) return;
			
			for (var i = 0; i <??selection.length; i++) selection[i].disabled = disabled;
		});
	}	
}