//variable SCREEN : determine quel ecran est affiché
//0 -> menu principal
//1 -> partie en cours
//2 -> menu parametre
//3 -> menu pause
//4 -> partie en cours + shot corps en cours
//5 -> partie en cours + absorbtion


$(document).ready(function() {
	//const
	var debug = true; //mode debug
	var SCREEN = 0;	// Ecran actuel
	var COLORMENU = "red";
	var FONTSIZEMENU = 30;
	var FONTMENU = "Arial";
	var STYLEMENU = FONTSIZEMENU + "px " + FONTMENU;
	
	
	
	var ACTIVCORPS = null; //corps en déplacement
	var CORPSLIST = []; //list de tous les corps
	
	/* non utilisé
	var ANIMSTATE = 0;
	var ANIMTIME = 0;
	var FPSTIME = 0;
	var FPS = 0;
	var FRAMECOUNT = 0;
	var LASTFRAME = 0;
	*/
	var NBFPS = 60; //nbre fps
 
	var t1, t2; //temps force calculation
	
	//function utilisé pour detecter des collisions	
	function circleIntersection(x1, y1, r1, x2, y2, r2) {
	   // distance entre les centre des 2 cercles
	   var dx = x1 - x2;
	   var dy = y1 - y2;
	   var len = Math.sqrt(dx * dx + dy * dy);
	 
	   return (len < r1 + r2);
	}
	
	//modify angle de c1 pour converger vers c2 en fonction de la gravité de c2
	function attract(c1,c2){
		
		
	}
	
	//collision entre coprslist[i1] et coprslist[i2] : le plus gros absorbe le plus petit
	function collide(i1,i2){
		if(CORPSLIST[i1].r > CORPSLIST[i2]){
			CORPSLIST.splice(i2,1);
		}
		else {
			CORPSLIST.splice(i1,1);
		}
	}
	
	//destroy corp à index i
	function destroy(i){
		
	}
	
	//change screen
	function setScreen(scr){
		console.log("Setting screen state to " + scr);
		SCREEN = scr;
		/*
		ANIMSTATE = 0;
		ANIMETIME = 0;
		*/
	};
	
	//class corp 
	function corp(owner,force,angle){
		var c = this;
		this.owner = owner; //player 1 ou 2
		this.angle = angle; //angle de tir
		this.r = 30; //rayon (de l'image, != du rayon apparant, != rayon collision, != rayon dhamp d'attraction)
		this.rcollide; //rayon collision
		this.rfield; //rayon champ d'attraction
		this.v = force; //vitesse (force de tir), diminue après le tir
		this.initVitesse = force; //vitesse initiale (force  de tir)
		this.img = new Image(); 
		this.img.src = "images/corps"+owner+".png";
		this.x; //coordonné x de l'img (!= centre du cercle, qui est égal a x - r)
		this.y = $("#game").get(0).height / 2 ; //idem pour y
		//calcul de x initial suivant le joueur qui tir
		if(this.owner == 1){
			this.x = 50 ;
		}
		else{
			this.x = $("#game").get(0).width - 50 ;
		}
		
		//fonction de dessin
		this.draw = function(ctx){
			c.rcollide = Math.round((40 * c.r) / 100); //calcul du rayon de collision, 40% du rayon de l'image (un peu moins que le rayon apparent)
			c.rfield = Math.round((100 * c.r) / 100); //calcul du rayon d'attraction, 100% du rayon de l'image. (plus grand que le rayon apparent)
			ctx.drawImage(c.img,c.x-c.r,c.y-c.r,c.r*2,c.r*2);
			//tracé des rayon de collision et attraction
			if(debug){
				ctx.beginPath();
				ctx.arc(c.x,c.y,c.rcollide,0,2*Math.PI);
				//ctx.arc(c.x,c.y,c.r,0,2*Math.PI);
				ctx.arc(c.x,c.y,c.rfield,0,2*Math.PI);
				ctx.stroke();
			}
		};
	}
	
	//class game
	function game(p1,p2) {
		var ga = this;
		
		//graphic tools
		this.canvas = $("#game").get(0);
		this.contexte = this.canvas.getContext('2d');
		this.bwidth = this.canvas.width - 100; //board width
		this.bheight = this.canvas.height - 100;	//board height
		this.frameHandler;

		//game data
		this.player1 = p1;
		this.player2 = p2;
		this.playerTurn = 1;
		this.started = false;
		
		//start
		this.launchGame = function(){
			if(debug)console.log("launchGame");
			ga.started = true;
		};
		
		//ajout d'un corps à la liste des corps de la partie
		this.addCorp = function(corp){
			console.log("Pushing player " +corp.owner+ "'s corp to array" );
			CORPSLIST.push(corp);
		};
		
		//loop principal
		this.mainLoop = function(tframe) {
			//console.log("mainLoop+");
//			setTimeout(function() {
//				window.requestAnimationFrame(ga.mainLoop);
//				},1000 / NBFPS );
			window.requestAnimationFrame(ga.mainLoop);
			ga.contexte.clearRect(0, 0, ga.canvas.width, ga.canvas.height);
			ga.update(); //mis à jour des données
			ga.render(); //dessins
		};
		
		//mis à jour des données
		this.update = function(){
			//console.log("update tframe = " + tframe);
			//var dt = (tframe - LASTFRAME) / 1000;
			//LASTFRAME = tframe;
			
			//ga.updateFps(dt);
			
			if(SCREEN == 4){
				ga.stateShoot(); //etat de mouvement du corps actif
			}

			
			
		};
		
		/*
		this.updateFps = function(dt){
			if(FPSTIME > 0.25){
				FPS = Math.round(FRAMECOUNT / FPSTIME);
				FPSTIME = 0;
				FRAMECOUNT = 0;
			}
			
			FPSTIME += dt;
			FRAMECOUNT++;
		};
		*/
		
		//dessins des data
		this.render = function() {
			if(SCREEN == 1 || SCREEN == 4 ){
				ga.setBoard(); //dessin du board
				
				//draw corps on board
				//console.log("detecting " + CORPSLIST.length + " corps");
				for(var i  = 1; i <= CORPSLIST.length; i++ ){
					CORPSLIST[i-1].draw(ga.contexte);
				}
			}
		};
		
		//calcul des data d'etat de mouvement du corps actif
		this.stateShoot = function(){
			//console.log("StateShoot triggered with dt = " + dt);

			//déplacement du corp dans l'angle donnée et à la vitese donnée
			var dt = 0.1;
			CORPSLIST[CORPSLIST.length-1].x += (dt * Math.cos(CORPSLIST[CORPSLIST.length-1].angle) * CORPSLIST[CORPSLIST.length-1].v); 
			CORPSLIST[CORPSLIST.length-1].y += (dt * Math.sin(CORPSLIST[CORPSLIST.length-1].angle) * CORPSLIST[CORPSLIST.length-1].v);

			//ralentissement + grossisemnt
			CORPSLIST[CORPSLIST.length-1].v -= 1;
			CORPSLIST[CORPSLIST.length-1].r += 1;
			
			//grossisement final
		    if(CORPSLIST[CORPSLIST.length-1].v == 1)
		    	CORPSLIST[CORPSLIST.length-1].r += Math.round(CORPSLIST[CORPSLIST.length-1].initVitesse/4);
		    
		    //detectio de collision avec le bord du terrain et rebondissement
		    if(CORPSLIST[CORPSLIST.length-1].x > ga.bwidth + 50 ){
		    	CORPSLIST[CORPSLIST.length-1].angle = Math.PI - CORPSLIST[CORPSLIST.length-1].angle;
		    	CORPSLIST[CORPSLIST.length-1].x = ga.bwidth + 50;
		    }
		    else{
		    	if(CORPSLIST[CORPSLIST.length-1].x < 50){
		    		CORPSLIST[CORPSLIST.length-1].angle = Math.PI - CORPSLIST[CORPSLIST.length-1].angle;
		    		CORPSLIST[CORPSLIST.length-1].x = 50;
		    	}
		    }
	    	if(CORPSLIST[CORPSLIST.length-1].y > ga.bheight + 50 ){
	    		CORPSLIST[CORPSLIST.length-1].angle = - ACTIVCORPS.angle;
	    		CORPSLIST[CORPSLIST.length-1].y = ga.bheight + 50;
	    	}
	    	else{
	    		if(CORPSLIST[CORPSLIST.length-1].y < 50){
	    			CORPSLIST[CORPSLIST.length-1].angle = - CORPSLIST[CORPSLIST.length-1].angle;
	    			CORPSLIST[CORPSLIST.length-1].y = 50;
		    	}
	    	}
	    	
	    	for(var i = 0;i <= CORPSLIST.length-2;i++){
	    		var x1 = CORPSLIST[CORPSLIST.length-1].x - CORPSLIST[CORPSLIST.length-1].r;
	    		var y1 = CORPSLIST[CORPSLIST.length-1].y - CORPSLIST[CORPSLIST.length-1].r;
	    		var rcollide1 = CORPSLIST[CORPSLIST.length-1].rcollide;
	    		var rfield1 = CORPSLIST[CORPSLIST.length-1].rfield;
	    		var x2 = CORPSLIST[i].x - CORPSLIST[i].r;
	    		var y2 = CORPSLIST[i].y - CORPSLIST[i].r;
	    		var rcollide2 = CORPSLIST[i].rcollide;
	    		var rfield2 = CORPSLIST[i].rfield;
	    		if(circleIntersection(x1,y1,rcollide1,x2,y2,rfield2)){
	    			attract(CORPSLIST[CORPSLIST.length-1],CORPSLIST[i]);
	    		}
	    		if(circleIntersection(x1,y1,rcollide1,x2,y2,rcollide2)){
	    			collide(CORPSLIST.length-1,i);
	    		}
	    	}
	    	
	    	/*console.log("moved[x="+CORPSLIST[CORPSLIST.length-1].x
	    			+",y="+CORPSLIST[CORPSLIST.length-1].y
	    			+",v="+CORPSLIST[CORPSLIST.length-1].v
	    			+",angle="+CORPSLIST[CORPSLIST.length-1].angle
	    			+",radius="+CORPSLIST[CORPSLIST.length-1].r
	    			+"]");
	    	*/
	    	//fin du déplacement
	    	if(CORPSLIST[CORPSLIST.length-1].v == 0){
	    		setScreen(1);
	    		ACTIVCORPS = null;
	    		
	    		//switch turn
	    		if(ga.playerTurn == 1)
					ga.playerTurn = 2;
				else
					ga.playerTurn = 1;
	    	}

			

		};
		
		//TODO: save
		this.saveGame = function(){
			if(debug)console.log("saveGame");


		};
		
		//TODO: end
		this.stopGame = function(){
			if(debug)console.log("stopGame");
			//cancelAnimationFrame(ga.frameHandler);
		};
		
		//dessine le terrain
		this.setBoard = function() {
			//if(debug)console.log("setBoard");
			
 			ga.contexte.strokeStyle = "white";
 			ga.contexte.moveTo(ga.canvas.width/2,50);
 			ga.contexte.lineTo(ga.canvas.width/2,ga.canvas.height - 50);
 			ga.contexte.stroke();
 
			ga.contexte.strokeStyle = "white";
			ga.contexte.strokeRect(50,50, ga.bwidth, ga.bheight);
		};

		//this.shot = function(turn,f,angle,dt){};
	
	};

	//class player
	function player(num,name){
		var p = this;
		this.numero = num;
		this.playerName = name;	
	};
	
	//class gui, interface
	function gui() {		
		
		var g = this;
		
		//game default settings
		this.game = null;
		this.player1 = new player(1,"Spoke");
		this.player2 = new player(2,"Obi-Wan");
		
		//graphic
		this.canvas = $("#gui").get(0);
		this.contexte = this.canvas.getContext('2d');
		this.canvasOffset = $("#gui").offset();
		this.offsetX = this.canvasOffset.left;
		this.offsetY = this.canvasOffset.top;
		this.startX;
		this.startY;
		this.cx1 = 50;
		this.cy1 = this.canvas.height / 2;
		this.cx2 = this.canvas.width - 50;
		this.cy2 = this.canvas.height / 2;
		this.w;
		this.h;
		this.r = 0;
		this.r1 = 0;
		this.r2 = Math.PI;
		this.tempx;
		this.tempy;
		
		//affichage des coordonées de la souris
		if(debug){
			g.canvas.addEventListener('mousemove', function(ev){
				var p = {
		                x: ev.clientX - g.canvas.getBoundingClientRect().left,
		                y: ev.clientY - g.canvas.getBoundingClientRect().top
		            };
				var pt;
				if(SCREEN == 1)
					pt = g.game.playerTurn;
				else
					pt = 0;
				$("#debug_box").html("x : " + p.x 
						+ "<br/>y : " + p.y 
						+ "<br/>Turn : Player " + pt
						+ "<br/>R1 : " + g.r1
						+ "<br/>R2 : " + g.r2);			
			});
		}
		
		//textes des menus
		this.txrPause = "Pause";
		this.txtReprendre = "Reprendre";
		this.txtQuitter = "Quitter";
		this.txtJouer = "Jouer";
		this.txtParametrer = "Parametres";
		this.txtSauver = "Sauver";
		this.txtNomP1 = "Nom Player 1";
		this.txtNomP2 = "Nom Player 2";
		
		//"box" menu
		this.menuSlot0 = {
			    x: 10,
			    y: 10,
			    w: 30,
			    h: 30
			};
		this.menuSlot1 = {
			    x: g.canvas.width/2,
			    y: g.canvas.height/3,
			    w: 80,
			    h: FONTSIZEMENU
			};
		this.menuSlot2 = {
			    x: g.canvas.width/2,
			    y: g.canvas.height/3+(40*1),
			    w: 150,
			    h: FONTSIZEMENU
			};
		this.menuSlot3 = {
			    x: g.canvas.width/2,
			    y: g.canvas.height/3+(40*2),
			    w: 100,
			    h: FONTSIZEMENU
			};
		
		this.canon1 = new Image();
		this.canon2 = new Image();
		
		this.setCanon = function(){
			g.canon1.onload = function() {
				g.w = g.canon1.width / 2;
			    g.h = g.canon1.height / 2;
			    g.draw();
			};
			
			g.canon2.onload = function() {
				g.w = g.canon1.width / 2;
			    g.h = g.canon1.height / 2;
			    g.draw();
			};
			g.canon1.src = "images/canon.png";
			g.canon2.src = "images/canon.png";
		};
		
		//dessin gui
		this.draw = function () {
			if(g.game != null && g.game.started == true && SCREEN == 1){
				//g.contexte.save();
				g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
			    //g.drawRotationHandle(true);
				g.showBtn();
			    g.drawRect();
			    //g.contexte.restore();
			}
		};
		
		//dessin canon
		this.drawRect = function () {
			
			g.contexte.save();
			g.contexte.translate(g.cx1, g.cy1);
		    g.contexte.rotate(g.r1);
	    	g.contexte.drawImage(g.canon1, 0, 0, g.canon1.width, g.canon1.height, -g.w / 2, -g.h / 2, g.w, g.h);
	    	g.contexte.restore();

			g.contexte.save();
			g.contexte.translate(g.cx2, g.cy2);
		    g.contexte.rotate(g.r2);
	    	g.contexte.drawImage(g.canon2, 0, 0, g.canon2.width, g.canon2.height, -g.w / 2, -g.h / 2, g.w, g.h);
	    	g.contexte.restore();

		};
		
		/*//dessin un viseur, useless
		this.drawRotationHandle = function () {
			g.contexte.save();
			g.contexte.translate(g.cx, g.cy);
			g.contexte.rotate(g.r);
			g.contexte.beginPath();
			g.contexte.moveTo(0, -1);
			g.contexte.lineTo(g.w / 2 + 20, -1);
			g.contexte.lineTo(g.w / 2 + 20, -7);
			g.contexte.lineTo(g.w / 2 + 30, -7);
			g.contexte.lineTo(g.w / 2 + 30, 7);
			g.contexte.lineTo(g.w / 2 + 20, 7);
			g.contexte.lineTo(g.w / 2 + 20, 1);
			g.contexte.lineTo(0, 1);
			g.contexte.closePath();
	    	g.contexte.fillStyle = "blue";
		    g.contexte.fill();
		    g.contexte.restore();
		};
		*/
		
		//detetion de l'angle de visée et animation du canon
		this.handleMouseMove = function (e) {
			if(g.game != null && g.game.started && SCREEN == 1){
			    mouseX = parseInt(e.clientX - g.offsetX);
			    mouseY = parseInt(e.clientY - g.offsetY);
			    var dx;
			    var dy;
			    if(g.game.playerTurn == 1){
			    	dx = mouseX - g.cx1;
				    dy = mouseY - g.cy1;
			    }
			    else{
			    	dx = mouseX - g.cx2;
				    dy = mouseY - g.cy2;
			    }
			    var angle = Math.atan2(dy, dx);
			    g.r = angle;
			    
			    if(g.game.playerTurn == 1){
			    	g.r1 = angle;
			    }
			    else {
			    	g.r2 = angle;
			    }
			    g.draw();
			}
		};
		
		//detection du mouvement de souris
		$("#gui").mousemove(function (e) {
			g.handleMouseMove(e);
		});
		
	
		//actions sur clicks enfoncé
		this.canvas.addEventListener('mousedown',  function(){
		       t1 = new Date().getTime();
		});
		
		//actions sur clicks
		this.canvas.addEventListener('mouseup', function(e){
			var p = {
	                x: e.clientX - g.canvas.getBoundingClientRect().left,
	                y: e.clientY - g.canvas.getBoundingClientRect().top
	            };
			
			//menu principal
			if(SCREEN === 0){
				//click sur Jouer
			    if (p.x >= g.menuSlot1.x && p.x <= g.menuSlot1.x + g.menuSlot1.w &&
				        p.y >= g.menuSlot1.y - g.menuSlot1.h && p.y <= g.menuSlot1.y ) {
			    	g.hideMainMenu();
			    	g.game.launchGame();
			    	g.setCanon();

			    }
			    else{
			    	//click sur parametres
			    	if (p.x >= g.menuSlot2.x && p.x <= g.menuSlot2.x + g.menuSlot2.w &&
					        p.y >= g.menuSlot2.y - g.menuSlot2.h && p.y <= g.menuSlot2.y ) {
			    		g.showParametre();
				    }
			    }
			}
			else{
				//Pendant partie
				if(SCREEN === 1){
					//click sur bouton parametre
					if (p.x >= g.menuSlot0.x && p.x <= g.menuSlot0.x + g.menuSlot0.w &&
					        p.y >= g.menuSlot0.y && p.y <= g.menuSlot0.y + g.menuSlot0.h) {
						g.showMainMenu();
						
				    }
					else{
						/* tire vers position pointé */
						
						var angle;
								if(g.game.playerTurn == 1)
							angle = g.r1;
						else
							angle = g.r2;
						t2 = new Date().getTime();
					    var shotForce = Math.round((t2 - t1) / 10);
					    if(shotForce > 200)
					    	shotForce = 200;
						t1 = null;
						t2 = null;
						//TOD0(fait): augmenter shotForce de 75 à 150 en fonction du temps appuyer sur le click
						console.log("Creation d'un corps : Joueur " + g.game.playerTurn + ", force = " + shotForce + ", angle = " + angle );
						ACTIVCORPS = new corp(g.game.playerTurn,shotForce,angle);
						g.game.addCorp(ACTIVCORPS);
						setScreen(4);
					}
				}
				else{
					//menu parametres
					if(SCREEN === 2){
						//click sur Nom Player 1
						if (p.x >= g.menuSlot1.x && p.x <= g.menuSlot1.x + g.menuSlot1.w &&
						        p.y >= g.menuSlot1.y - g.menuSlot1.h && p.y <= g.menuSlot1.y ) {
							var player1name = prompt("Enter Player 1 name",g.player1.playerName);
							if(player1name != null && player1name != undefined)
								g.player1.playerName = player1name;
							else
								player1name = prompt("Enter correct Player 1 name please",g.player1.playerName);
						}
						else{
							//click sur  Nom Player 2
							if (p.x >= g.menuSlot2.x && p.x <= g.menuSlot2.x + g.menuSlot2.w &&
							        p.y >= g.menuSlot2.y - g.menuSlot2.h && p.y <= g.menuSlot2.y ) {
								var player2name = prompt("Enter Player 2 name",g.player2.playerName);
								if(player2name != null && player2name != undefined)
									g.player2.playerName = player2name;
								else
									player2name = prompt("Enter correct Player 2 name please",g.player2.playerName);
						    }
							else{
								//click sur Sauver
								if (p.x >= g.menuSlot3.x && p.x <= g.menuSlot3.x + g.menuSlot3.w &&
								        p.y >= g.menuSlot3.y - g.menuSlot3.h && p.y <= g.menuSlot3.y ) {
									g.hideMainMenu();
								}
							}
						}
					}
					else{
						//Menu pause
						if(SCREEN === 3){
							//click sur Reprendre
							if (p.x >= g.menuSlot1.x && p.x <= g.menuSlot1.x + g.menuSlot1.w &&
							        p.y >= g.menuSlot1.y - g.menuSlot1.h && p.y <= g.menuSlot1.y ) {
								g.hideMainMenu();
							}
							else{
								//click sur Quitter
								if (p.x >= g.menuSlot2.x && p.x <= g.menuSlot2.x + g.menuSlot2.w &&
								        p.y >= g.menuSlot2.y - g.menuSlot2.h && p.y <= g.menuSlot2.y ) {
									g.showMainMenu();
							    }
							}
						}
					}
				}
			}
		},false);
		
		
		//actions sur position souris
		this.canvas.addEventListener('mousemove', function(e){
			var p = {
	                x: e.clientX - g.canvas.getBoundingClientRect().left,
	                y: e.clientY - g.canvas.getBoundingClientRect().top
	            };
			
			//menu principal
			if(SCREEN === 0){
				//souris sur Jouer
			    if (p.x >= g.menuSlot1.x && p.x <= g.menuSlot1.x + g.menuSlot1.w &&
				        p.y >= g.menuSlot1.y - g.menuSlot1.h && p.y <= g.menuSlot1.y ) {
			    	g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
					g.contexte.font = STYLEMENU;
					g.contexte.strokeStyle = COLORMENU;
					g.contexte.strokeText(g.txtJouer,g.menuSlot1.x,g.menuSlot1.y);
					
					g.contexte.font = STYLEMENU;
					g.contexte.fillStyle = COLORMENU;
					g.contexte.fillText(g.txtParametrer,g.menuSlot2.x,g.menuSlot2.y);

			    }
			    else{
			    	//souris sur parametres
			    	if (p.x >= g.menuSlot2.x && p.x <= g.menuSlot2.x + g.menuSlot2.w &&
					        p.y >= g.menuSlot2.y - g.menuSlot2.h && p.y <= g.menuSlot2.y ) {
			    		g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
						g.contexte.font = STYLEMENU;
						g.contexte.fillStyle = COLORMENU;
						g.contexte.fillText(g.txtJouer,g.menuSlot1.x,g.menuSlot1.y);
						
						g.contexte.font = STYLEMENU;
						g.contexte.strokeStyle = COLORMENU;
						g.contexte.strokeText(g.txtParametrer,g.menuSlot2.x,g.menuSlot2.y);
				    }
			    	else{
			    		g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
						g.contexte.font = STYLEMENU;
						g.contexte.fillStyle = COLORMENU;
						g.contexte.fillText(g.txtJouer,g.menuSlot1.x,g.menuSlot1.y);
						
						g.contexte.font = STYLEMENU;
						g.contexte.fillStyle = COLORMENU;
						g.contexte.fillText(g.txtParametrer,g.menuSlot2.x,g.menuSlot2.y);
			    	}
			    }
			}
			else{
				//Pendant partie
				if(SCREEN === 1){
					//souris sur bouton parametre
					if (p.x >= g.menuSlot0.x && p.x <= g.menuSlot0.x + g.menuSlot0.w &&
					        p.y >= g.menuSlot0.y && p.y <= g.menuSlot0.y + g.menuSlot0.h) {
												
				    }
				}
				else{
					//menu parametres
					if(SCREEN === 2){
						//souris sur Nom Player 1
						if (p.x >= g.menuSlot1.x && p.x <= g.menuSlot1.x + g.menuSlot1.w &&
						        p.y >= g.menuSlot1.y - g.menuSlot1.h && p.y <= g.menuSlot1.y ) {
							g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
							g.contexte.font = STYLEMENU;
							g.contexte.strokeStyle = COLORMENU;
							g.contexte.strokeText(g.txtNomP1,g.menuSlot1.x,g.menuSlot1.y);
							
							g.contexte.font = STYLEMENU;
							g.contexte.fillStyle = COLORMENU;
							g.contexte.fillText(g.txtNomP2,g.menuSlot2.x,g.menuSlot2.y);
							
							g.contexte.font = STYLEMENU;
							g.contexte.fillStyle = COLORMENU;
							g.contexte.fillText(g.txtSauver,g.menuSlot3.x,g.menuSlot3.y);
						}
						else{
							//souris sur  Nom Player 2
							if (p.x >= g.menuSlot2.x && p.x <= g.menuSlot2.x + g.menuSlot2.w &&
							        p.y >= g.menuSlot2.y - g.menuSlot2.h && p.y <= g.menuSlot2.y ) {
								g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
								g.contexte.font = STYLEMENU;
								g.contexte.fillStyle = COLORMENU;
								g.contexte.fillText(g.txtNomP1,g.menuSlot1.x,g.menuSlot1.y);
								
								g.contexte.font = STYLEMENU;
								g.contexte.strokeStyle = COLORMENU;
								g.contexte.strokeText(g.txtNomP2,g.menuSlot2.x,g.menuSlot2.y);
								
								g.contexte.font = STYLEMENU;
								g.contexte.fillStyle = COLORMENU;
								g.contexte.fillText(g.txtSauver,g.menuSlot3.x,g.menuSlot3.y);
						    }
							else{
								//souris sur Sauver
								if (p.x >= g.menuSlot3.x && p.x <= g.menuSlot3.x + g.menuSlot3.w &&
								        p.y >= g.menuSlot3.y - g.menuSlot3.h && p.y <= g.menuSlot3.y ) {
									g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
									g.contexte.font = STYLEMENU;
									g.contexte.fillStyle = COLORMENU;
									g.contexte.fillText(g.txtNomP1,g.menuSlot1.x,g.menuSlot1.y);
									
									g.contexte.font = STYLEMENU;
									g.contexte.fillStyle = COLORMENU;
									g.contexte.fillText(g.txtNomP2,g.menuSlot2.x,g.menuSlot2.y);
									
									g.contexte.font = STYLEMENU;
									g.contexte.strokeStyle = COLORMENU;
									g.contexte.strokeText(g.txtSauver,g.menuSlot3.x,g.menuSlot3.y);
								}
								else {
									g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
									g.contexte.font = STYLEMENU;
									g.contexte.fillStyle = COLORMENU;
									g.contexte.fillText(g.txtNomP1,g.menuSlot1.x,g.menuSlot1.y);
									
									g.contexte.font = STYLEMENU;
									g.contexte.fillStyle = COLORMENU;
									g.contexte.fillText(g.txtNomP2,g.menuSlot2.x,g.menuSlot2.y);
									
									g.contexte.font = STYLEMENU;
									g.contexte.fillStyle = COLORMENU;
									g.contexte.fillText(g.txtSauver,g.menuSlot3.x,g.menuSlot3.y);
								}
							}
						}
					}
					else{
						//Menu pause
						if(SCREEN === 3){
							//souris sur Reprendre
							if (p.x >= g.menuSlot1.x && p.x <= g.menuSlot1.x + g.menuSlot1.w &&
							        p.y >= g.menuSlot1.y - g.menuSlot1.h && p.y <= g.menuSlot1.y ) {
								g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
								g.contexte.font = STYLEMENU;
								g.contexte.strokeStyle = COLORMENU;
								g.contexte.strokeText(g.txtReprendre,g.menuSlot1.x,g.menuSlot1.y);
								
								g.contexte.font = STYLEMENU;
								g.contexte.fillStyle = COLORMENU;
								g.contexte.fillText(g.txtQuitter,g.menuSlot2.x,g.menuSlot2.y);
							}
							else{
								//souris sur Quitter
								if (p.x >= g.menuSlot2.x && p.x <= g.menuSlot2.x + g.menuSlot2.w &&
								        p.y >= g.menuSlot2.y - g.menuSlot2.h && p.y <= g.menuSlot2.y ) {
									g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
									g.contexte.font = STYLEMENU;
									g.contexte.fillStyle = COLORMENU;
									g.contexte.fillText(g.txtReprendre,g.menuSlot1.x,g.menuSlot1.y);
									
									g.contexte.font = STYLEMENU;
									g.contexte.strokeStyle = COLORMENU;
									g.contexte.strokeText(g.txtQuitter,g.menuSlot2.x,g.menuSlot2.y);
							    }
								else{
									g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
									g.contexte.font = STYLEMENU;
									g.contexte.fillStyle = COLORMENU;
									g.contexte.fillText(g.txtReprendre,g.menuSlot1.x,g.menuSlot1.y);
									
									g.contexte.font = STYLEMENU;
									g.contexte.fillStyle = COLORMENU;
									g.contexte.fillText(g.txtQuitter,g.menuSlot2.x,g.menuSlot2.y);
								}
							}
						}
					}
				}
			}
		});
		
		this.showMainMenu = function(){
			if(debug)console.log("showMainMenu[SCREEN="+SCREEN+"]");
			if(SCREEN === 0 || SCREEN === 2){
				//Afficher menu principal
				setScreen(0);
				g.menuSlot1.w = 80;
				g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
				g.contexte.font = STYLEMENU;
				g.contexte.fillStyle = COLORMENU;
				g.contexte.fillText(g.txtJouer,g.menuSlot1.x,g.menuSlot1.y);
				
				g.menuSlot2.w = 150;
				g.contexte.font = STYLEMENU;
				g.contexte.fillStyle = COLORMENU;
				g.contexte.fillText(g.txtParametrer,g.menuSlot2.x,g.menuSlot2.y);
					
			}
			else{
				if(SCREEN === 1){
					//Afficher menu pause
					g.contexte.save();
					setScreen(3);
					g.menuSlot1.w = 150;
					g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
					g.contexte.font = STYLEMENU;
					g.contexte.fillStyle = COLORMENU;
					g.contexte.fillText(g.txtReprendre,g.menuSlot1.x,g.menuSlot1.y);
					
					g.menuSlot2.w = 90;
					g.contexte.font = STYLEMENU;
					g.contexte.fillStyle = COLORMENU;
					g.contexte.fillText(g.txtQuitter,g.menuSlot2.x,g.menuSlot2.y);
					g.contexte.restore();
				}
				else{
					if(SCREEN === 3){
						//TODO : Quitte une partie en cours 
						
						setScreen(0);
						g.menuSlot1.w = 80;
						g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
						g.contexte.font = STYLEMENU;
						g.contexte.fillStyle = COLORMENU;
						g.contexte.fillText(g.txtJouer,g.menuSlot1.x,g.menuSlot1.y);
						
						g.menuSlot2.w = 150;
						g.contexte.font = STYLEMENU;
						g.contexte.fillStyle = COLORMENU;
						g.contexte.fillText(g.txtParametrer,g.menuSlot2.x,g.menuSlot2.y);
					}
				}
			}
		};
		
		this.showParametre = function() {
			setScreen(2);
			g.menuSlot1.w = 180;
			g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
			g.contexte.font = STYLEMENU;
			g.contexte.fillStyle = COLORMENU;
			g.contexte.fillText(g.txtNomP1,g.menuSlot1.x,g.menuSlot1.y);
			
			g.menuSlot2.w = 180;
			g.contexte.font = STYLEMENU;
			g.contexte.fillStyle = COLORMENU;
			g.contexte.fillText(g.txtNomP2,g.menuSlot2.x,g.menuSlot2.y);
			
			g.menuSlot3.w = 100;
			g.contexte.font = STYLEMENU;
			g.contexte.fillStyle = COLORMENU;
			g.contexte.fillText(g.txtSauver,g.menuSlot3.x,g.menuSlot3.y);
		};
		
		this.hideMainMenu = function(){
			if(SCREEN === 0){
				//Lancer la partie
				setScreen(1);
				g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
				g.showBtn();
			}
			else {
				if(SCREEN === 2){
					//TODO : save param
					g.showMainMenu();
				}
				else{
					if(SCREEN === 3){
						//TODO : retour partie en cours
						setScreen(1);
						g.contexte.clearRect(0, 0, g.canvas.width, g.canvas.height);
						g.showBtn();
						g.contexte.restore();
					}
				}
			}
		};
				
		this.showBtn = function () {
			var btnMenu = new Image;
			btnMenu.onload = function() {
				g.contexte.drawImage(btnMenu,g.menuSlot0.x,g.menuSlot0.y,g.menuSlot0.w,g.menuSlot0.h);
			};
			btnMenu.src = "images/menu.png";
			
		};
	};
	
	


	//Gravity Game
	var back = new Image;
	var canvasFond = $("#fond").get(0);
	var contexteFond = canvasFond.getContext('2d'); 
	back.onload = function() {
		contexteFond.drawImage(back,0,0,1024,768);
	};
	back.src = "images/background.jpg";
	var gui = new gui();
	gui.showMainMenu();
	gui.game = new game(gui.player1,gui.player2);
	gui.game.mainLoop(0);
	
});

