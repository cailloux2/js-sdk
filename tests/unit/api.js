(function($) {

Echo.Tests.module("Echo.API", {
	"meta": {
		"className": "Echo.API",
		// TODO: cover all these methods with tests
		"functions": [
			"Request.send",
			"Request.request",
			"Request.abort",
			"Transports.WebSocket.available",
			"Transports.WebSocket.send",
			"Transports.WebSocket.abort",
			"Transports.WebSocket.connected",
			"Transports.WebSocket.connecting",
			"Transports.WebSocket.closed",
			"Transports.WebSocket.closing",
			"Transports.WebSocket.subscribe",
			"Transports.WebSocket.unsubscribe",
			"Transports.WebSocket.keepConnection",
			"Transports.WebSocket.publish",
			"Transports.AJAX.available",
			"Transports.AJAX.send",
			"Transports.AJAX.abort",
			"Transports.XDomainRequest.available",
			"Transports.JSONP.available",
			"Transports.JSONP.send",
			"Transports.JSONP.abort",
			"Transport.send",
			"Transport.abort"
		]
	}
});

Echo.Tests.test("private interface", function() {
	var req = new Echo.API.Request({
		"endpoint": "some_endpoint",
		"onSomeEvent": function() {},
		"onSomeEvent2": function() {},
		"onemotion": true
	});
	QUnit.equal("//" + req._prepareURI(), "{%=baseURLs.api.streamserver%}/v1/some_endpoint", "Checking URI assembler for transport url");
	var handlers = req._getHandlersByConfig();
	QUnit.ok("onSomeEvent" in handlers && "onSomeEvent2" in handlers, "Checking that component can retrieve event handlers from config");

	var request = function(url) {
		return new Echo.API.Request({
			"endpoint": "endpoint",
			"apiBaseURL": url
		});
	};
	QUnit.equal(request("https://example.com/v1/")._prepareURI(), "example.com/v1/endpoint", "[_prepareURI] https:// in URL");
	QUnit.equal(request("http://example.com/v1/")._prepareURI(), "example.com/v1/endpoint", "[_prepareURI] \"http://\" in URL");
	QUnit.equal(request("wss://example.com/v1/")._prepareURI(), "example.com/v1/endpoint", "[_prepareURI] \"wss://\" in URL");
	QUnit.equal(request("//example.com/v1/")._prepareURI(), "example.com/v1/endpoint", "[_prepareURI] \"//\" in URL");
	QUnit.equal(request("example.com/v1/")._prepareURI(), "example.com/v1/endpoint", "[_prepareURI] no protocol in URL");
});

if (Echo.API.Transports.WebSocket.available()) {
	Echo.Tests.asyncTest("WebSocket test cases", function() {
		var closed = 0;
		var requests = [];
		var deferred = [];
		var closeDef = [];
		for(var i = 0; i < 4; i++) {
			deferred.push($.Deferred());
			closeDef.push($.Deferred());
			(function(i) {
				requests.push(
					new Echo.API.Request({
						"endpoint": "ws",
						"apiBaseURL": "live.echoenabled.com/v1/",
						"transport": "websocket",
						"onClose": function() {
							closed++;
							closeDef[i].resolve();
						},
						"onOpen": function() {
							if (i === 0) {
								QUnit.ok(requests[0].transport.connected(), "Check if WS was initialized and \"onOpen\" event fired");
							}
							deferred[i].resolve();
						}
					})
				);
				if (i === 0) {
					QUnit.ok(requests[0].transport.connecting(), "Check that WS status is \"connecting\"");
				}
			})(i);
		}
		var req = requests[0];
		$.when.apply($, deferred).done(function() {
			QUnit.ok(true, "Check if all API requests initialized");
			QUnit.strictEqual(
				$.grep(requests, function(req) {
					return req.transport.connected();
				}).length,
				4, "Check that each statuses of the requests are \"connected\""
			);
			QUnit.strictEqual(
				Echo.Utils.foldl(0, Echo.API.Transports.WebSocket.socketByURI, function(_, acc) {
					return ++acc;
				}),
				1, "Check that 4 API objects initialized and only one WS object instantiated"
			);
			QUnit.strictEqual(
				Echo.Utils.foldl(0, Echo.API.Transports.WebSocket.socketByURI[req.transport.config.get("uri")].subscribers, function(_, acc) {
					return ++acc;
				}),
				4, "Check that 4 API objects initialized and 4 subscriptions initialized"
			);
			req.abort();
			QUnit.strictEqual(
				Echo.Utils.foldl(0, Echo.API.Transports.WebSocket.socketByURI[req.transport.config.get("uri")].subscribers, function(_, acc) {
					return ++acc;
				}),
				3, "Check that subscription removed in case of request abortion"
			);
			$.map(requests, function(r) {
				r.abort();
			});
			QUnit.strictEqual(
				$.grep(requests, function(req) {
					return req.transport.closing();
				}).length,
				4, "Check that each statuses of the requests are \"closing\""
			);
			QUnit.ok($.isEmptyObject(Echo.API.Transports.WebSocket.socketByURI[req.transport.config.get("uri")].subscribers), "Check that all subscription removed in case of all requests abortion");
			$.when.apply($, closeDef).done(function() {
				QUnit.strictEqual(closed, 4, "Check that all subscribed connections are closed (\"onClose\" event fired)");
				QUnit.strictEqual(
					$.grep(requests, function(req) {
						return req.transport.closed();
					}).length,
					4, "Check that each statuses of the requests are \"closed\""
				);
				QUnit.strictEqual(
					$.grep(requests, function(req) {
						return $.isEmptyObject(req.timers);
					}).length,
					4, "Check that all timers are cleared after closing a connection"
				);
				QUnit.start();
			});
		});
	}, {"timeout": 10000});
}

Echo.Tests.test("Transports JSONP method POST", function() {
	(new Echo.API.Request({
		"apiBaseURL": "//example.com/v1/",
		"endpoint": "test",
		"method": "POST",
		"transport": "jsonp",
		"onData": function() {
			QUnit.ok(true, "Check if Transport JSONP works with POST method");
		},
		"data": {"test": true}
	})).request();
});

Echo.Tests.test("Ckeck transport noramalizer", function() {
	var createRequest = function(transport) {
		return new Echo.API.Request({
			"apiBaseURL": "//example.com/v1/",
			"endpoint": "test",
			"transport": transport,
			"onData": function() {},
			"data": {"test": true}
		});
	};

	var tests = [{
		"transport": "ajax",
		"inspection": "AJAX"
	}, {
		"transport": "jsonp",
		"inspection": "JSONP"
	}, {
		"transport": undefined,
		"inspection": "AJAX"
	}, {
		"transport": "json",
		"inspection": "AJAX"
	}, {
		"transport": 123,
		"inspection": "AJAX"
	}];

	$.map(tests, function(item) {
		var request = createRequest(item.transport);
		QUnit.equal(request.config.get("transport"), item.inspection, "Check transport if specified transport is " + item.transport);
	});
});

})(Echo.jQuery);
