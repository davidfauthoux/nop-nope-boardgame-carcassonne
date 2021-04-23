console.log(res);
var declarations = $($.parseXML(res["../game.declare.xml"]));

var getContent = function(className) {
	var filter = "." + prefix + className;
	var c = declarations.find(filter);
	if (c.length === 0) {
		console.log("***WARNING*** Content not found: " + filter);
		debugger;
		return $("<div>").addClass("undefined").text(prefix + className);
	}
	return c.clone();
};

var asHtml = function(d) {
	return d[0].outerHTML;
};

/*
var taskResult = {};
var tasks = [];
var taskRunning = false;
var runTasks = function() {
	if (taskRunning) {
		return;
	}
	if (tasks.length === 0) {
		var json = JSON.stringify(taskResult, null, "\t");
		console.log(json);
		new Server().upload(json, "res/tiles_.json").run();
		//debugger;
		return;
	}
	var t = tasks[0];
	tasks = tasks.slice(1, tasks.length);
	taskRunning = true;
	t(function(f, r) {
		taskResult[f] = r;
		taskRunning = false;
		runTasks();
	});
};
*/

var tileDefinitions = JSON.parse(res["tiles.json"]);

var prefix = "cc-";
var startingTiles = [];
var tiles = [];
global.definitions = {};
Utils.each(res, function(_, file) {
	if (!file.startsWith("tile-") || !file.endsWith(".png")) {
		return;
	}

/*
	tasks.push(function(callback) {
		var img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = function () {
			var canvas = $("<canvas>")[0];
			var ctx = canvas.getContext("2d");
			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);

			var simplify = function(component) {
				return component;
				var factor = 30;
				return Math.floor(component / factor) * factor;
			};

			var margin = 15;
			var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
			var findColor = function(ii, jj) {
				ii = Math.floor(ii);
				jj = Math.floor(jj);
				var find = function(i, j) {
					var off = ((j * canvas.width) + i) * 4;
					var r = simplify(data[off + 0]);
					var g = simplify(data[off + 1]);
					var b = simplify(data[off + 2]);
					if ((g > 100) && (r < g) && (b < 100)) {
						return "grass";
					}
					if ((r > 170) && (g > 170) && (b > 170)) {
						return "road";
					}
					return "city";
					return "#" + ("000000" + ((r << 16) | (g << 8) | b).toString(16)).slice(-6);
				};
				var m = Math.floor(margin / 3);
				var counts = {
					grass: 0,
					road: 0,
					city: 0
				};
				Utils.each([ [ ii - m, jj - m ], [ ii + m, jj - m ], [ ii - m, jj + m ], [ ii + m, jj + m ] ], function(ij) {
					var f = find(ij[0], ij[1]);
					counts[f]++;
				});
				if (counts.city >= 3) {
					return "c";
				}
				if (counts.road >= 1) {
					return "r";
				}
				return "g";
			};
			var rr = "";
			rr += findColor(canvas.width / 2, margin);
			rr += findColor(margin, canvas.height / 2);
			rr += findColor(canvas.width - margin, canvas.height / 2);
			rr += findColor(canvas.width / 2, canvas.height - margin);

			callback(file, rr);
		};
		img.src = "res/" + file;
	});
	runTasks();
*/

	var f = file.split(/\-/g);
	var expansion = f[1];
	f = f[2].split(/\./g);
	f = f[0].split(/x/g);
	var id = f[0];
	var count = f[1];

	// console.log("Tile: " + expansion + " " + id + " (" + count + ")");

	var tileId = expansion + "_" + id;

	var back = function() {
		var div = $("<div>").addClass(prefix + "tile").addClass(prefix + "expansion-" + expansion);
		div.append($("<div>").addClass(prefix + "background").attr("style", "background-image: url('../res/back.png');"));
		return asHtml(div);
	};

	var definitionList = tileDefinitions[file];
	if (definitionList === undefined) {
		return;
	}
	var tileDefinition = {
		up: definitionList.charAt(0),
		left: definitionList.charAt(1),
		right: definitionList.charAt(2),
		down: definitionList.charAt(3)
	};

	var definition = [];
	if (definitionList !== undefined) {
		definition.push(null);
		definition.push(tileDefinition.up);
		definition.push(null);

		definition.push(tileDefinition.left);
		definition.push(null);
		definition.push(tileDefinition.right);

		definition.push(null);
		definition.push(tileDefinition.down);
		definition.push(null);
	}

	Utils.loop(0, count, 1, function(n) {
		var kind = "tile-" + tileId + "-" + n;

		var rotateClockwise = function(a) {
			var n = a.length;
			for (var i = 0; i < (n / 2); i++) {
				for (var j = i; j < (n - i - 1); j++) {
					var tmp                 = a[i]        [j]        ;
					a[i]        [j]         = a[n - j - 1][i]        ;
					a[n - j - 1][i]         = a[n - i - 1][n - j - 1];
					a[n - i - 1][n - j - 1] = a[j]        [n - i - 1];
					a[j]        [n - i - 1] = tmp                    ;
				}
			}
			return a;
		};
		
		var matrix = [];
		Utils.loop(0, 3, 1, function(j) {
			matrix[j] = [];
			Utils.loop(0, 3, 1, function(i) {
				matrix[j].push(i + (j * 3));
			});
		});

		var rotateDef = function(d) {
			return {
				right: d.up,
				down: d.right,
				left: d.down,
				up: d.left
			};
		};

		var faces = {};
		var def = Utils.clone(tileDefinition);
		Utils.each([ 0, 90, 180, 270 ], function(angle) {
			var div = $("<div>").addClass(prefix + "tile");
			div.append($("<div>").addClass(prefix + "background").attr("style", "background-image: url('../res/" + file + "'); transform: rotate(" + angle + "deg);"));

			global.definitions[kind + "/" + angle] = def;

			var cssPosition = 0;
			Utils.each(matrix, function(row) {
				Utils.each(row, function(position) {
					var cellDiv = $("<div>").addClass(prefix + "spot").addClass(prefix + "spot-" + cssPosition).attr("data-location", kind + "-" + angle + "-" + position);
					var color = definition[position];
					if (color !== null) {
						cellDiv.addClass("colored_" + color);
					}
					div.append(cellDiv);
					cssPosition++;
				});
			});

			faces["_" + angle] = asHtml(div);
			matrix = rotateClockwise(matrix);

			def = rotateDef(def);
		});

		item(kind, back(), { stackable: true }, {}, { face: faces });
		if (tileId.endsWith("_000")) {
			startingTiles.push({
				kind: kind,
				expansion: expansion
			});
		} else {
			tiles.push({
				kind: kind,
				expansion: expansion
			});
		}
	});
});

global.subSpots = function(kind) {
	var locations = [];
	Utils.each([ 0, 90, 180, 270 ], function(angle) {
		Utils.loop(0, 9, 1, function(i) {
			locations.push(kind + "-" + angle + "-" + i);
		});
	});
	return locations;
};
global.isEmpty = function(kind, spot) {
	var empty = true;
	Utils.each(global.subSpots(kind), function(s) {
		if (!empty) {
			return;
		}
		empty = spot(s).empty();
	});
	return empty;
};

global.startingTiles = startingTiles;
global.tiles = tiles;

global.setupTiles = function(pools, expansion) {
	if (expansion === undefined) {
		expansion = "base";
	}
	Utils.each(global.tiles, function(tile) {
		if (tile.expansion !== expansion) {
			return;
		}

		pools.get("global").drop(tile.kind, 1);
	});
};

global.findExpansions = function(pools) {
	var expansions = [];
	pools.get("global").items().each(function(i) {
		var t = i.is("tile");
		if (t !== undefined) {
			var expansion = t.split(/\_/g)[0];
			if (!Utils.contains(expansions, expansion)) {
				expansions.push(expansion);
			}
		}
	});
	return expansions;
};

global.setupStartingTile = function(pools, grids) {
	var usedExpansions = global.findExpansions(pools);
	var startingTile = null;
	Utils.each(global.startingTiles, function(tile) {
		if (!Utils.contains(usedExpansions, tile.expansion)) {
			return;
		}
		startingTile = tile;
	});
	if (startingTile !== null) {
		var cell = grids.get("grid").cell(0, 0);
		cell.around();
		cell.drop(startingTile.kind, 1).paint("face", "_" + 0);
	}
};

global.currentTile = function(here) {
	var foundTile = null;
	here.items().each(function(i) {
		if (foundTile !== null) {
			return;
		}
		if (i.is("tile") !== undefined) {
			foundTile = i;
		}
	});
	return foundTile;
};

global.drawTile = function(pools, here) {
	var foundTile = global.currentTile(here);
	if (foundTile !== null) {
		return null;
	}
	var allTiles = [];
	var riverTiles = [];
	pools.get("global").items().each(function(i) {
		var t = i.is("tile");
		if (t !== undefined) {
			var expansion = t.split(/\_/g)[0];
			if (expansion === "river") {
				riverTiles.push(i);
			} else {
				allTiles.push(i);
			}
		}
	});
	if (riverTiles.length > 0) {
		allTiles = riverTiles;
	}
	if (allTiles.length > 0) {
		var tile = allTiles[Utils.random(allTiles.length)];
		var dropped = pools.get("global").move(tile.kind, 1, here);
		return dropped;
	}
	return undefined;
};

global.createPlayers = function(pools, tracks, count) {
	var usedExpansions = global.findExpansions(pools);
	var startingPlayer = Utils.random(count);
	Utils.loop(0, count, 1, function(i) {
		pools.create("player-sides", "side-" + i, {});
		var side = pools.get("side-" + i);
		side.drop("side-pin-player" + i, 1);
		// side.drop("meeple-normal-player" + i, 1); //TODO Steady
		side.drop("incscore1", 1);
		side.drop("incscore4", 1);
		side.drop("incscore10", 1);

		pools.create("player-banks", "bank-" + i, { /* layout: "vertical" */ }, true);
		var bank = pools.get("bank-" + i);
		bank.drop("live", 1);
		bank.drop("bank-pin-player" + i, 1);

		bank.drop("meeple-normal-player" + i, 7);
		tracks.get("scores").level(0).drop("meeple-normal-player" + i, 1);

		if (Utils.contains(usedExpansions, "cathedral")) {
			bank.drop("meeple-big-player" + i, 1);
		}
		if (Utils.contains(usedExpansions, "architect")) {
			bank.drop("meeple-architect-player" + i, 1);
			bank.drop("meeple-pig-player" + i, 1);

			side.drop("resource-barrel", 0).paint("count", null);
			side.drop("resource-wheat", 0).paint("count", null);
			side.drop("resource-silk", 0).paint("count", null);
			side.drop("clickit", 1);
		}

		global.drawTile(pools, bank);

		if (i === startingPlayer) {
//			bank.drop("playing", 1);
			bank.drop("pass-player" + i, 1);
		}
	});
};

global.destroySetup = function(here) {
	here.items().each(function(i) {
		if (i.kind.startsWith("setup_")) {
			here.destroy(i.kind);
		}
	});
};

global.incScore = function(here, tracks, count, play, log) {
	var player = here.is("pool-side");
	if (player === undefined) {
		return;
	}
	var scoreTrack = tracks.get("scores");
	var currentScore = scoreTrack.find("meeple-normal-player" + player);
	if (currentScore === undefined) {
		return;
	}
	var size = scoreTrack.size();
	if ((currentScore + count) >= size) {
		scoreTrack.move("meeple-normal-player" + player, count - size);
		here.drop("fiftypoints", 1);
	} else {
		scoreTrack.move("meeple-normal-player" + player, count);
	}
	play("short");
	log("+" + count + " point" + ((count > 1) ? "s" : "") + " for player " + (parseInt(player) + 1), true);
};

global.setTileRotation = function(hover, spot, newAngle) {
	hover.paint("face", "_" + newAngle);

	Utils.each([ 0, 90, 180, 270 ], function(a) {
		Utils.loop(0, 9, 1, function(i) {
			var from = spot(hover.kind + "-" + a + "-" + i);
			var to = spot(hover.kind + "-" + newAngle + "-" + i);
			from.items().each(function(item) {
				from.move(item.kind, item.count(), to);
			});
		});
	});
};
global.getTileRotation = function(hover) {
	var face = hover.look("face");
	if (face === undefined) {
		return undefined;
	} else {
		return parseInt(face.substring(1));
	}
};
global.rotateTile = function(hover, spot) {
	var nextAngle = function(a) {
		return (a + 90) % 360;
	};

	var current = global.getTileRotation(hover);
	var newAngle;
	if (current === undefined) {
		newAngle = 0;
	} else {
		newAngle = nextAngle(current);
	}
	global.setTileRotation(hover, spot, newAngle);
};
global.faceDownTile = function(hover, spot) {
	hover.paint("valid");
	global.setTileRotation(hover, spot, 0);
	hover.paint("face");
};
global.faceUpTile = function(hover, spot) {
	hover.paint("valid");
	var current = global.getTileRotation(hover);
	if (current === undefined) {
		global.setTileRotation(hover, spot, 0);
	} else {
		global.setTileRotation(hover, spot, current);
	}
};
global.privateFaceUpTile = function(hover, spot, nop) {
	hover.paint("valid");
	var current = global.getTileRotation(hover);
	if (current === undefined) {
		global.setTileRotation(hover, spot, 0);
		current = 0;
	}

	hover.paint("face");
	nop(function() {
		hover.paint("face", "_" + current);
	});
};

global.checkValid = function(here, hover, grids) {
//%%	var ij = here.location.substring("grid-grid-".length).split(/\-/g);
//%%	here = grids.get("grid").cell(parseInt(ij[0]), parseInt(ij[1]));

	var angle = function(tile) {
		var face = tile.look("face");
		if (face !== undefined) {
			return  parseInt(face.substring(1));
		}
		return undefined;
	};
	var def = function(tile) {
		if (tile.kind === undefined) {
			return undefined;
		}
		var a = angle(tile);
		var d = global.definitions[tile.kind + "/" + a];
		// console.log(tile.kind + " -> " + a + " deg " + JSON.stringify(d));
		return d;
	};

	var tileDef = def(hover);
	if (tileDef === undefined) {
		return;
	}

	var check = function(cell, tilePos, cellPos) {
		var t = null;
		cell.items().each(function(i) {
			if (i.is("tile") !== undefined) {
				t = i;
			}
		});
		if (t !== null) {
			var d = def(t);
			if (d === undefined) {
				return 0;
			}
			// console.log("CHECKING " + tileDef[tilePos] + " ? " + d[cellPos]);
			if (tileDef[tilePos] !== d[cellPos]) {
				// console.log("NOT VALID");
				return -1;
			} else {
				return 1;
			}
		} else {
			return 0;
		}
	};
	var checkAll = function(cell) {
		var sum = 0;
		var v;
		v = check(cell.up(), "up", "down");
		if (v < 0) {
			return false;
		}
		sum += v;
		v = check(cell.left(), "left", "right");
		if (v < 0) {
			return false;
		}
		sum += v;
		v = check(cell.down(), "down", "up");
		if (v < 0) {
			return false;
		}
		sum += v;
		v = check(cell.right(), "right", "left");
		if (v < 0) {
			return false;
		}
		sum += v;
		return sum > 0;
	};
	if (!checkAll(here)) {
		hover.paint("valid", "invalid");
	} else {
		hover.paint("valid");
	}
};
