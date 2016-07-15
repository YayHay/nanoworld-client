/*
nanorender
Simple character rendering engine

Copyright (c) 2016 Hizkia Felix / HizkiFW
*/

var Nano = Nano || {};

Nano.Render = {
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
	mouse: [0, 0],
	
	init: function(canvas, fps, res) {
		Nano.Render.context = canvas.getContext("2d");
		Nano.Render.canvas = canvas;
		Nano.Render.fps = typeof fps === "undefined" ? 30 : fps;
		Nano.Render.res = typeof res === "string" ? res : "./";
		
		Nano.Render.view.x = canvas.width / 2;
		Nano.Render.context.imageSmoothingEnabled = true;
		
		//setInterval(Nano.Render.render, 1000 / Nano.Render.fps);
		window.requestAnimationFrame(Nano.Render.render);
		setInterval(function() {
			Nano.Render.GlobalState.state += (Nano.Render.GlobalState.state < Nano.Render.fps*2 ? 1 : -Nano.Render.fps*2);
			Nano.Render.GlobalState.idle = Math.abs(Nano.Render.GlobalState.state - Nano.Render.fps) / 8;
		}, 1000 / Nano.Render.fps);
		setInterval(function() {
			Nano.Render.currFps = Nano.Render.framesDrawn;
			Nano.Render.framesDrawn = 0;
		}, 1000);
	},
	
	render: function() {
		Nano.Render.Draw.clear();
		
		Nano.Render.Draw.ground();
		
		if(Object.keys(Nano.Render.characters).length > 0) {
			var sort = [];
			for(var name in Nano.Render.characters) {
				sort.push([name, Nano.Render.characters[name].pos[1]]);
			}
			sort.sort(function(a, b) {
				return a[1] - b[1];
			});
			for(var i = 0; i < sort.length; i++) {
				Nano.Render.Draw.character(sort[i][0]);
			}
		}
		
		//Nano.Render.context.font = "12px sans-serif";
		//Nano.Render.context.fillText(Math.sqrt((Nano.Render.mouse[0]-Nano.Render.characters.Test.pos[0])*(Nano.Render.mouse[0]-Nano.Render.characters.Test.pos[0]) + (Nano.Render.mouse[1]-Nano.Render.characters.Test.pos[1])*(Nano.Render.mouse[1]-Nano.Render.characters.Test.pos[1])), Nano.Render.mouse[0], Nano.Render.mouse[1]);
		
		Nano.Render.framesDrawn++;
		window.requestAnimationFrame(Nano.Render.render);
	},
	
	getImage: function(name) {
		if(typeof Nano.Render.images[name] === "undefined") {
			Nano.Render.images[name] = new Image();
			Nano.Render.images[name].onerror = function() {
				Nano.Render.images[name].src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
			}
			Nano.Render.images[name].src = Nano.Render.res + "images/" + name + ".png";
			Nano.Render.getImageData(name);
		}
		return Nano.Render.images[name];
	},
	getImageData: function(name) {
		if(typeof Nano.Render.imdat[name] === "undefined") {
			Nano.Render.imdat[name] = {pos:[0,0],axis:[0,0]};
			Nano.Render.xhr("GET", Nano.Render.res + "images/" + name + ".txt", "", function(data) {
				if(data !== false)
					Nano.Render.imdat[name] = JSON.parse(data);
				else
					Nano.Render.imdat[name] = {pos:[0,0],axis:[0,0],scale:1};
			});
		}
		return Nano.Render.imdat[name];
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
			if(typeof Nano.Render.characters[name] !== "undefined") return false;
			return Nano.Render.Characters.set(name, parts, traits, pos, facing);
		},
		modify: function(name, parts, traits, pos, facing) {
			if(typeof Nano.Render.characters[name] === "undefined") return false;
			return Nano.Render.Characters.set(name, parts, traits, pos, facing);
		},
		set: function(name, parts, traits, pos, facing) {
			Nano.Render.characters[name] = {
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
			return Nano.Render.characters[name] || false;
		},
		list: function() {
			return Object.keys(Nano.Render.characters);
		},
		move: function(name, pos, y) {
			if(typeof Nano.Render.characters[name] === "undefined") return false;
			if(typeof y === "undefined")
				Nano.Render.characters[name].pos = pos;
			else
				Nano.Render.characters[name].pos = [pos, y];
			return true;
		},
		face: function(name, direction) {
			if(typeof Nano.Render.characters[name] === "undefined") return false;
			Nano.Render.characters[name].facing = direction;
		},
		faceAway: function(name) {
			if(typeof Nano.Render.characters[name] === "undefined") return false;
			Nano.Render.characters[name].facing = (Nano.Render.characters[name].facing > 0 ? -1 : 1);
		},
		destroy: function(name) {
			delete Nano.Render.characters[name];
		},
		walkTo: function(name, x, y) {
			if(typeof Nano.Render.characters[name] === "undefined") return false;
			if(typeof y === "undefined") {
				y = x[1];
				x = x[0];
			}
			var x1 = Nano.Render.characters[name].pos[0],
				y1 = Nano.Render.characters[name].pos[1],
				t = Math.max(Math.abs(x-x1), Math.abs(y-y1))*5;
			
			Nano.Render.Characters.moveTo(name, 0, x, t);
			Nano.Render.Characters.moveTo(name, 1, y, t);
		},
		moveTo: function(name, axis, val, duration) {
			// The calculations required for the step function
			var start = new Date().getTime();
			var end = start + duration;
			var current = Nano.Render.characters[name].pos[axis];
			var distance = val - current;
			
			if(axis == 0)
				Nano.Render.Characters.face(name, val < Nano.Render.characters[name].pos[0] ? -1 : 1);

			var step = function() {
				// Get our current progres
				var timestamp = new Date().getTime();
				var progress = Math.min((duration - (end - timestamp)) / duration, 1);

				// Update the square's property
				Nano.Render.characters[name].pos[axis] = current + (distance * progress);

				// If the animation hasn't finished, repeat the step.
				if (progress < 1) requestAnimationFrame(step);
				else Nano.Render.Characters.Animate.walk(name, false);
			};

			// Start the animation
			Nano.Render.Characters.Animate.walk(name, false);
			Nano.Render.Characters.Animate.walk(name, true);
			return step();
		},
		Animate: {
			walk: function(name, enable) {
				Nano.Render.characters[name].animating = enable;
				if(enable) {
					var step = function() {
						var c = Nano.Render.characters[name];
						if(!c.animating) return;
						
						var millis = new Date().getTime() % 10000;
						var o = Math.sin(millis/100)*45;
						
						c.rotation.leg = [o, -o];
						c.rotation.arm = [-o, o];
						
						requestAnimationFrame(step);
					};
					
					return step();
				} else {
					Nano.Render.characters[name].animation = 0;
					Nano.Render.characters[name].rotation.leg = [0, 0];
					Nano.Render.characters[name].rotation.arm = [0, 0];
				}
			}
		}
	},
	World: {
		load: function(name) {
			Nano.Render.xhr("GET", Nano.Render.res + "worlds/" + name + ".json", "", function(d) {
				Nano.Render.world = JSON.parse(d);
			});
		}
	},
	Draw: {
		clear: function() {
			Nano.Render.canvas.width = Nano.Render.canvas.width;
			//Nano.Render.context.fillStyle = "white";
			//Nano.Render.context.fillRect(0, 0, Nano.Render.canvas.width, Nano.Render.canvas.height);
		},
		ellipse: function(centerX, centerY, width, height, color) {
			Nano.Render.context.beginPath();
			Nano.Render.context.moveTo(centerX, centerY - height / 2);
			Nano.Render.context.bezierCurveTo(
				centerX + width / 2, centerY - height / 2,
				centerX + width / 2, centerY + height / 2,
				centerX, centerY + height / 2);
			Nano.Render.context.bezierCurveTo(
				centerX - width / 2, centerY + height / 2,
				centerX - width / 2, centerY - height / 2,
				centerX, centerY - height / 2);
			Nano.Render.context.fillStyle = typeof color === "undefined" ? "black" : color;
			Nano.Render.context.fill();
			Nano.Render.context.closePath();
		},
		image: function(image, angle, positionX, positionY, axisX, axisY, flip, scale) {
			if(angle == 0 && !flip && !scale)
				return Nano.Render.context.drawImage(image, positionX - axisX, positionY - axisY);
			var angleInRad = Math.PI / 180 * angle;
			Nano.Render.context.translate(positionX, positionY);
			Nano.Render.context.rotate(angleInRad);
			if(flip) Nano.Render.context.scale(-1, 1);
			Nano.Render.context.scale(scale || 1, scale || 1);
			Nano.Render.context.drawImage(image, -axisX, -axisY);
			Nano.Render.context.scale(1/scale || 1, 1/scale || 1);
			if(flip) Nano.Render.context.scale(-1, 1);
			Nano.Render.context.rotate(-angleInRad);
			Nano.Render.context.translate(-positionX, -positionY);
		},
		ground: function() {
			var ctx = Nano.Render.context;
			
			/*var cs = Math.cos(45), sn = Math.sin(45);
			var h = Math.cos(20);
			var a = 1*cs, b = -1*sn, c = 200;
			var d = h*1*sn, e = h*1*cs, f = 200;*/
			//ctx.setTransform(a, d, b, e, c, f);
			
			ctx.save();
			ctx.translate(Nano.Render.view.x, Nano.Render.view.y);
			ctx.scale(1, 0.5);
			ctx.rotate(45 * Math.PI /180);
			
			var scale = 0.25, interval = 128;
			if(typeof Nano.Render.world.name === "string") {
				for(var x = 0; x < Nano.Render.world.width; x++) {
					for(var y = 0; y < Nano.Render.world.height; y++) {
						Nano.Render.Draw.image(Nano.Render.getImage(Nano.Render.world.textures[Nano.Render.world.data.ground[y][x]]), 0, interval*x, interval*y, 0, 0, false, scale);
						//Nano.Render.context.font = "24px sans-serif";
						//ctx.fillText(x + ", " + y, interval*x, interval*y);
					}
				}
			}
			
			ctx.restore();
			//Nano.Render.Draw.image(Nano.Render.getImage("texture.grass"), 0, -128, 0, 0, 0, false, 0.25);
			//Nano.Render.Draw.image(Nano.Render.getImage("texture.walkway"), 0, 0, 0, 0, 0, false, 0.25);
			
			//ctx.setTransform(1, 0, 0, 1, 0, 0);
		},
		cross: function(x, y) {
			var c = Nano.Render.context;
			c.beginPath();
			c.moveTo(0, y);
			c.lineTo(Nano.Render.canvas.width, y);
			c.moveTo(x, 0);
			c.lineTo(x, Nano.Render.canvas.height);
			c.stroke();
		},
		character: function(name) {
			var chr = Nano.Render.characters[name],
				i = Nano.Render.GlobalState.idle,
				f = chr.facing,
				s = 0.25,
				
				//Image
				il = Nano.Render.getImage("legs" + (chr.parts.legs || 1)),
				ib = Nano.Render.getImage("body" + (chr.parts.body || 1)),
				ih = Nano.Render.getImage("head" + (chr.parts.head || 1)),
				ia = Nano.Render.getImage("hair" + (chr.parts.hair || 1)),
				ir = Nano.Render.getImage("arms" + (chr.parts.arms || 1)),
				iy = Nano.Render.getImage("eyes" + (chr.parts.eyes || 1)),
				im = Nano.Render.getImage("mouth" + (chr.parts.mouth || 1)),
				
				//Data
				dl = Nano.Render.getImageData("legs" + (chr.parts.legs || 1)),
				dt = Nano.Render.getImageData("body" + (chr.parts.body || 1)),
				dh = Nano.Render.getImageData("head" + (chr.parts.head || 1)),
				da = Nano.Render.getImageData("hair" + (chr.parts.hair || 1)),
				dr = Nano.Render.getImageData("arms" + (chr.parts.arms || 1)),
				dy = Nano.Render.getImageData("eyes" + (chr.parts.eyes || 1)),
				dm = Nano.Render.getImageData("mouth" + (chr.parts.mouth || 1));
				
			//Shadow
			Nano.Render.Draw.ellipse(chr.pos[0], chr.pos[1] + ib.height*s/2 + il.height*s - (il.height*s*1/3), ih.width*s + 30, 8, "rgba(0,0,0,0.7)");
			
			//Char center
			/*Nano.Render.context.beginPath();
			Nano.Render.context.moveTo(0,chr.pos[1]);
			Nano.Render.context.lineTo(Nano.Render.canvas.width,chr.pos[1]);
			Nano.Render.context.moveTo(chr.pos[0], 0);
			Nano.Render.context.lineTo(chr.pos[0], Nano.Render.canvas.height);
			Nano.Render.context.stroke();*/
			/*
			//LeftArm
			Nano.Render.Draw.image(ir, f*-5 + f*i,
				chr.pos[0] + (dr.pos[0]*f || 0) + (f < 0 ? -34 : 16), chr.pos[1] + (dr.pos[1]*f || 0) - 8,
				(dr.axis[0]*f || 16), (dr.axis[1]*f || 16), f < 0, s);
			
			//Legs
			Nano.Render.Draw.image(il, 0,
				chr.pos[0] + (dl.pos[0]*f || 0) + (f > 0 ? 10 : -10), chr.pos[1] + ib.height*s / 2 + (dl.pos[1]*f || 0) - 10,
				(dl.axis[0]*f || 0), (dl.axis[1]*f || 0), f < 0, s);
				
			//Body
			Nano.Render.Draw.image(ib, 0,
				chr.pos[0] - (ib.width*s/2) + (dt.pos[0]*f || 0), chr.pos[1] + (dt.pos[1]*f || 0) + (i/2),
				ib.width*s / 2  + (dt.axis[0]*f || 0), ib.height*s / 2 + (dt.axis[0]*f || 0), f < 0, s);
				
			//Legs
			Nano.Render.Draw.image(il, 0,
				chr.pos[0] + (dl.pos[0]*f || 0) + (f < 0 ? 20 : -20), chr.pos[1] + ib.height*s / 2 + (dl.pos[1]*f || 0) - 10,
				(dl.axis[0]*f || 0), (dl.axis[1]*f || 0), f < 0, s);
				
			//RightArm
			Nano.Render.Draw.image(ir, f*(5 - i),
				chr.pos[0] + (dr.pos[0]*f || 0) + (f > 0 ? -5 : 10), chr.pos[1] + (dr.pos[1]*f || 0) - 8,
				(dr.axis[0]*f || 16), (dr.axis[1]*f || 16), f < 0, s);
				
			//Head
			Nano.Render.Draw.image(ih, i/2*f,
				chr.pos[0] - (ih.width*s/2) + (dh.pos[0]*f || 0), chr.pos[1] - (ih.height*s/2) - (ib.height*s/2) + (dh.pos[1]*f || 0) + i,
				ih.width*s / 2  + (dh.axis[0]*f || 0), ih.height*s / 2 + (dh.axis[0]*f || 0), f < 0, s);
				
			//Eyes
			Nano.Render.Draw.image(iy, i/2*f,
				chr.pos[0] + (dy.pos[0]*f || 0) + (f * iy.width*s / 2), chr.pos[1] - ((ib.height*s / 1.5) - ih.height*s / 2) + (dy.pos[1]*f || 0) + i,
				iy.width*s / 2  + (dy.axis[0]*f || 0), ih.height*s / 2 + (dy.axis[0]*f || 0), f < 0);
				
			//Mouth
			Nano.Render.Draw.image(im, i/2*f,
				chr.pos[0] + (dm.pos[0]*f || 0) + (f * im.width*s), chr.pos[1] - ((ib.height*s / 1.5) - ih.height*s / 2) + iy.height*s + (dm.pos[1]*f || 0) + i,
				im.width*s / 2  + (dm.axis[0]*f || 0), ih.height*s / 2 + (dm.axis[0]*f || 0), f < 0);
				
			//Hair
			Nano.Render.Draw.image(ia, i/2*f,
				chr.pos[0] + (da.pos[0]*f || 0), chr.pos[1] - (ib.height*s / 1.5) + (da.pos[1]*f || 0) - 15 + i,
				ia.width*s / 2  + (da.axis[0]*f || 0), ih.height*s / 2 + (da.axis[0]*f || 0), f < 0);
				*/
				
			if(f > 0) {
				//LeftArm
				Nano.Render.Draw.image(ir, f*-5 + f*i + chr.rotation.arm[0],
					chr.pos[0] + (ib.width*s/3), chr.pos[1] - (ib.height*s/2) + 10,
					ir.width*s/2, ir.width*s/2, f < 0, s);
			} else {
				//RightArm
				Nano.Render.Draw.image(ir, f*5 - f*i + chr.rotation.arm[1],
					chr.pos[0] - (ib.width*s/3), chr.pos[1] - (ib.height*s/2) + 10,
					(dr.axis[0]*f || 16), (dr.axis[1]*f || 16), f < 0, s);
			}
			
			//Legs
			Nano.Render.Draw.image(il, 0 + chr.rotation.leg[0],
				chr.pos[0] + (ib.width*s/2) - (f < 0 ? 10 : 0), chr.pos[1] + (ib.height*s/2) - (il.height*s*1/3),
				il.width/2, 0, f < 0, s);
				
			//Body
			Nano.Render.Draw.image(ib, 0,
				chr.pos[0], chr.pos[1] + (i/2),
				ib.width/2, ib.height/2, f < 0, s);
				
			//Legs
			Nano.Render.Draw.image(il, 0 + chr.rotation.leg[1],
				chr.pos[0] - (ib.width*s/2) + (f > 0 ? 10 : 0), chr.pos[1] + (ib.height*s/2) - (il.height*s*1/3),
				il.width/2, 0, f < 0, s);
				
			if(f < 0) {
				//LeftArm
				Nano.Render.Draw.image(ir, f*-5 + f*i + chr.rotation.arm[0],
					chr.pos[0] + (ib.width*s/3), chr.pos[1] - (ib.height*s/2) + 10,
					ir.width*s/2, ir.width*s/2, f < 0, s);
			} else {
				//RightArm
				Nano.Render.Draw.image(ir, f*5 - f*i + chr.rotation.arm[1],
					chr.pos[0] - (ib.width*s/3), chr.pos[1] - (ib.height*s/2) + 10,
					(dr.axis[0]*f || 16), (dr.axis[1]*f || 16), f < 0, s);
			}
				
			//Head
			Nano.Render.Draw.image(ih, i/2*f,
				chr.pos[0], chr.pos[1] - (ib.height*s/2) + 10 + i,
				ih.width / 2, ih.height, f < 0, s);
				
			//Eyes
			Nano.Render.Draw.image(iy, i/2*f,
				chr.pos[0] + iy.width*s*f + (dy.pos[0]*f || 0), chr.pos[1] - (ih.height*s/6) + (dy.pos[1] || 0) + i,
				iy.width*s/2 + (dy.axis[0]*f || 0), ih.height*s/2 + (dy.axis[1] || 0), f < 0, (dy.scale || 1));
				
			//Nano.Render.Draw.cross(chr.pos[0] + iy.width*s*f - iy.width*s/2, chr.pos[1] - (ih.height*s/6) + i - ih.height*s/2);
				
			//Mouth
			Nano.Render.Draw.image(im, i/2*f,
				chr.pos[0] + iy.width*(dy.scale || 1)*f, chr.pos[1] - (ih.height*s/8) + iy.height*(dy.scale || 1) + i,
				iy.width*(dy.scale || 1)/2, ih.height*s/2, f < 0);
				
			//Hair
			Nano.Render.Draw.image(ia, i/2*f,
				chr.pos[0] + (da.pos[0]*f || 0), chr.pos[1] - (ih.height*s) + (da.pos[1]*f || 0) + i,
				ia.width/2 + (da.axis[0]*f || 0), 30 + (da.axis[1]*f || 0), f < 0);
		}
	}
};
