/*
nanorender
Basic WS multiplayer

Copyright (c) 2016 Hizkia Felix / HizkiFW
*/

var Nano = Nano || {};

Nano.Multi = {
	ws: null,
	defaultServer: "wss://nanoworld-server.herokuapp.com",
	fails: 0,
	guid: null,
	Callbacks: {},
	players: {},
	
	connect: function(server, callback) {
		server = server || Nano.Multi.defaultServer;
		if(typeof server === "function") {
			callback = server;
			server = Nano.Multi.defaultServer;
		}
		
		Nano.Multi.ws = new WebSocket(server);
		
		Nano.Multi.ws.onopen = function(e) {
			Nano.Multi.fails = 0;
			if(typeof callback === "function")
				callback(e);
		};
		Nano.Multi.ws.onclose = function(e) {
			Nano.Multi.fails++;
			if(Nano.Multi.fails < 5)
				Nano.Multi.connect(server, callback);
		};
		Nano.Multi.ws.onmessage = function(e) {
			var d = JSON.parse(e.data);
			console.log("RCV: " + e.data);
			if(d.subject == "connection" && d.status == "success")
				Nano.Multi.guid = d.data.guid;
			else if(d.subject == "login") {
				Nano.Multi.Callbacks.login(d.status);
			} else if(d.subject == "world") {
				if(d.status == "success")
					Nano.Render.world = d.data;
			} else if(d.subject == "list") {
				if(d.status == "success") {
					Nano.Multi.players = d.data;
					var playersNow = [],
						playersNew = [],
						tmp = {};
						
					for(var c in Nano.Render.characters)
						playersNow.push(c);
					
					for(var p = 0; p < d.data.length; p++) {
						playersNew.push(d.data[p].uname);
						tmp[d.data[p].uname] = p;
					}
					
					var add = playersNew.filter(function(i) {return playersNow.indexOf(i) < 0;});
					var sub = playersNow.filter(function(i) {return playersNew.indexOf(i) < 0;});
					
					for(var i = 0; i < sub.length; i++) {
						Nano.Render.Characters.destroy(sub[i]);
					}
					for(var i = 0; i < add.length; i++) {
						var c = d.data[tmp[add[i]]];
						Nano.Render.Characters.create(add[i], c.character.parts, c.character.traits, c.pos, c.facing);
					}
				}
			}
		};
	},
	sendPacket: function(act, dat) {
		Nano.Multi.ws.send(JSON.stringify({act:act,data:dat}));
		console.log("SND: " + JSON.stringify({act:act,data:dat}));
	},
	Auth: {
		login: function(uname, pass, callback) {
			Nano.Multi.Callbacks.login = callback;
			Nano.Multi.sendPacket("login", {user: uname, pass: pass});
		}
	},
	Game: {
		World: {
			loadPublic: function(name) {
				Nano.Multi.sendPacket("get", {get: "world", type: "public", name: name});
			},
			listPlayersPublic: function(name) {
				Nano.Multi.sendPacket("list", {list: "players", world: {type: "public", name: name}});
			}
		},
		Player: {
			joinPublicWorld: function(name) {
				Nano.Multi.sendPacket("enter", {type: "public", name: name});
			},
			moveTo: function(x, y) {
				if(typeof x === "object") {
					y = x[1];
					x = x[0];
				}
				Nano.Multi.sendPacket("move", {pos: [x, y]});
			}
		}
	}
}
