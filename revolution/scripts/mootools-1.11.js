//MooTools, My Object Oriented Javascript Tools. Copyright (c) 2006-2007 Valerio Proietti, <http://mad4milk.net>, MIT Style License.

var MooTools = {
	version: '1.11'
};

function $defined(obj){
	return (obj != undefined);
};

function $type(obj){
	if (!$defined(obj)) return false;
	if (obj.htmlElement) return 'element';
	var type = typeof obj;
	if (type == 'object' && obj.nodeName){
		switch(obj.nodeType){
			case 1: return 'element';
			case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
		}
	}
	if (type == 'object' || type == 'function'){
		switch(obj.constructor){
			case Array: return 'array';
			case RegExp: return 'regexp';
			case Class: return 'class';
		}
		if (typeof obj.length == 'number'){
			if (obj.item) return 'collection';
			if (obj.callee) return 'arguments';
		}
	}
	return type;
};

function $merge(){
	var mix = {};
	for (var i = 0; i < arguments.length; i++){
		for (var property in arguments[i]){
			var ap = arguments[i][property];
			var mp = mix[property];
			if (mp && $type(ap) == 'object' && $type(mp) == 'object') mix[property] = $merge(mp, ap);
			else mix[property] = ap;
		}
	}
	return mix;
};

var $extend = function(){
	var args = arguments;
	if (!args[1]) args = [this, args[0]];
	for (var property in args[1]) args[0][property] = args[1][property];
	return args[0];
};

var $native = function(){
	for (var i = 0, l = arguments.length; i < l; i++){
		arguments[i].extend = function(props){
			for (var prop in props){
				if (!this.prototype[prop]) this.prototype[prop] = props[prop];
				if (!this[prop]) this[prop] = $native.generic(prop);
			}
		};
	}
};

$native.generic = function(prop){
	return function(bind){
		return this.prototype[prop].apply(bind, Array.prototype.slice.call(arguments, 1));
	};
};

$native(Function, Array, String, Number);

function $chk(obj){
	return !!(obj || obj === 0);
};

function $pick(obj, picked){
	return $defined(obj) ? obj : picked;
};

function $random(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
};

function $time(){
	return new Date().getTime();
};

function $clear(timer){
	clearTimeout(timer);
	clearInterval(timer);
	return null;
};

var Abstract = function(obj){
	obj = obj || {};
	obj.extend = $extend;
	return obj;
};

var Window = new Abstract(window);
var Document = new Abstract(document);
document.head = document.getElementsByTagName('head')[0];

window.xpath = !!(document.evaluate);
if (window.ActiveXObject) window.ie = window[window.XMLHttpRequest ? 'ie7' : 'ie6'] = true;
else if (document.childNodes && !document.all && !navigator.taintEnabled) window.webkit = window[window.xpath ? 'webkit420' : 'webkit419'] = true;
else if (document.getBoxObjectFor != null) window.gecko = true;

window.khtml = window.webkit;

Object.extend = $extend;

if (typeof HTMLElement == 'undefined'){
	var HTMLElement = function(){};
	if (window.webkit) document.createElement("iframe");
	HTMLElement.prototype = (window.webkit) ? window["[[DOMElement.prototype]]"] : {};
}
HTMLElement.prototype.htmlElement = function(){};

if (window.ie6) try {document.execCommand("BackgroundImageCache", false, true);} catch(e){};

var Class = function(properties){
	var klass = function(){
		return (arguments[0] !== null && this.initialize && $type(this.initialize) == 'function') ? this.initialize.apply(this, arguments) : this;
	};
	$extend(klass, this);
	klass.prototype = properties;
	klass.constructor = Class;
	return klass;
};

Class.empty = function(){};

Class.prototype = {

	extend: function(properties){
		var proto = new this(null);
		for (var property in properties){
			var pp = proto[property];
			proto[property] = Class.Merge(pp, properties[property]);
		}
		return new Class(proto);
	},

	implement: function(){
		for (var i = 0, l = arguments.length; i < l; i++) $extend(this.prototype, arguments[i]);
	}

};

Class.Merge = function(previous, current){
	if (previous && previous != current){
		var type = $type(current);
		if (type != $type(previous)) return current;
		switch(type){
			case 'function':
				var merged = function(){
					this.parent = arguments.callee.parent;
					return current.apply(this, arguments);
				};
				merged.parent = previous;
				return merged;
			case 'object': return $merge(previous, current);
		}
	}
	return current;
};

var Chain = new Class({

	chain: function(fn){
		this.chains = this.chains || [];
		this.chains.push(fn);
		return this;
	},

	callChain: function(){
		if (this.chains && this.chains.length) this.chains.shift().delay(10, this);
	},

	clearChain: function(){
		this.chains = [];
	}

});

var Events = new Class({

	addEvent: function(type, fn){
		if (fn != Class.empty){
			this.$events = this.$events || {};
			this.$events[type] = this.$events[type] || [];
			this.$events[type].include(fn);
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		if (this.$events && this.$events[type]){
			this.$events[type].each(function(fn){
				fn.create({'bind': this, 'delay': delay, 'arguments': args})();
			}, this);
		}
		return this;
	},

	removeEvent: function(type, fn){
		if (this.$events && this.$events[type]) this.$events[type].remove(fn);
		return this;
	}

});

var Options = new Class({

	setOptions: function(){
		this.options = $merge.apply(null, [this.options].extend(arguments));
		if (this.addEvent){
			for (var option in this.options){
				if ($type(this.options[option] == 'function') && (/^on[A-Z]/).test(option)) this.addEvent(option, this.options[option]);
			}
		}
		return this;
	}

});

Array.extend({

	forEach: function(fn, bind){
		for (var i = 0, j = this.length; i < j; i++) fn.call(bind, this[i], i, this);
	},

	filter: function(fn, bind){
		var results = [];
		for (var i = 0, j = this.length; i < j; i++){
			if (fn.call(bind, this[i], i, this)) results.push(this[i]);
		}
		return results;
	},

	map: function(fn, bind){
		var results = [];
		for (var i = 0, j = this.length; i < j; i++) results[i] = fn.call(bind, this[i], i, this);
		return results;
	},

	every: function(fn, bind){
		for (var i = 0, j = this.length; i < j; i++){
			if (!fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	some: function(fn, bind){
		for (var i = 0, j = this.length; i < j; i++){
			if (fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},

	indexOf: function(item, from){
		var len = this.length;
		for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	copy: function(start, length){
		start = start || 0;
		if (start < 0) start = this.length + start;
		length = length || (this.length - start);
		var newArray = [];
		for (var i = 0; i < length; i++) newArray[i] = this[start++];
		return newArray;
	},

	remove: function(item){
		var i = 0;
		var len = this.length;
		while (i < len){
			if (this[i] === item){
				this.splice(i, 1);
				len--;
			} else {
				i++;
			}
		}
		return this;
	},

	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},

	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	extend: function(array){
		for (var i = 0, j = array.length; i < j; i++) this.push(array[i]);
		return this;
	},

	merge: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},

	getRandom: function(){
		return this[$random(0, this.length - 1)] || null;
	},

	getLast: function(){
		return this[this.length - 1] || null;
	}

});

Array.prototype.each = Array.prototype.forEach;
Array.each = Array.forEach;

function $A(array){
	return Array.copy(array);
};

function $each(iterable, fn, bind){
	if (iterable && typeof iterable.length == 'number' && $type(iterable) != 'object'){
		Array.forEach(iterable, fn, bind);
	} else {
		 for (var name in iterable) fn.call(bind || iterable, iterable[name], name);
	}
};

Array.prototype.test = Array.prototype.contains;

String.extend({

	test: function(regex, params){
		return (($type(regex) == 'string') ? new RegExp(regex, params) : regex).test(this);
	},

	toInt: function(){
		return parseInt(this, 10);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	camelCase: function(){
		return this.replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return this.replace(/\w[A-Z]/g, function(match){
			return (match.charAt(0) + '-' + match.charAt(1).toLowerCase());
		});
	},

	capitalize: function(){
		return this.replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	trim: function(){
		return this.replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return this.replace(/\s{2,}/g, ' ').trim();
	},

	rgbToHex: function(array){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : false;
	},

	hexToRgb: function(array){
		var hex = this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : false;
	},

	contains: function(string, s){
		return (s) ? (s + this + s).indexOf(s + string + s) > -1 : this.indexOf(string) > -1;
	},

	escapeRegExp: function(){
		return this.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
	}

});

Array.extend({

	rgbToHex: function(array){
		if (this.length < 3) return false;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return array ? hex : '#' + hex.join('');
	},

	hexToRgb: function(array){
		if (this.length != 3) return false;
		var rgb = [];
		for (var i = 0; i < 3; i++){
			rgb.push(parseInt((this[i].length == 1) ? this[i] + this[i] : this[i], 16));
		}
		return array ? rgb : 'rgb(' + rgb.join(',') + ')';
	}

});

Function.extend({

	create: function(options){
		var fn = this;
		options = $merge({
			'bind': fn,
			'event': false,
			'arguments': null,
			'delay': false,
			'periodical': false,
			'attempt': false
		}, options);
		if ($chk(options.arguments) && $type(options.arguments) != 'array') options.arguments = [options.arguments];
		return function(event){
			var args;
			if (options.event){
				event = event || window.event;
				args = [(options.event === true) ? event : new options.event(event)];
				if (options.arguments) args.extend(options.arguments);
			}
			else args = options.arguments || arguments;
			var returns = function(){
				return fn.apply($pick(options.bind, fn), args);
			};
			if (options.delay) return setTimeout(returns, options.delay);
			if (options.periodical) return setInterval(returns, options.periodical);
			if (options.attempt) try {return returns();} catch(err){return false;};
			return returns();
		};
	},

	pass: function(args, bind){
		return this.create({'arguments': args, 'bind': bind});
	},

	attempt: function(args, bind){
		return this.create({'arguments': args, 'bind': bind, 'attempt': true})();
	},

	bind: function(bind, args){
		return this.create({'bind': bind, 'arguments': args});
	},

	bindAsEventListener: function(bind, args){
		return this.create({'bind': bind, 'event': true, 'arguments': args});
	},

	delay: function(delay, bind, args){
		return this.create({'delay': delay, 'bind': bind, 'arguments': args})();
	},

	periodical: function(interval, bind, args){
		return this.create({'periodical': interval, 'bind': bind, 'arguments': args})();
	}

});

Number.extend({

	toInt: function(){
		return parseInt(this);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	round: function(precision){
		precision = Math.pow(10, precision || 0);
		return Math.round(this * precision) / precision;
	},

	times: function(fn){
		for (var i = 0; i < this; i++) fn(i);
	}

});

var Element = new Class({

	initialize: function(el, props){
		if ($type(el) == 'string'){
			if (window.ie && props && (props.name || props.type)){
				var name = (props.name) ? ' name="' + props.name + '"' : '';
				var type = (props.type) ? ' type="' + props.type + '"' : '';
				delete props.name;
				delete props.type;
				el = '<' + el + name + type + '>';
			}
			el = document.createElement(el);
		}
		el = $(el);
		return (!props || !el) ? el : el.set(props);
	}

});

var Elements = new Class({

	initialize: function(elements){
		return (elements) ? $extend(elements, this) : this;
	}

});

Elements.extend = function(props){
	for (var prop in props){
		this.prototype[prop] = props[prop];
		this[prop] = $native.generic(prop);
	}
};

function $(el){
	if (!el) return null;
	if (el.htmlElement) return Garbage.collect(el);
	if ([window, document].contains(el)) return el;
	var type = $type(el);
	if (type == 'string'){
		el = document.getElementById(el);
		type = (el) ? 'element' : false;
	}
	if (type != 'element') return null;
	if (el.htmlElement) return Garbage.collect(el);
	if (['object', 'embed'].contains(el.tagName.toLowerCase())) return el;
	$extend(el, Element.prototype);
	el.htmlElement = function(){};
	return Garbage.collect(el);
};

document.getElementsBySelector = document.getElementsByTagName;

function $$(){
	var elements = [];
	for (var i = 0, j = arguments.length; i < j; i++){
		var selector = arguments[i];
		switch($type(selector)){
			case 'element': elements.push(selector);
			case 'boolean': break;
			case false: break;
			case 'string': selector = document.getElementsBySelector(selector, true);
			default: elements.extend(selector);
		}
	}
	return $$.unique(elements);
};

$$.unique = function(array){
	var elements = [];
	for (var i = 0, l = array.length; i < l; i++){
		if (array[i].$included) continue;
		var element = $(array[i]);
		if (element && !element.$included){
			element.$included = true;
			elements.push(element);
		}
	}
	for (var n = 0, d = elements.length; n < d; n++) elements[n].$included = null;
	return new Elements(elements);
};

Elements.Multi = function(property){
	return function(){
		var args = arguments;
		var items = [];
		var elements = true;
		for (var i = 0, j = this.length, returns; i < j; i++){
			returns = this[i][property].apply(this[i], args);
			if ($type(returns) != 'element') elements = false;
			items.push(returns);
		};
		return (elements) ? $$.unique(items) : items;
	};
};

Element.extend = function(properties){
	for (var property in properties){
		HTMLElement.prototype[property] = properties[property];
		Element.prototype[property] = properties[property];
		Element[property] = $native.generic(property);
		var elementsProperty = (Array.prototype[property]) ? property + 'Elements' : property;
		Elements.prototype[elementsProperty] = Elements.Multi(property);
	}
};

Element.extend({

	set: function(props){
		for (var prop in props){
			var val = props[prop];
			switch(prop){
				case 'styles': this.setStyles(val); break;
				case 'events': if (this.addEvents) this.addEvents(val); break;
				case 'properties': this.setProperties(val); break;
				default: this.setProperty(prop, val);
			}
		}
		return this;
	},

	inject: function(el, where){
		el = $(el);
		switch(where){
			case 'before': el.parentNode.insertBefore(this, el); break;
			case 'after':
				var next = el.getNext();
				if (!next) el.parentNode.appendChild(this);
				else el.parentNode.insertBefore(this, next);
				break;
			case 'top':
				var first = el.firstChild;
				if (first){
					el.insertBefore(this, first);
					break;
				}
			default: el.appendChild(this);
		}
		return this;
	},

	injectBefore: function(el){
		return this.inject(el, 'before');
	},

	injectAfter: function(el){
		return this.inject(el, 'after');
	},

	injectInside: function(el){
		return this.inject(el, 'bottom');
	},

	injectTop: function(el){
		return this.inject(el, 'top');
	},

	adopt: function(){
		var elements = [];
		$each(arguments, function(argument){
			elements = elements.concat(argument);
		});
		$$(elements).inject(this);
		return this;
	},

	remove: function(){
		return this.parentNode.removeChild(this);
	},

	clone: function(contents){
		var el = $(this.cloneNode(contents !== false));
		if (!el.$events) return el;
		el.$events = {};
		for (var type in this.$events) el.$events[type] = {
			'keys': $A(this.$events[type].keys),
			'values': $A(this.$events[type].values)
		};
		return el.removeEvents();
	},

	replaceWith: function(el){
		el = $(el);
		this.parentNode.replaceChild(el, this);
		return el;
	},

	appendText: function(text){
		this.appendChild(document.createTextNode(text));
		return this;
	},

	hasClass: function(className){
		return this.className.contains(className, ' ');
	},

	addClass: function(className){
		if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
		return this;
	},

	removeClass: function(className){
		this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1').clean();
		return this;
	},

	toggleClass: function(className){
		return this.hasClass(className) ? this.removeClass(className) : this.addClass(className);
	},

	setStyle: function(property, value){
		switch(property){
			case 'opacity': return this.setOpacity(parseFloat(value));
			case 'float': property = (window.ie) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		switch($type(value)){
			case 'number': if (!['zIndex', 'zoom'].contains(property)) value += 'px'; break;
			case 'array': value = 'rgb(' + value.join(',') + ')';
		}
		this.style[property] = value;
		return this;
	},

	setStyles: function(source){
		switch($type(source)){
			case 'object': Element.setMany(this, 'setStyle', source); break;
			case 'string': this.style.cssText = source;
		}
		return this;
	},

	setOpacity: function(opacity){
		if (opacity == 0){
			if (this.style.visibility != "hidden") this.style.visibility = "hidden";
		} else {
			if (this.style.visibility != "visible") this.style.visibility = "visible";
		}
		if (!this.currentStyle || !this.currentStyle.hasLayout) this.style.zoom = 1;
		if (window.ie) this.style.filter = (opacity == 1) ? '' : "alpha(opacity=" + opacity * 100 + ")";
		this.style.opacity = this.$tmp.opacity = opacity;
		return this;
	},

	getStyle: function(property){
		property = property.camelCase();
		var result = this.style[property];
		if (!$chk(result)){
			if (property == 'opacity') return this.$tmp.opacity;
			result = [];
			for (var style in Element.Styles){
				if (property == style){
					Element.Styles[style].each(function(s){
						var style = this.getStyle(s);
						result.push(parseInt(style) ? style : '0px');
					}, this);
					if (property == 'border'){
						var every = result.every(function(bit){
							return (bit == result[0]);
						});
						return (every) ? result[0] : false;
					}
					return result.join(' ');
				}
			}
			if (property.contains('border')){
				if (Element.Styles.border.contains(property)){
					return ['Width', 'Style', 'Color'].map(function(p){
						return this.getStyle(property + p);
					}, this).join(' ');
				} else if (Element.borderShort.contains(property)){
					return ['Top', 'Right', 'Bottom', 'Left'].map(function(p){
						return this.getStyle('border' + p + property.replace('border', ''));
					}, this).join(' ');
				}
			}
			if (document.defaultView) result = document.defaultView.getComputedStyle(this, null).getPropertyValue(property.hyphenate());
			else if (this.currentStyle) result = this.currentStyle[property];
		}
		if (window.ie) result = Element.fixStyle(property, result, this);
		if (result && property.test(/color/i) && result.contains('rgb')){
			return result.split('rgb').splice(1,4).map(function(color){
				return color.rgbToHex();
			}).join(' ');
		}
		return result;
	},

	getStyles: function(){
		return Element.getMany(this, 'getStyle', arguments);
	},

	walk: function(brother, start){
		brother += 'Sibling';
		var el = (start) ? this[start] : this[brother];
		while (el && $type(el) != 'element') el = el[brother];
		return $(el);
	},

	getPrevious: function(){
		return this.walk('previous');
	},

	getNext: function(){
		return this.walk('next');
	},

	getFirst: function(){
		return this.walk('next', 'firstChild');
	},

	getLast: function(){
		return this.walk('previous', 'lastChild');
	},

	getParent: function(){
		return $(this.parentNode);
	},

	getChildren: function(){
		return $$(this.childNodes);
	},

	hasChild: function(el){
		return !!$A(this.getElementsByTagName('*')).contains(el);
	},

	getProperty: function(property){
		var index = Element.Properties[property];
		if (index) return this[index];
		var flag = Element.PropertiesIFlag[property] || 0;
		if (!window.ie || flag) return this.getAttribute(property, flag);
		var node = this.attributes[property];
		return (node) ? node.nodeValue : null;
	},

	removeProperty: function(property){
		var index = Element.Properties[property];
		if (index) this[index] = '';
		else this.removeAttribute(property);
		return this;
	},

	getProperties: function(){
		return Element.getMany(this, 'getProperty', arguments);
	},

	setProperty: function(property, value){
		var index = Element.Properties[property];
		if (index) this[index] = value;
		else this.setAttribute(property, value);
		return this;
	},

	setProperties: function(source){
		return Element.setMany(this, 'setProperty', source);
	},

	setHTML: function(){
		this.innerHTML = $A(arguments).join('');
		return this;
	},

	setText: function(text){
		var tag = this.getTag();
		if (['style', 'script'].contains(tag)){
			if (window.ie){
				if (tag == 'style') this.styleSheet.cssText = text;
				else if (tag ==  'script') this.setProperty('text', text);
				return this;
			} else {
				this.removeChild(this.firstChild);
				return this.appendText(text);
			}
		}
		this[$defined(this.innerText) ? 'innerText' : 'textContent'] = text;
		return this;
	},

	getText: function(){
		var tag = this.getTag();
		if (['style', 'script'].contains(tag)){
			if (window.ie){
				if (tag == 'style') return this.styleSheet.cssText;
				else if (tag ==  'script') return this.getProperty('text');
			} else {
				return this.innerHTML;
			}
		}
		return ($pick(this.innerText, this.textContent));
	},

	getTag: function(){
		return this.tagName.toLowerCase();
	},

	empty: function(){
		Garbage.trash(this.getElementsByTagName('*'));
		return this.setHTML('');
	}

});

Element.fixStyle = function(property, result, element){
	if ($chk(parseInt(result))) return result;
	if (['height', 'width'].contains(property)){
		var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'];
		var size = 0;
		values.each(function(value){
			size += element.getStyle('border-' + value + '-width').toInt() + element.getStyle('padding-' + value).toInt();
		});
		return element['offset' + property.capitalize()] - size + 'px';
	} else if (property.test(/border(.+)Width|margin|padding/)){
		return '0px';
	}
	return result;
};

Element.Styles = {'border': [], 'padding': [], 'margin': []};
['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	for (var style in Element.Styles) Element.Styles[style].push(style + direction);
});

Element.borderShort = ['borderWidth', 'borderStyle', 'borderColor'];

Element.getMany = function(el, method, keys){
	var result = {};
	$each(keys, function(key){
		result[key] = el[method](key);
	});
	return result;
};

Element.setMany = function(el, method, pairs){
	for (var key in pairs) el[method](key, pairs[key]);
	return el;
};

Element.Properties = new Abstract({
	'class': 'className', 'for': 'htmlFor', 'colspan': 'colSpan', 'rowspan': 'rowSpan',
	'accesskey': 'accessKey', 'tabindex': 'tabIndex', 'maxlength': 'maxLength',
	'readonly': 'readOnly', 'frameborder': 'frameBorder', 'value': 'value',
	'disabled': 'disabled', 'checked': 'checked', 'multiple': 'multiple', 'selected': 'selected'
});
Element.PropertiesIFlag = {
	'href': 2, 'src': 2
};

Element.Methods = {
	Listeners: {
		addListener: function(type, fn){
			if (this.addEventListener) this.addEventListener(type, fn, false);
			else this.attachEvent('on' + type, fn);
			return this;
		},

		removeListener: function(type, fn){
			if (this.removeEventListener) this.removeEventListener(type, fn, false);
			else this.detachEvent('on' + type, fn);
			return this;
		}
	}
};

window.extend(Element.Methods.Listeners);
document.extend(Element.Methods.Listeners);
Element.extend(Element.Methods.Listeners);

var Garbage = {

	elements: [],

	collect: function(el){
		if (!el.$tmp){
			Garbage.elements.push(el);
			el.$tmp = {'opacity': 1};
		}
		return el;
	},

	trash: function(elements){
		for (var i = 0, j = elements.length, el; i < j; i++){
			if (!(el = elements[i]) || !el.$tmp) continue;
			if (el.$events) el.fireEvent('trash').removeEvents();
			for (var p in el.$tmp) el.$tmp[p] = null;
			for (var d in Element.prototype) el[d] = null;
			Garbage.elements[Garbage.elements.indexOf(el)] = null;
			el.htmlElement = el.$tmp = el = null;
		}
		Garbage.elements.remove(null);
	},

	empty: function(){
		Garbage.collect(window);
		Garbage.collect(document);
		Garbage.trash(Garbage.elements);
	}

};

window.addListener('beforeunload', function(){
	window.addListener('unload', Garbage.empty);
	if (window.ie) window.addListener('unload', CollectGarbage);
});

var Event = new Class({

	initialize: function(event){
		if (event && event.$extended) return event;
		this.$extended = true;
		event = event || window.event;
		this.event = event;
		this.type = event.type;
		this.target = event.target || event.srcElement;
		if (this.target.nodeType == 3) this.target = this.target.parentNode;
		this.shift = event.shiftKey;
		this.control = event.ctrlKey;
		this.alt = event.altKey;
		this.meta = event.metaKey;
		if (['DOMMouseScroll', 'mousewheel'].contains(this.type)){
			this.wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
		} else if (this.type.contains('key')){
			this.code = event.which || event.keyCode;
			for (var name in Event.keys){
				if (Event.keys[name] == this.code){
					this.key = name;
					break;
				}
			}
			if (this.type == 'keydown'){
				var fKey = this.code - 111;
				if (fKey > 0 && fKey < 13) this.key = 'f' + fKey;
			}
			this.key = this.key || String.fromCharCode(this.code).toLowerCase();
		} else if (this.type.test(/(click|mouse|menu)/)){
			this.page = {
				'x': event.pageX || event.clientX + document.documentElement.scrollLeft,
				'y': event.pageY || event.clientY + document.documentElement.scrollTop
			};
			this.client = {
				'x': event.pageX ? event.pageX - window.pageXOffset : event.clientX,
				'y': event.pageY ? event.pageY - window.pageYOffset : event.clientY
			};
			this.rightClick = (event.which == 3) || (event.button == 2);
			switch(this.type){
				case 'mouseover': this.relatedTarget = event.relatedTarget || event.fromElement; break;
				case 'mouseout': this.relatedTarget = event.relatedTarget || event.toElement;
			}
			this.fixRelatedTarget();
		}
		return this;
	},

	stop: function(){
		return this.stopPropagation().preventDefault();
	},

	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},

	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}

});

Event.fix = {

	relatedTarget: function(){
		if (this.relatedTarget && this.relatedTarget.nodeType == 3) this.relatedTarget = this.relatedTarget.parentNode;
	},

	relatedTargetGecko: function(){
		try {Event.fix.relatedTarget.call(this);} catch(e){this.relatedTarget = this.target;}
	}

};

Event.prototype.fixRelatedTarget = (window.gecko) ? Event.fix.relatedTargetGecko : Event.fix.relatedTarget;

Event.keys = new Abstract({
	'enter': 13,
	'up': 38,
	'down': 40,
	'left': 37,
	'right': 39,
	'esc': 27,
	'space': 32,
	'backspace': 8,
	'tab': 9,
	'delete': 46
});

Element.Methods.Events = {

	addEvent: function(type, fn){
		this.$events = this.$events || {};
		this.$events[type] = this.$events[type] || {'keys': [], 'values': []};
		if (this.$events[type].keys.contains(fn)) return this;
		this.$events[type].keys.push(fn);
		var realType = type;
		var custom = Element.Events[type];
		if (custom){
			if (custom.add) custom.add.call(this, fn);
			if (custom.map) fn = custom.map;
			if (custom.type) realType = custom.type;
		}
		if (!this.addEventListener) fn = fn.create({'bind': this, 'event': true});
		this.$events[type].values.push(fn);
		return (Element.NativeEvents.contains(realType)) ? this.addListener(realType, fn) : this;
	},

	removeEvent: function(type, fn){
		if (!this.$events || !this.$events[type]) return this;
		var pos = this.$events[type].keys.indexOf(fn);
		if (pos == -1) return this;
		var key = this.$events[type].keys.splice(pos,1)[0];
		var value = this.$events[type].values.splice(pos,1)[0];
		var custom = Element.Events[type];
		if (custom){
			if (custom.remove) custom.remove.call(this, fn);
			if (custom.type) type = custom.type;
		}
		return (Element.NativeEvents.contains(type)) ? this.removeListener(type, value) : this;
	},

	addEvents: function(source){
		return Element.setMany(this, 'addEvent', source);
	},

	removeEvents: function(type){
		if (!this.$events) return this;
		if (!type){
			for (var evType in this.$events) this.removeEvents(evType);
			this.$events = null;
		} else if (this.$events[type]){
			this.$events[type].keys.each(function(fn){
				this.removeEvent(type, fn);
			}, this);
			this.$events[type] = null;
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		if (this.$events && this.$events[type]){
			this.$events[type].keys.each(function(fn){
				fn.create({'bind': this, 'delay': delay, 'arguments': args})();
			}, this);
		}
		return this;
	},

	cloneEvents: function(from, type){
		if (!from.$events) return this;
		if (!type){
			for (var evType in from.$events) this.cloneEvents(from, evType);
		} else if (from.$events[type]){
			from.$events[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}

};

window.extend(Element.Methods.Events);
document.extend(Element.Methods.Events);
Element.extend(Element.Methods.Events);

Element.Events = new Abstract({

	'mouseenter': {
		type: 'mouseover',
		map: function(event){
			event = new Event(event);
			if (event.relatedTarget != this && !this.hasChild(event.relatedTarget)) this.fireEvent('mouseenter', event);
		}
	},

	'mouseleave': {
		type: 'mouseout',
		map: function(event){
			event = new Event(event);
			if (event.relatedTarget != this && !this.hasChild(event.relatedTarget)) this.fireEvent('mouseleave', event);
		}
	},

	'mousewheel': {
		type: (window.gecko) ? 'DOMMouseScroll' : 'mousewheel'
	}

});

Element.NativeEvents = [
	'click', 'dblclick', 'mouseup', 'mousedown',
	'mousewheel', 'DOMMouseScroll',
	'mouseover', 'mouseout', 'mousemove',
	'keydown', 'keypress', 'keyup',
	'load', 'unload', 'beforeunload', 'resize', 'move',
	'focus', 'blur', 'change', 'submit', 'reset', 'select',
	'error', 'abort', 'contextmenu', 'scroll'
];

Function.extend({

	bindWithEvent: function(bind, args){
		return this.create({'bind': bind, 'arguments': args, 'event': Event});
	}

});

Element.extend({

	getValue: function(){
		switch(this.getTag()){
			case 'select':
				var values = [];
				$each(this.options, function(option){
					if (option.selected) values.push($pick(option.value, option.text));
				});
				return (this.multiple) ? values : values[0];
			case 'input': if (!(this.checked && ['checkbox', 'radio'].contains(this.type)) && !['hidden', 'text', 'password'].contains(this.type)) break;
			case 'textarea': return this.value;
		}
		return false;
	},

	getFormElements: function(){
		return $$(this.getElementsByTagName('input'), this.getElementsByTagName('select'), this.getElementsByTagName('textarea'));
	},

	toQueryString: function(){
		var queryString = [];
		this.getFormElements().each(function(el){
			var name = el.name;
			var value = el.getValue();
			if (value === false || !name || el.disabled) return;
			var qs = function(val){
				queryString.push(name + '=' + encodeURIComponent(val));
			};
			if ($type(value) == 'array') value.each(qs);
			else qs(value);
		});
		return queryString.join('&');
	}

});

var Fx = {};

Fx.Base = new Class({

	options: {
		onStart: Class.empty,
		onComplete: Class.empty,
		onCancel: Class.empty,
		transition: function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		},
		duration: 500,
		unit: 'px',
		wait: true,
		fps: 50
	},

	initialize: function(options){
		this.element = this.element || null;
		this.setOptions(options);
		if (this.options.initialize) this.options.initialize.call(this);
	},

	step: function(){
		var time = $time();
		if (time < this.time + this.options.duration){
			this.delta = this.options.transition((time - this.time) / this.options.duration);
			this.setNow();
			this.increase();
		} else {
			this.stop(true);
			this.set(this.to);
			this.fireEvent('onComplete', this.element, 10);
			this.callChain();
		}
	},

	set: function(to){
		this.now = to;
		this.increase();
		return this;
	},

	setNow: function(){
		this.now = this.compute(this.from, this.to);
	},

	compute: function(from, to){
		return (to - from) * this.delta + from;
	},

	start: function(from, to){
		if (!this.options.wait) this.stop();
		else if (this.timer) return this;
		this.from = from;
		this.to = to;
		this.change = this.to - this.from;
		this.time = $time();
		this.timer = this.step.periodical(Math.round(1000 / this.options.fps), this);
		this.fireEvent('onStart', this.element);
		return this;
	},

	stop: function(end){
		if (!this.timer) return this;
		this.timer = $clear(this.timer);
		if (!end) this.fireEvent('onCancel', this.element);
		return this;
	}/*compatibility*/,

	custom: function(from, to){
		return this.start(from, to);
	},

	clearTimer: function(end){
		return this.stop(end);
	}

});

Fx.Base.implement(new Chain, new Events, new Options);

Fx.CSS = {

	select: function(property, to){
		if (property.test(/color/i)) return this.Color;
		var type = $type(to);
		if ((type == 'array') || (type == 'string' && to.contains(' '))) return this.Multi;
		return this.Single;
	},

	parse: function(el, property, fromTo){
		if (!fromTo.push) fromTo = [fromTo];
		var from = fromTo[0], to = fromTo[1];
		if (!$chk(to)){
			to = from;
			from = el.getStyle(property);
		}
		var css = this.select(property, to);
		return {'from': css.parse(from), 'to': css.parse(to), 'css': css};
	}

};

Fx.CSS.Single = {

	parse: function(value){
		return parseFloat(value);
	},

	getNow: function(from, to, fx){
		return fx.compute(from, to);
	},

	getValue: function(value, unit, property){
		if (unit == 'px' && property != 'opacity') value = Math.round(value);
		return value + unit;
	}

};

Fx.CSS.Multi = {

	parse: function(value){
		return value.push ? value : value.split(' ').map(function(v){
			return parseFloat(v);
		});
	},

	getNow: function(from, to, fx){
		var now = [];
		for (var i = 0; i < from.length; i++) now[i] = fx.compute(from[i], to[i]);
		return now;
	},

	getValue: function(value, unit, property){
		if (unit == 'px' && property != 'opacity') value = value.map(Math.round);
		return value.join(unit + ' ') + unit;
	}

};

Fx.CSS.Color = {

	parse: function(value){
		return value.push ? value : value.hexToRgb(true);
	},

	getNow: function(from, to, fx){
		var now = [];
		for (var i = 0; i < from.length; i++) now[i] = Math.round(fx.compute(from[i], to[i]));
		return now;
	},

	getValue: function(value){
		return 'rgb(' + value.join(',') + ')';
	}

};

Fx.Elements = Fx.Base.extend({

	initialize: function(elements, options){
		this.elements = $$(elements);
		this.parent(options);
	},

	setNow: function(){
		for (var i in this.from){
			var iFrom = this.from[i], iTo = this.to[i], iCss = this.css[i], iNow = this.now[i] = {};
			for (var p in iFrom) iNow[p] = iCss[p].getNow(iFrom[p], iTo[p], this);
		}
	},

	set: function(to){
		var parsed = {};
		this.css = {};
		for (var i in to){
			var iTo = to[i], iCss = this.css[i] = {}, iParsed = parsed[i] = {};
			for (var p in iTo){
				iCss[p] = Fx.CSS.select(p, iTo[p]);
				iParsed[p] = iCss[p].parse(iTo[p]);
			}
		}
		return this.parent(parsed);
	},

	start: function(obj){
		if (this.timer && this.options.wait) return this;
		this.now = {};
		this.css = {};
		var from = {}, to = {};
		for (var i in obj){
			var iProps = obj[i], iFrom = from[i] = {}, iTo = to[i] = {}, iCss = this.css[i] = {};
			for (var p in iProps){
				var parsed = Fx.CSS.parse(this.elements[i], p, iProps[p]);
				iFrom[p] = parsed.from;
				iTo[p] = parsed.to;
				iCss[p] = parsed.css;
			}
		}
		return this.parent(from, to);
	},

	increase: function(){
		for (var i in this.now){
			var iNow = this.now[i], iCss = this.css[i];
			for (var p in iNow) this.elements[i].setStyle(p, iCss[p].getValue(iNow[p], this.options.unit, p));
		}
	}

});

Fx.Slide = Fx.Base.extend({

	options: {
		mode: 'vertical'
	},

	initialize: function(el, options){
		this.element = $(el);
		this.wrapper = new Element('div', {'styles': $extend(this.element.getStyles('margin'), {'overflow': 'hidden'})}).injectAfter(this.element).adopt(this.element);
		this.element.setStyle('margin', 0);
		this.setOptions(options);
		this.now = [];
		this.parent(this.options);
		this.open = true;
		this.addEvent('onComplete', function(){
			this.open = (this.now[0] === 0);
		});
		if (window.webkit419) this.addEvent('onComplete', function(){
			if (this.open) this.element.remove().inject(this.wrapper);
		});
	},

	setNow: function(){
		for (var i = 0; i < 2; i++) this.now[i] = this.compute(this.from[i], this.to[i]);
	},

	vertical: function(){
		this.margin = 'margin-top';
		this.layout = 'height';
		this.offset = this.element.offsetHeight;
	},

	horizontal: function(){
		this.margin = 'margin-left';
		this.layout = 'width';
		this.offset = this.element.offsetWidth;
	},

	slideIn: function(mode){
		this[mode || this.options.mode]();
		return this.start([this.element.getStyle(this.margin).toInt(), this.wrapper.getStyle(this.layout).toInt()], [0, this.offset]);
	},

	slideOut: function(mode){
		this[mode || this.options.mode]();
		return this.start([this.element.getStyle(this.margin).toInt(), this.wrapper.getStyle(this.layout).toInt()], [-this.offset, 0]);
	},

	hide: function(mode){
		this[mode || this.options.mode]();
		this.open = false;
		return this.set([-this.offset, 0]);
	},

	show: function(mode){
		this[mode || this.options.mode]();
		this.open = true;
		return this.set([0, this.offset]);
	},

	toggle: function(mode){
		if (this.wrapper.offsetHeight == 0 || this.wrapper.offsetWidth == 0) return this.slideIn(mode);
		return this.slideOut(mode);
	},

	increase: function(){
		this.element.setStyle(this.margin, this.now[0] + this.options.unit);
		this.wrapper.setStyle(this.layout, this.now[1] + this.options.unit);
	}

});

var XHR = new Class({

	options: {
		method: 'post',
		async: true,
		onRequest: Class.empty,
		onSuccess: Class.empty,
		onFailure: Class.empty,
		urlEncoded: true,
		encoding: 'utf-8',
		autoCancel: false,
		headers: {}
	},

	setTransport: function(){
		this.transport = (window.XMLHttpRequest) ? new XMLHttpRequest() : (window.ie ? new ActiveXObject('Microsoft.XMLHTTP') : false);
		return this;
	},

	initialize: function(options){
		this.setTransport().setOptions(options);
		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.headers = {};
		if (this.options.urlEncoded && this.options.method == 'post'){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.setHeader('Content-type', 'application/x-www-form-urlencoded' + encoding);
		}
		if (this.options.initialize) this.options.initialize.call(this);
	},

	onStateChange: function(){
		if (this.transport.readyState != 4 || !this.running) return;
		this.running = false;
		var status = 0;
		try {status = this.transport.status;} catch(e){};
		if (this.options.isSuccess.call(this, status)) this.onSuccess();
		else this.onFailure();
		this.transport.onreadystatechange = Class.empty;
	},

	isSuccess: function(status){
		return ((status >= 200) && (status < 300));
	},

	onSuccess: function(){
		this.response = {
			'text': this.transport.responseText,
			'xml': this.transport.responseXML
		};
		this.fireEvent('onSuccess', [this.response.text, this.response.xml]);
		this.callChain();
	},

	onFailure: function(){
		this.fireEvent('onFailure', this.transport);
	},

	setHeader: function(name, value){
		this.headers[name] = value;
		return this;
	},

	send: function(url, data){
		if (this.options.autoCancel) this.cancel();
		else if (this.running) return this;
		this.running = true;
		if (data && this.options.method == 'get'){
			url = url + (url.contains('?') ? '&' : '?') + data;
			data = null;
		}
		this.transport.open(this.options.method.toUpperCase(), url, this.options.async);
		this.transport.onreadystatechange = this.onStateChange.bind(this);
		if ((this.options.method == 'post') && this.transport.overrideMimeType) this.setHeader('Connection', 'close');
		$extend(this.headers, this.options.headers);
		for (var type in this.headers) try {this.transport.setRequestHeader(type, this.headers[type]);} catch(e){};
		this.fireEvent('onRequest');
		this.transport.send($pick(data, null));
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.transport.abort();
		this.transport.onreadystatechange = Class.empty;
		this.setTransport();
		this.fireEvent('onCancel');
		return this;
	}

});

XHR.implement(new Chain, new Events, new Options);

var Ajax = XHR.extend({

	options: {
		data: null,
		update: null,
		onComplete: Class.empty,
		evalScripts: false,
		evalResponse: false
	},

	initialize: function(url, options){
		this.addEvent('onSuccess', this.onComplete);
		this.setOptions(options);
		this.options.data = this.options.data || this.options.postBody;
		if (!['post', 'get'].contains(this.options.method)){
			this._method = '_method=' + this.options.method;
			this.options.method = 'post';
		}
		this.parent();
		this.setHeader('X-Requested-With', 'XMLHttpRequest');
		this.setHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*');
		this.url = url;
	},

	onComplete: function(){
		if (this.options.update) $(this.options.update).empty().setHTML(this.response.text);
		if (this.options.evalScripts || this.options.evalResponse) this.evalScripts();
		this.fireEvent('onComplete', [this.response.text, this.response.xml], 20);
	},

	request: function(data){
		data = data || this.options.data;
		switch($type(data)){
			case 'element': data = $(data).toQueryString(); break;
			case 'object': data = Object.toQueryString(data);
		}
		if (this._method) data = (data) ? [this._method, data].join('&') : this._method;
		return this.send(this.url, data);
	},

	evalScripts: function(){
		var script, scripts;
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) scripts = this.response.text;
		else {
			scripts = [];
			var regexp = /<script[^>]*>([\s\S]*?)<\/script>/gi;
			while ((script = regexp.exec(this.response.text))) scripts.push(script[1]);
			scripts = scripts.join('\n');
		}
		if (scripts) (window.execScript) ? window.execScript(scripts) : window.setTimeout(scripts, 0);
	},

	getHeader: function(name){
		try {return this.transport.getResponseHeader(name);} catch(e){};
		return null;
	}

});

Object.toQueryString = function(source){
	var queryString = [];
	for (var property in source) queryString.push(encodeURIComponent(property) + '=' + encodeURIComponent(source[property]));
	return queryString.join('&');
};

Element.extend({

	send: function(options){
		return new Ajax(this.getProperty('action'), $merge({data: this.toQueryString()}, options, {method: 'post'})).request();
	}

});

var Accordion = Fx.Elements.extend({

	options: {
		onActive: Class.empty,
		onBackground: Class.empty,
		display: 0,
		show: false,
		height: true,
		width: false,
		opacity: true,
		fixedHeight: false,
		fixedWidth: false,
		wait: false,
		alwaysHide: false
	},

	initialize: function(){
		var options, togglers, elements, container;
		$each(arguments, function(argument, i){
			switch($type(argument)){
				case 'object': options = argument; break;
				case 'element': container = $(argument); break;
				default:
					var temp = $$(argument);
					if (!togglers) togglers = temp;
					else elements = temp;
			}
		});
		this.togglers = togglers || [];
		this.elements = elements || [];
		this.container = $(container);
		this.setOptions(options);
		this.previous = -1;
		if (this.options.alwaysHide) this.options.wait = true;
		if ($chk(this.options.show)){
			this.options.display = false;
			this.previous = this.options.show;
		}
		if (this.options.start){
			this.options.display = false;
			this.options.show = false;
		}
		this.effects = {};
		if (this.options.opacity) this.effects.opacity = 'fullOpacity';
		if (this.options.width) this.effects.width = this.options.fixedWidth ? 'fullWidth' : 'offsetWidth';
		if (this.options.height) this.effects.height = this.options.fixedHeight ? 'fullHeight' : 'scrollHeight';
		for (var i = 0, l = this.togglers.length; i < l; i++) this.addSection(this.togglers[i], this.elements[i]);
		this.elements.each(function(el, i){
			if (this.options.show === i){
				this.fireEvent('onActive', [this.togglers[i], el]);
			} else {
				for (var fx in this.effects) el.setStyle(fx, 0);
			}
		}, this);
		this.parent(this.elements);
		if ($chk(this.options.display)) this.display(this.options.display);
	},

	addSection: function(toggler, element, pos){
		toggler = $(toggler);
		element = $(element);
		var test = this.togglers.contains(toggler);
		var len = this.togglers.length;
		this.togglers.include(toggler);
		this.elements.include(element);
		if (len && (!test || pos)){
			pos = $pick(pos, len - 1);
			toggler.injectBefore(this.togglers[pos]);
			element.injectAfter(toggler);
		} else if (this.container && !test){
			toggler.inject(this.container);
			element.inject(this.container);
		}
		var idx = this.togglers.indexOf(toggler);
		toggler.addEvent('click', this.display.bind(this, idx));
		if (this.options.height) element.setStyles({'padding-top': 0, 'border-top': 'none', 'padding-bottom': 0, 'border-bottom': 'none'});
		if (this.options.width) element.setStyles({'padding-left': 0, 'border-left': 'none', 'padding-right': 0, 'border-right': 'none'});
		element.fullOpacity = 1;
		if (this.options.fixedWidth) element.fullWidth = this.options.fixedWidth;
		if (this.options.fixedHeight) element.fullHeight = this.options.fixedHeight;
		element.setStyle('overflow', 'hidden');
		if (!test){
			for (var fx in this.effects) element.setStyle(fx, 0);
		}
		return this;
	},

	display: function(index){
		index = ($type(index) == 'element') ? this.elements.indexOf(index) : index;
		if ((this.timer && this.options.wait) || (index === this.previous && !this.options.alwaysHide)) return this;
		this.previous = index;
		var obj = {};
		this.elements.each(function(el, i){
			obj[i] = {};
			var hide = (i != index) || (this.options.alwaysHide && (el.offsetHeight > 0));
			this.fireEvent(hide ? 'onBackground' : 'onActive', [this.togglers[i], el]);
			for (var fx in this.effects) obj[i][fx] = hide ? 0 : el[this.effects[fx]];
		}, this);
		return this.start(obj);
	},

	showThisHideOpen: function(index){return this.display(index);}

});

Fx.Accordion = Accordion;