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
	world: {},
	view: {
		x: 0,
		y: 0
	},
	
	init: function(canvas, fps, res) {
		Nano.context = canvas.getContext("2d");
		Nano.canvas = canvas;
		Nano.fps = typeof fps === "undefined" ? 30 : fps;
		Nano.res = typeof res === "string" ? res : "./";
		
		Nano.view.x = canvas.width / 2;
		Nano.context.imageSmoothingEnabled = true;
		
		//setInterval(Nano.render, 1000 / Nano.fps);
		window.requestAnimationFrame(Nano.render);
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
		
		Nano.Draw.ground();
		
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
		
		//Nano.context.font = "12px sans-serif";
		//Nano.context.fillText(Nano.currFps + "fps/" + Object.keys(Nano.characters).length + "e", 10, 20);
		
		Nano.framesDrawn++;
		window.requestAnimationFrame(Nano.render);
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
					Nano.imdat[name] = {pos:[0,0],axis:[0,0],scale:1};
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
				rotation: {
					leg: [0, 0],
					arm: [0, 0]
				},
				traits: traits,
				pos: pos,
				facing: (facing || 1),
				animation: 0,
				animating: false
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
		},
		moveTo: function(name, axis, val, duration) {
			// The calculations required for the step function
			var start = new Date().getTime();
			var end = start + duration;
			var current = Nano.characters[name].pos[axis];
			var distance = val - current;
			
			if(axis == 0)
				Nano.Characters.face(name, val < Nano.characters[name].pos[0] ? -1 : 1);

			var step = function() {
				// Get our current progres
				var timestamp = new Date().getTime();
				var progress = Math.min((duration - (end - timestamp)) / duration, 1);

				// Update the square's property
				Nano.characters[name].pos[axis] = current + (distance * progress);

				// If the animation hasn't finished, repeat the step.
				if (progress < 1) requestAnimationFrame(step);
				else Nano.Characters.Animate.walk(name, false);
			};

			// Start the animation
			Nano.Characters.Animate.walk(name, false);
			Nano.Characters.Animate.walk(name, true);
			return step();
		},
		Animate: {
			walk: function(name, enable) {
				Nano.characters[name].animating = enable;
				if(enable) {
					var step = function() {
						var c = Nano.characters[name];
						if(!c.animating) return;
						
						var millis = new Date().getTime() % 10000;
						var o = Math.sin(millis/100)*45;
						
						c.rotation.leg = [o, -o];
						c.rotation.arm = [-o, o];
						
						requestAnimationFrame(step);
					};
					
					return step();
				} else {
					Nano.characters[name].animation = 0;
					Nano.characters[name].rotation.leg = [0, 0];
					Nano.characters[name].rotation.arm = [0, 0];
				}
			}
		}
	},
	World: {
		load: function(name) {
			Nano.xhr("GET", "./worlds/" + name + ".json", "", function(d) {
				Nano.world = JSON.parse(d);
			});
		}
	},
	Draw: {
		clear: function() {
			Nano.canvas.width = Nano.canvas.width;
			//Nano.context.fillStyle = "white";
			//Nano.context.fillRect(0, 0, Nano.canvas.width, Nano.canvas.height);
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
		image: function(image, angle, positionX, positionY, axisX, axisY, flip, scale) {
			if(angle == 0 && !flip && !scale)
				return Nano.context.drawImage(image, positionX - axisX, positionY - axisY);
			var angleInRad = Math.PI / 180 * angle;
			Nano.context.translate(positionX, positionY);
			Nano.context.rotate(angleInRad);
			if(flip) Nano.context.scale(-1, 1);
			Nano.context.scale(scale || 1, scale || 1);
			Nano.context.drawImage(image, -axisX, -axisY);
			Nano.context.scale(1/scale || 1, 1/scale || 1);
			if(flip) Nano.context.scale(-1, 1);
			Nano.context.rotate(-angleInRad);
			Nano.context.translate(-positionX, -positionY);
		},
		ground: function() {
			var ctx = Nano.context;
			
			/*var cs = Math.cos(45), sn = Math.sin(45);
			var h = Math.cos(20);
			var a = 1*cs, b = -1*sn, c = 200;
			var d = h*1*sn, e = h*1*cs, f = 200;*/
			//ctx.setTransform(a, d, b, e, c, f);
			
			ctx.save();
			ctx.translate(Nano.view.x, Nano.view.y);
			ctx.scale(1, 0.5);
			ctx.rotate(45 * Math.PI /180);
			
			var scale = 0.25, interval = 128;
			if(typeof Nano.world.name === "string") {
				for(var x = 0; x < Nano.world.width; x++) {
					for(var y = 0; y < Nano.world.height; y++) {
						Nano.Draw.image(Nano.getImage(Nano.world.textures[Nano.world.data.ground[y][x]]), 0, interval*x, interval*y, 0, 0, false, scale);
						//Nano.context.font = "24px sans-serif";
						//ctx.fillText(x + ", " + y, interval*x, interval*y);
					}
				}
			}
			
			ctx.restore();
			//Nano.Draw.image(Nano.getImage("texture.grass"), 0, -128, 0, 0, 0, false, 0.25);
			//Nano.Draw.image(Nano.getImage("texture.walkway"), 0, 0, 0, 0, 0, false, 0.25);
			
			//ctx.setTransform(1, 0, 0, 1, 0, 0);
		},
		cross: function(x, y) {
			var c = Nano.context;
			c.beginPath();
			c.moveTo(0, y);
			c.lineTo(Nano.canvas.width, y);
			c.moveTo(x, 0);
			c.lineTo(x, Nano.canvas.height);
			c.stroke();
		},
		character: function(name) {
			var chr = Nano.characters[name],
				i = Nano.GlobalState.idle,
				f = chr.facing,
				s = 0.25,
				
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
			Nano.Draw.ellipse(chr.pos[0], chr.pos[1] + ib.height*s/2 + il.height*s - (il.height*s*1/3), ih.width*s + 30, 8, "rgba(0,0,0,0.7)");
			
			//Char center
			/*Nano.context.beginPath();
			Nano.context.moveTo(0,chr.pos[1]);
			Nano.context.lineTo(Nano.canvas.width,chr.pos[1]);
			Nano.context.moveTo(chr.pos[0], 0);
			Nano.context.lineTo(chr.pos[0], Nano.canvas.height);
			Nano.context.stroke();*/
			/*
			//LeftArm
			Nano.Draw.image(ir, f*-5 + f*i,
				chr.pos[0] + (dr.pos[0]*f || 0) + (f < 0 ? -34 : 16), chr.pos[1] + (dr.pos[1]*f || 0) - 8,
				(dr.axis[0]*f || 16), (dr.axis[1]*f || 16), f < 0, s);
			
			//Legs
			Nano.Draw.image(il, 0,
				chr.pos[0] + (dl.pos[0]*f || 0) + (f > 0 ? 10 : -10), chr.pos[1] + ib.height*s / 2 + (dl.pos[1]*f || 0) - 10,
				(dl.axis[0]*f || 0), (dl.axis[1]*f || 0), f < 0, s);
				
			//Body
			Nano.Draw.image(ib, 0,
				chr.pos[0] - (ib.width*s/2) + (dt.pos[0]*f || 0), chr.pos[1] + (dt.pos[1]*f || 0) + (i/2),
				ib.width*s / 2  + (dt.axis[0]*f || 0), ib.height*s / 2 + (dt.axis[0]*f || 0), f < 0, s);
				
			//Legs
			Nano.Draw.image(il, 0,
				chr.pos[0] + (dl.pos[0]*f || 0) + (f < 0 ? 20 : -20), chr.pos[1] + ib.height*s / 2 + (dl.pos[1]*f || 0) - 10,
				(dl.axis[0]*f || 0), (dl.axis[1]*f || 0), f < 0, s);
				
			//RightArm
			Nano.Draw.image(ir, f*(5 - i),
				chr.pos[0] + (dr.pos[0]*f || 0) + (f > 0 ? -5 : 10), chr.pos[1] + (dr.pos[1]*f || 0) - 8,
				(dr.axis[0]*f || 16), (dr.axis[1]*f || 16), f < 0, s);
				
			//Head
			Nano.Draw.image(ih, i/2*f,
				chr.pos[0] - (ih.width*s/2) + (dh.pos[0]*f || 0), chr.pos[1] - (ih.height*s/2) - (ib.height*s/2) + (dh.pos[1]*f || 0) + i,
				ih.width*s / 2  + (dh.axis[0]*f || 0), ih.height*s / 2 + (dh.axis[0]*f || 0), f < 0, s);
				
			//Eyes
			Nano.Draw.image(iy, i/2*f,
				chr.pos[0] + (dy.pos[0]*f || 0) + (f * iy.width*s / 2), chr.pos[1] - ((ib.height*s / 1.5) - ih.height*s / 2) + (dy.pos[1]*f || 0) + i,
				iy.width*s / 2  + (dy.axis[0]*f || 0), ih.height*s / 2 + (dy.axis[0]*f || 0), f < 0);
				
			//Mouth
			Nano.Draw.image(im, i/2*f,
				chr.pos[0] + (dm.pos[0]*f || 0) + (f * im.width*s), chr.pos[1] - ((ib.height*s / 1.5) - ih.height*s / 2) + iy.height*s + (dm.pos[1]*f || 0) + i,
				im.width*s / 2  + (dm.axis[0]*f || 0), ih.height*s / 2 + (dm.axis[0]*f || 0), f < 0);
				
			//Hair
			Nano.Draw.image(ia, i/2*f,
				chr.pos[0] + (da.pos[0]*f || 0), chr.pos[1] - (ib.height*s / 1.5) + (da.pos[1]*f || 0) - 15 + i,
				ia.width*s / 2  + (da.axis[0]*f || 0), ih.height*s / 2 + (da.axis[0]*f || 0), f < 0);
				*/
				
			if(f > 0) {
				//LeftArm
				Nano.Draw.image(ir, f*-5 + f*i + chr.rotation.arm[0],
					chr.pos[0] + (ib.width*s/3), chr.pos[1] - (ib.height*s/2) + 10,
					ir.width*s/2, ir.width*s/2, f < 0, s);
			} else {
				//RightArm
				Nano.Draw.image(ir, f*5 - f*i + chr.rotation.arm[1],
					chr.pos[0] - (ib.width*s/3), chr.pos[1] - (ib.height*s/2) + 10,
					(dr.axis[0]*f || 16), (dr.axis[1]*f || 16), f < 0, s);
			}
			
			//Legs
			Nano.Draw.image(il, 0 + chr.rotation.leg[0],
				chr.pos[0] + (ib.width*s/2) - (f < 0 ? 10 : 0), chr.pos[1] + (ib.height*s/2) - (il.height*s*1/3),
				il.width/2, 0, f < 0, s);
				
			//Body
			Nano.Draw.image(ib, 0,
				chr.pos[0], chr.pos[1] + (i/2),
				ib.width/2, ib.height/2, f < 0, s);
				
			//Legs
			Nano.Draw.image(il, 0 + chr.rotation.leg[1],
				chr.pos[0] - (ib.width*s/2) + (f > 0 ? 10 : 0), chr.pos[1] + (ib.height*s/2) - (il.height*s*1/3),
				il.width/2, 0, f < 0, s);
				
			if(f < 0) {
				//LeftArm
				Nano.Draw.image(ir, f*-5 + f*i + chr.rotation.arm[0],
					chr.pos[0] + (ib.width*s/3), chr.pos[1] - (ib.height*s/2) + 10,
					ir.width*s/2, ir.width*s/2, f < 0, s);
			} else {
				//RightArm
				Nano.Draw.image(ir, f*5 - f*i + chr.rotation.arm[1],
					chr.pos[0] - (ib.width*s/3), chr.pos[1] - (ib.height*s/2) + 10,
					(dr.axis[0]*f || 16), (dr.axis[1]*f || 16), f < 0, s);
			}
				
			//Head
			Nano.Draw.image(ih, i/2*f,
				chr.pos[0], chr.pos[1] - (ib.height*s/2) + 10 + i,
				ih.width / 2, ih.height, f < 0, s);
				
			//Eyes
			Nano.Draw.image(iy, i/2*f,
				chr.pos[0] + iy.width*s*f + (dy.pos[0]*f || 0), chr.pos[1] - (ih.height*s/6) + (dy.pos[1] || 0) + i,
				iy.width*s/2 + (dy.axis[0]*f || 0), ih.height*s/2 + (dy.axis[1] || 0), f < 0, (dy.scale || 1));
				
			//Nano.Draw.cross(chr.pos[0] + iy.width*s*f - iy.width*s/2, chr.pos[1] - (ih.height*s/6) + i - ih.height*s/2);
				
			//Mouth
			Nano.Draw.image(im, i/2*f,
				chr.pos[0] + iy.width*(dy.scale || 1)*f, chr.pos[1] - (ih.height*s/8) + iy.height*(dy.scale || 1) + i,
				iy.width*(dy.scale || 1)/2, ih.height*s/2, f < 0);
				
			//Hair
			Nano.Draw.image(ia, i/2*f,
				chr.pos[0] + (da.pos[0]*f || 0), chr.pos[1] - (ih.height*s) + (da.pos[1]*f || 0) + i,
				ia.width/2 + (da.axis[0]*f || 0), 30 + (da.axis[1]*f || 0), f < 0);
		}
	}
};
