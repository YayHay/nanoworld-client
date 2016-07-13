/*
nanorender
Simple character rendering engine

Copyright (c) 2016 Hizkia Felix / HizkiFW
*/

var Nano = {
	context: null,
	canvas: null,
	fps: 30,
	currFps: 0,
	framesDrawn: 0,
	characters: {},
	images: {},
	imdat: {},
	res: "./",
	
	init: function(canvas, fps, res) {
		Nano.context = canvas.getContext("2d");
		Nano.canvas = canvas;
		Nano.fps = typeof fps === "undefined" ? 30 : fps;
		Nano.res = typeof res === "string" ? res : "./";
		
		setInterval(Nano.render, 1000 / Nano.fps);
		setInterval(function() {
			Nano.GlobalState.state += (Nano.GlobalState.state < Nano.fps*2 ? 1 : -Nano.fps*2);
			Nano.GlobalState.idle = Math.abs(Nano.GlobalState.state - Nano.fps) / 8;
		}, 1000 / Nano.fps);
		setInterval(function() {
			Nano.currFps = Nano.framesDrawn;
			Nano.framesDrawn = 0;
		}, 1000);
	},
	
	render: function() {
		Nano.Draw.clear();
		
		if(Object.keys(Nano.characters).length > 0) {
			var sort = [];
			for(var name in Nano.characters) {
				sort.push([name, Nano.characters[name].pos[1]]);
			}
			sort.sort(function(a, b) {
				return a[1] - b[1];
			});
			for(var i = 0; i < sort.length; i++) {
				Nano.Draw.character(sort[i][0]);
			}
		}
		
		Nano.context.font = "12px sans-serif";
		Nano.context.fillText(Nano.currFps + "fps/" + Object.keys(Nano.characters).length + "e", 10, 20);
		
		Nano.framesDrawn++;
	},
	
	getImage: function(name) {
		if(typeof Nano.images[name] === "undefined") {
			Nano.images[name] = new Image();
			Nano.images[name].onerror = function() {
				Nano.images[name].src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
			}
			Nano.images[name].src = Nano.res + "images/" + name + ".png";
			Nano.getImageData(name);
		}
		return Nano.images[name];
	},
	getImageData: function(name) {
		if(typeof Nano.imdat[name] === "undefined") {
			Nano.imdat[name] = {pos:[0,0],axis:[0,0]};
			Nano.xhr("GET", Nano.res + "images/" + name + ".txt", "", function(data) {
				if(data !== false)
					Nano.imdat[name] = JSON.parse(data);
				else
					Nano.imdat[name] = {pos:[0,0],axis:[0,0]};
			});
		}
		return Nano.imdat[name];
	},
	
	xhr: function(method, url, data, callback) {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(xhttp.readyState == 4 && xhttp.status == 200)
				callback(xhttp.responseText);
			else if(xhttp.status == 404)
				callback(false);
		};
		xhttp.onerror = function() {
			callback(false);
		};
		xhttp.open(method, url, true);
		xhttp.send(data);
	},
	
	GlobalState: {
		state: 0,
		idle: 0
	},
	Characters: {
		create: function(name, parts, traits, pos, facing) {
			if(typeof Nano.characters[name] !== "undefined") return false;
			return Nano.Characters.set(name, parts, traits, pos, facing);
		},
		modify: function(name, parts, traits, pos, facing) {
			if(typeof Nano.characters[name] === "undefined") return false;
			return Nano.Characters.set(name, parts, traits, pos, facing);
		},
		set: function(name, parts, traits, pos, facing) {
			Nano.characters[name] = {
				parts: parts,
				traits: traits,
				pos: pos,
				facing: (facing || 1)
			};
			return true;
		},
		get: function(name) {
			return Nano.characters[name] || false;
		},
		list: function() {
			return Object.keys(Nano.characters);
		},
		move: function(name, pos, y) {
			if(typeof Nano.characters[name] === "undefined") return false;
			if(typeof y === "undefined")
				Nano.characters[name].pos = pos;
			else
				Nano.characters[name].pos = [pos, y];
			return true;
		},
		face: function(name, direction) {
			if(typeof Nano.characters[name] === "undefined") return false;
			Nano.characters[name].facing = direction;
		},
		faceAway: function(name) {
			if(typeof Nano.characters[name] === "undefined") return false;
			Nano.characters[name].facing = (Nano.characters[name].facing > 0 ? -1 : 1);
		},
		destroy: function(name) {
			delete Nano.characters[name];
		}
	},
	Draw: {
		clear: function() {
			//Nano.canvas.width = Nano.canvas.width;
			Nano.context.fillStyle = "white";
			Nano.context.fillRect(0, 0, Nano.canvas.width, Nano.canvas.height);
		},
		ellipse: function(centerX, centerY, width, height, color) {
			Nano.context.beginPath();
			Nano.context.moveTo(centerX, centerY - height / 2);
			Nano.context.bezierCurveTo(
				centerX + width / 2, centerY - height / 2,
				centerX + width / 2, centerY + height / 2,
				centerX, centerY + height / 2);
			Nano.context.bezierCurveTo(
				centerX - width / 2, centerY + height / 2,
				centerX - width / 2, centerY - height / 2,
				centerX, centerY - height / 2);
			Nano.context.fillStyle = typeof color === "undefined" ? "black" : color;
			Nano.context.fill();
			Nano.context.closePath();
		},
		image: function(image, angle, positionX, positionY, axisX, axisY, flip) {
			if(angle == 0 && !flip)
				return Nano.context.drawImage(image, positionX - axisX, positionY - axisY);
			var angleInRad = Math.PI / 180 * angle;
			Nano.context.translate(positionX, positionY);
			Nano.context.rotate(angleInRad);
			if(flip) Nano.context.scale(-1, 1);
			Nano.context.drawImage(image, -axisX, -axisY);
			if(flip) Nano.context.scale(-1, 1);
			Nano.context.rotate(-angleInRad);
			Nano.context.translate(-positionX, -positionY);
		},
		character: function(name) {
			var chr = Nano.characters[name],
				i = Nano.GlobalState.idle,
				f = chr.facing,
				
				//Image
				il = Nano.getImage("legs" + (chr.parts.legs || 1)),
				ib = Nano.getImage("body" + (chr.parts.body || 1)),
				ih = Nano.getImage("head" + (chr.parts.head || 1)),
				ia = Nano.getImage("hair" + (chr.parts.hair || 1)),
				ir = Nano.getImage("arms" + (chr.parts.arms || 1)),
				iy = Nano.getImage("eyes" + (chr.parts.eyes || 1)),
				im = Nano.getImage("mouth" + (chr.parts.mouth || 1)),
				
				//Data
				dl = Nano.getImageData("legs" + (chr.parts.legs || 1)),
				dt = Nano.getImageData("body" + (chr.parts.body || 1)),
				dh = Nano.getImageData("head" + (chr.parts.head || 1)),
				da = Nano.getImageData("hair" + (chr.parts.hair || 1)),
				dr = Nano.getImageData("arms" + (chr.parts.arms || 1)),
				dy = Nano.getImageData("eyes" + (chr.parts.eyes || 1)),
				dm = Nano.getImageData("mouth" + (chr.parts.mouth || 1));
				
			//Shadow
			Nano.Draw.ellipse(chr.pos[0], chr.pos[1] + ib.height/2 + il.height - 10, ih.width + 30, 8, "rgba(0,0,0,0.7)");
			
			//LeftArm
			Nano.Draw.image(ir, f*-5 + f*i,
				chr.pos[0] + (dr.pos[0]*f || 0) + (f < 0 ? -10 : 32), chr.pos[1] + (dr.pos[1]*f || 0) - 8,
				(dr.axis[0]*f || 16), (dr.axis[1]*f || 16));
			
			//Legs
			Nano.Draw.image(il, 0,
				chr.pos[0] + (dl.pos[0]*f || 0) + (f > 0 ? 10 : -10), chr.pos[1] + ib.height / 2 + (dl.pos[1]*f || 0) - 10,
				(dl.axis[0]*f || 0), (dl.axis[1]*f || 0), f < 0);
				
			//Body
			Nano.Draw.image(ib, 0,
				chr.pos[0] + (dt.pos[0]*f || 0), chr.pos[1] + (dt.pos[1]*f || 0) + (i/2),
				ib.width / 2  + (dt.axis[0]*f || 0), ib.height / 2 + (dt.axis[0]*f || 0));
				
			//Legs
			Nano.Draw.image(il, 0,
				chr.pos[0] + (dl.pos[0]*f || 0) + (f < 0 ? 20 : -20), chr.pos[1] + ib.height / 2 + (dl.pos[1]*f || 0) - 10,
				(dl.axis[0]*f || 0), (dl.axis[1]*f || 0), f < 0);
				
			//RightArm
			Nano.Draw.image(ir, f*(5 - i),
				chr.pos[0] + (dr.pos[0]*f || 0) + (f > 0 ? -5 : 25), chr.pos[1] + (dr.pos[1]*f || 0) - 8,
				(dr.axis[0]*f || 16), (dr.axis[1]*f || 16));
				
			//Head
			Nano.Draw.image(ih, i/2*f,
				chr.pos[0] + (dh.pos[0]*f || 0), chr.pos[1] - (ib.height / 1.5) + (dh.pos[1]*f || 0) + i,
				ih.width / 2  + (dh.axis[0]*f || 0), ih.height / 2 + (dh.axis[0]*f || 0));
				
			//Eyes
			Nano.Draw.image(iy, i/2*f,
				chr.pos[0] + (dy.pos[0]*f || 0) + (f * iy.width / 2), chr.pos[1] - ((ib.height / 1.5) - ih.height / 2) + (dy.pos[1]*f || 0) + i,
				iy.width / 2  + (dy.axis[0]*f || 0), ih.height / 2 + (dy.axis[0]*f || 0), f < 0);
				
			//Mouth
			Nano.Draw.image(im, i/2*f,
				chr.pos[0] + (dm.pos[0]*f || 0) + (f * im.width), chr.pos[1] - ((ib.height / 1.5) - ih.height / 2) + iy.height + (dm.pos[1]*f || 0) + i,
				im.width / 2  + (dm.axis[0]*f || 0), ih.height / 2 + (dm.axis[0]*f || 0), f < 0);
				
			//Hair
			Nano.Draw.image(ia, i/2*f,
				chr.pos[0] + (da.pos[0]*f || 0), chr.pos[1] - (ib.height / 1.5) + (da.pos[1]*f || 0) - 15 + i,
				ia.width / 2  + (da.axis[0]*f || 0), ih.height / 2 + (da.axis[0]*f || 0), f < 0);
		}
	}
};
