(function($) {

var suite = Echo.Tests.Unit.Configuration = function() {};

suite.prototype.info = {
	"className": "Echo.Configuration",
	"functions": [

		// public interface
		"get",
		"set",
		"remove",
		"extend",
		"getAsHash",

		// private methods
		"_clearCacheByPrefix"
	]
};

suite.prototype.data = {
	"original": { // default values
		"key1": 1,
		"key2": {
			"key2-1": "key2-1 value",
			"key2-2": {
				"key2-2-1": "key2-2-1 value"
			}
		},
		"key3": true,
		"key6": [1,2,3,4,5],
		"key8": $("<div>"),
		"key9": $("<p>"),
		"key10": true,
		"key11": true,
		"key12": {"a": 1, "b": 2},
		"key13": {"b": 1, "c": 2},
		"key14": {"a": 1, "b": 2}
	},
	"overrides": { // master values
		"key2": {
			"key2-1": "NEW key2-1 value"
		},
		"key3": false,
		"key4": "Value from overrides object",
		"key5": 10,
		"key6": [6,7,8],
		"key8": $("<span>"),
		"key10": undefined,
		"key11": null,
		"key12": {},
		"key13": {"b": 3},
		"key14": undefined
	}
};

suite.prototype.tests = {};

suite.prototype.tests.PublicInterfaceTests = {
	"check": function() {
		this.checkBasicOperations([this.data.original], "[primary only]");
		this.checkBasicOperations([this.data.original, this.data.overrides], "[overrides]");
		this.checkIncomingData();
	}
};

suite.prototype.tests.PrivateFunctionsTests = {
	"check": function() {
		var original = this.data.original;
		var overrides = this.data.overrides;

		var config = new Echo.Configuration(overrides, original);

		config._clearCacheByPrefix("key2");
		QUnit.equal(config.cache["key2"], undefined,
			"Checking if internal cache was cleared");

		QUnit.equal(config.cache["key2.key2-2"], undefined,
			"Checking if nested structure was cleared after the root key was removed");
	}
};

suite.prototype.clone = function(obj) {
	var self = this;
	var target = $.isArray(obj) ? [] : {};
	$.each(obj, function(key, val) {
		if ($.isPlainObject(val) || $.isArray(val)) {
			target[key] = self.clone(val);
		} else {
			target[key] = val;
		}
	});
	return target;
};

suite.prototype.checkBasicOperations = function(args, note) {
	var original = this.clone(args[0]);
	var overrides = args[1] && this.clone(args[1]);
	var config = new Echo.Configuration(overrides, original);

	QUnit.deepEqual(this.data.original, original,
		note + " Checking if original object \"original\" wasn't changed");

	original["key1"] = 10;
	QUnit.equal(config.get("key1"), 1,
		note + " Checking if the updates of the original object affects config object");

	config.set("key1", 5);
	QUnit.equal(original["key1"], 10,
		note + " Checking if updates of the config doesn't affect original object");

	QUnit.equal(original["key6"].length, 5,
		note + " Check if the orginal array remains the same");

	config.set("key2.key2-2.key2-2-1", "New value");
	QUnit.equal(config.get("key2.key2-2.key2-2-1"), "New value",
		note + " Checking nested keys assignment");

	config.set("newkey1.newkey2.newkey3", 100);
	QUnit.equal(config.get("newkey1.newkey2.newkey3"), 100,
		note + " Checking new nested keys assignment");
	QUnit.equal(config.get("newkey1.newkey2")["newkey3"], 100,
		note + " Check if new nested keys creation also creates implicit objects");

	QUnit.equal(config.get("somekey", "somevalue"), "somevalue",
		note + " Checking default value extraction within the get() function");

	config.set("key", false);
	QUnit.equal(config.get("key", "somevalue"), false,
		note + " Checking if the 'false' is not treated as a reason to use defaults");
	config.set("key", undefined);
	QUnit.equal(config.get("key", "somevalue"), "somevalue",
		note + " Checking if the 'undefined' IS treated as a reason to use defaults");
	config.set("key", 0);
	QUnit.equal(config.get("key", "somevalue"), 0,
		note + " Checking if the '0' char is not treated as a reason to use defaults");
	config.set("key", null);
	QUnit.equal(config.get("key", "somevalue"), null,
		note + " Checking if the 'null' is not treated as a reason to use defaults");

	var dump = config.getAsHash();
	var condition =
		dump["key1"] == config.get("key1") &&
		dump["key5"] == config.get("key5");
	QUnit.equal(condition, true,
		note + " Check if we dump the right value (checking some fields)");

	config.set("key1", "value1");
	var dump = config.getAsHash();
	dump["key1"] = 15;
	QUnit.equal(config.get("key1"), "value1",
		note + " Check if changing the value in the dump doesn't affect config values");
	config.set("key1", "value2");
	QUnit.equal(dump["key1"], 15,
		note + " Check if the dump remains the same after config update");

	config.extend({"key1": 100, "key7": "key7 value", "key2": {"key2-2": "key2-2 value"}});
	var condition =
		config.get("key1") == 100 &&
		config.get("key7") == "key7 value" &&
		config.get("key2.key2-2") == "key2-2 value";
	QUnit.equal(condition, true,
		note + " Check if we extend the config instance correctly via extend() method");

	config.remove("key1");
	QUnit.equal(config.get("key1"), undefined,
		note + " Check the remove() method with simple values");

	config.remove("key2.key2-2");
	QUnit.equal(config.get("key2.key2-2"), undefined,
		note + " Check the remove() method with objects defined as values");
	QUnit.equal(config.get("key2.key2-2.key2-2-1"), undefined,
		note + " Check the remove() method with objects defined as values, checking if nested structure was cleared");

	if (overrides) {
		QUnit.deepEqual(this.data.overrides, overrides,
			note + " Checking if original object \"overrides\" wasn't changed");

		QUnit.equal(config.get("key3"), false,
			note + " Checking if the default config values were overriden correctly");

		QUnit.equal(config.get("key4"), overrides["key4"],
			note + " Checking if the new values were added into the master config");

		overrides["key4"] = "Another value from overrides object";
		QUnit.equal(config.get("key4"), "Value from overrides object",
			note + " Checking if updates of the overrides object affects config config");

		config.set("key5", 50);
		QUnit.equal(overrides["key5"], 10,
			note + " Checking if updates of the config doesn't affect overrides object");

		QUnit.equal(config.get("key6").length, 3,
			note + " Check if we override the Array type values completely");

		QUnit.equal(config.get("key8"), overrides["key8"],
			note + " Checking if the default config jQuery values were overriden correctly (key exists)");
		QUnit.equal(config.get("key9"), original["key9"],
			note + " Checking if the default config jQuery values were overriden correctly (key undefined)");
		QUnit.equal(config.get("key10"), overrides["key10"],
			note + " Checking if the default configuration do not override undefined key");
		QUnit.equal(config.get("key11"), overrides["key11"],
			note + " Checking if the default configuration do not override null key");
		QUnit.deepEqual(config.get("key12"), original["key12"],
			note + " Checking if the default config values were merged correctly with empty object");
		QUnit.deepEqual(config.get("key13"), {"b": 3, "c": 2},
			note + " Checking if the default config values were merged correctly with non empty object");
		QUnit.equal(config.get("key14"), overrides["key14"],
			note + " Checking if the default configuration do not override undefined key (default key is object)");
	}
};

suite.prototype.checkIncomingData = function() {
	// checking if the config update doesn't affect incoming data...
	var incoming = {};
	incoming.defaults = {
		"int": 1,
		"arr": [{"arr_key1": 1}, {"arr_key2": {"sub_key2": 10}}],
		"obj": {"obj_key1": "obj_key1_value", "obj_key2": {"key": false}},
		"str": "string value"
	};
	incoming.override = {
		"int": 15,
		"arr": [{"arr_key1": 50}, {"arr_key2": {}}, {"arr_key3": "some string"}],
		"obj": {"obj_key1": "obj_key1_value_override"},
		"str": "string value override"
	};
	var snapshot = {
		"defaults": $.extend(true, {}, incoming.defaults),
		"override": $.extend(true, {}, incoming.override)
	};
	var config = new Echo.Configuration(incoming.override, incoming.defaults);
	config.set("int", 75);
	config.set("str", "new string");
	config.get("arr")[0].arr_key1 = 100;
	config.set("obj.obj_key1", "new value");
	QUnit.deepEqual(incoming.defaults, snapshot.defaults,
		"Checking whether the incoming defaults data is not affected after config.set operation");
	QUnit.deepEqual(incoming.override, snapshot.override,
		"Checking whether the incoming overrides data is not affected after config.set operation");
};

})(Echo.jQuery);
