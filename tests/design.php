<?php
$files = scandir('./images');
unset($files[0], $files[1]);
?><!DOCTYPE html>
<html>
	<head>
		<title>Character Designer</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<script src="nanorender.js"></script>
		<script>
			function init() {
				Nano.init(document.getElementById("canvas"));
				Nano.Characters.create("Test", {body: 1, head: 1, eyes: 1, mouth: 1, hair: 1, arms: 1, legs: 1}, [], [125, 125], 1);
			}
			function part(p, n) {
				var x = Nano.Characters.get("Test");
				x.parts[p] = n;
				Nano.characters.Test = x;
			}
			
			var nn = 0;
			function spawnMany(n) {
				for(var i = 0; i < n; i++) {
					nn++;
					Nano.Characters.create("c" + nn, {hair:(Math.random()>0.5?1:2),eyes:Math.floor(Math.random() * 4)+1}, [], [Math.floor(Math.random() * 250), Math.floor(Math.random() * 250)], (Math.random()>0.5?1:-1));
				}
			}
			
			function fpstest() {
				if(Nano.currFps < 25) return;
				spawnMany(10);
				dance();
				setTimeout(fpstest, 500);
			}
			function dance() {
				for(var name in Nano.Characters.list()) {
					Nano.Characters.faceAway(name);
				}
			}
			
			window.onload = init;
		</script>
		<style>
			img {
				cursor: pointer;
				width: 64px;
				border: 1px solid #BBB;
			}
		</style>
	</head>
	
	<body>
		<div id="canvasArea">
			<canvas id="canvas" width="250" height="250"></canvas>
		</div>
		<button onclick="Nano.Characters.face('Test', -1)">Left</button>
		<button onclick="Nano.Characters.face('Test', 1)">Right</button>
		<button onclick="spawnMany(1)">Spawn</button>
		<button onclick="spawnMany(100)">Spawn 100</button>
		<button onclick="fpstest()">FPS Test</button>
		<div id="selection">
			<div id="hair">
				Hair
<?php
foreach($files as $file) {
	if(strpos($file, 'hair') !== false && strpos($file, 'png') !== false) {
?>
				<img onclick="part('hair', <?php echo substr($file, 4, -4); ?>)" src="./images/<?php echo $file; ?>" />
<?php
	}
}
?>
			</div>
			<div id="eyes">
				Eyes
<?php
foreach($files as $file) {
	if(strpos($file, 'eyes') !== false && strpos($file, 'png') !== false) {
?>
				<img onclick="part('eyes', <?php echo substr($file, 4, -4); ?>)" src="./images/<?php echo $file; ?>" />
<?php
	}
}
?>
			</div>
			<div id="mouth">
				Mouth
<?php
foreach($files as $file) {
	if(strpos($file, 'mouth') !== false && strpos($file, 'png') !== false) {
?>
				<img onclick="part('mouth', <?php echo substr($file, 5, -4); ?>)" src="./images/<?php echo $file; ?>" />
<?php
	}
}
?>
			</div>
		</div>
	</body>
</html>