/*
 *
 * Player.js
 * Centralizes all player related functionality.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/core/Player.js",
        _Player = {},
		_Game,
		_Character,
		_Planting,
		_MathHelper,
		_KeyHelper,
		_SceneHelper,
		_ObjectHelper;
	
	/*===================================================
    
    public properties
    
    =====================================================*/
	
	main.asset_register( assetPath, { 
		data: _Player,
		requirements: [
			"assets/modules/core/Game.js",
			"assets/modules/core/Character.js",
			"assets/modules/farming/Planting.js",
			"assets/modules/utils/MathHelper.js",
			"assets/modules/utils/KeyHelper.js",
			"assets/modules/utils/SceneHelper.js",
			"assets/modules/utils/ObjectHelper.js",
		],
		callbacksOnReqs: init_internal,
		wait: true
	});
	
	/*===================================================
    
    external init
    
    =====================================================*/
	
	function init_internal ( g, c, pl, mh, kh, sh, oh ) {
		console.log('internal player');
		
		// assets
		
		_Game = g;
		_Character = c;
		_Planting = pl;
		_MathHelper = mh;
		_KeyHelper = kh;
		_SceneHelper = sh;
		_ObjectHelper = oh;
		
		// properties
		
		_Player.options = {
			stats: {
				respawnOnDeath: true
			},
			movement: {
				move: {
					speed: 3
				},
				jump: {
					speedStart: 3,
					duration: 200,
					startDelay: 125,
					moveSpeedMod: 0
				}
			}
		};
		
		// instance
		
		_Player.Instance = Player;
		_Player.Instance.prototype = new _Character.Instance();
		_Player.Instance.prototype.constructor = _Player.Instance;
		_Player.Instance.prototype.supr = _Character.Instance.prototype;
		
		_Player.Instance.prototype.die = die;
		_Player.Instance.prototype.respawn = respawn;
		_Player.Instance.prototype.select = select;
		
		_Player.Instance.prototype.set_keybindings = set_keybindings;
		_Player.Instance.prototype.allow_control = allow_control;
		_Player.Instance.prototype.remove_control = remove_control;
		_Player.Instance.prototype.trigger_key = trigger_key;
		
		_Player.Instance.prototype.enable = enable;
		_Player.Instance.prototype.disable = disable;
		
		Object.defineProperty( _Player.Instance.prototype, 'parent', { 
			get : function () { return this._parent; },
			set: function ( parent ) {
				
				var scene;
				
				this._parent = parent;
				
				if ( this._parent instanceof THREE.Object3D ) {
					
					scene = _SceneHelper.extract_parent_root( this );
					
					if ( scene instanceof THREE.Scene !== true ) {
						
						this.disable();
						
					}
					
				}
				
			}
		});
		
		Object.defineProperty( _Player.Instance.prototype, 'target', { 
			get : function () { return this._target; },
			set: function ( target ) {
				
				this._target = target;
				
				// TODO: update UI to reflect target change
				
			}
		});
		
	}
	
	/*===================================================
    
    instance
    
    =====================================================*/
	
    function Player ( parameters ) {
		
		var me = this,
			kb;
		
		parameters = parameters || {};
		
		parameters.name = 'Hero';
		
		parameters.geometry = main.get_asset_data( "assets/models/Hero.js" ) || new THREE.CubeGeometry( 50, 100, 50 );
		parameters.material = new THREE.MeshLambertMaterial( { color: 0xFFF7E0, ambient: 0xFFF7E0, vertexColors: THREE.VertexColors } );
		
		parameters.physics = parameters.physics || {};
		parameters.physics.bodyType = 'capsule';
		parameters.physics.movementDamping = 0.5;
		
		_Character.Instance.call( this, parameters );
		
		// options
		
		this.options = $.extend( true, this.options || {}, _Player.options, parameters.options );
		
		// default keybindings
		
		kb = this.keybindingsDefault = {};
		
		// pointer
		
		kb[ 'pointer' ] = 'pointer';
		
		// wasd / arrows
		
		kb[ 'w' ] = kb[ 'up_arrow' ] = 'w';
		kb[ 's' ] = kb[ 'down_arrow' ] = 's';
		kb[ 'a' ] = kb[ 'left_arrow' ] = 'a';
		kb[ 'd' ] = kb[ 'right_arrow' ] = 'd';
		
		// qe
		
		kb[ 'q' ] = 'q';
		kb[ 'e' ] = 'e';
		
		// numbers
		
		kb[ '1' ] = '1';
		kb[ '2' ] = '2';
		kb[ '3' ] = '3';
		kb[ '4' ] = '4';
		kb[ '5' ] = '5';
		kb[ '6' ] = '6';
		
		// misc
		
		kb[ 'escape' ] = 'escape'
		kb[ 'space' ] = 'space';
		
		// set list of keys that are always available
		
		kb.alwaysAvailable = ['escape'];
		
		this.set_keybindings( kb );
		
		// actions
		
		// wasd / arrows
		
		this.actions.add( 'w up_arrow', {
			eventCallbacks: {
				down: function () {
					me.move_state_change( 'forward' );
				},
				up: function () {
					me.move_state_change( 'forward', true );
				}
			},
			deactivateCallbacks: 'up'
		} );
		
		this.actions.add( 's down_arrow', {
			eventCallbacks: {
				down: function () {
					me.move_state_change( 'back' );
				},
				up: function () {
					me.move_state_change( 'back', true );
				}
			},
			deactivateCallbacks: 'up'
		} );
		
		this.actions.add( 'a left_arrow', {
			eventCallbacks: {
				down: function () {
					me.move_state_change( 'left' );
				},
				up: function () {
					me.move_state_change( 'left', true );
				}
			},
			deactivateCallbacks: 'up'
		} );
		
		this.actions.add( 'd right_arrow', {
			eventCallbacks: {
				down: function () {
					me.move_state_change( 'right' );
				},
				up: function () {
					me.move_state_change( 'right', true );
				}
			},
			deactivateCallbacks: 'up'
		} );
		
		// jump
		
		this.actions.add( 'space', {
			eventCallbacks: {
				down: function () {
					me.move_state_change( 'up' );
				},
				up: function () {
					me.move_state_change( 'up', true );
				}
			},
			deactivateCallbacks: 'up'
		} );
		
		// misc
		
		this.actions.add( 'escape', {
			eventCallbacks: {
				up: function () {
					
					if ( _Game.paused === true ) {
						
						_Game.resume();
						
					}
					else {
						
						_Game.pause();
						
					}
					
				}
			}
		} );
		
		// selection
		
		this.actions.add( 'pointer', {
			eventCallbacks: {
				mousemove: function () {
					
					var target = _Game.get_pointer_intersection( {
						objectOnly: true
					} );
					
					// cursor change on mouse over interactive
					
					if ( target instanceof THREE.Object3D && target.interactive === true ) {
						
						shared.domElements.$game.css( 'cursor', 'pointer' );
						
					}
					else {
						
						shared.domElements.$game.css( 'cursor', 'auto' );
						
					}
					
				},
				tap: $.proxy( this.select, this )
			}
		} );
		
		// camera rotating
		
		this.actions.add( 'pointer', {
			eventCallbacks: {
				dragstart: $.proxy( _Game.cameraControls.rotate_start, _Game.cameraControls ),
				drag: $.proxy( _Game.cameraControls.rotate, _Game.cameraControls  ),
				dragend: $.proxy( _Game.cameraControls.rotate_stop, _Game.cameraControls  ),
			},
			activeCheck: function () {
				return _Game.cameraControls.rotating;
			},
			options: {
				priority: 1,
				silencing: true
			}
		} );
		
		// planting
		
		this.planting = new _Planting.Instance( {
			affectUI: true
		} );
		
		this.actions.add( 'pointer', {
			eventCallbacks: {
				// TODO: replace tap planting select with general select
				//tap: [ $.proxy( this.planting.select_puzzle, this.planting ), $.proxy( this.planting.select_plant, this.planting ) ],
				hold: $.proxy( this.planting.activate_puzzle, this.planting ),
				dragstart: $.proxy( this.planting.activate_plant, this.planting ),
				drag: $.proxy( this.planting.step, this.planting ),
				dragend: $.proxy( this.planting.complete, this.planting ),
				doubletap: $.proxy( this.planting.delete_plant, this.planting )
			},
			deactivateCallbacks: $.proxy( this.planting.stop, this.planting ),
			activeCheck: function () {
				return me.planting.started;
			},
			options: {
				priority: 2,
				silencing: true
			}
		} );
		
	}
	
	/*===================================================
    
    die
    
    =====================================================*/
	
	function die () {
		
		_Player.Instance.prototype.supr.die.apply( this, arguments );
		
		this.remove_control();
		
	}
	
	/*===================================================
    
    respawn
    
    =====================================================*/
	
	function respawn () {
		
		_Player.Instance.prototype.supr.respawn.apply( this, arguments );
		
		_Game.cameraControls.target = undefined;
		_Game.cameraControls.target = this;
		_Game.cameraControls.rotateTarget = true;
		
		this.enable();
		
	}
	
	/*===================================================
    
    selection
    
    =====================================================*/
	
	function select ( parameters ) {
	
		var target;
		
		parameters = parameters || {};
		
		// find target
		
		if ( parameters instanceof THREE.Object3D ) {
			
			target = parameters;
			
		}
		else if ( parameters.target instanceof THREE.Object3D ) {
			
			target = parameters.target;
			
		}
		else {
			
			parameters.objectOnly = true;
		
			target = _Game.get_pointer_intersection( parameters );
			
		}
		
		// update target
		
		_Player.Instance.prototype.supr.select.call( this, target );
		
	}
	
	/*===================================================
    
    keybindings
    
    =====================================================*/
	
	function set_keybindings ( keybindings ) {
		
		this.keybindings = $.extend( true, this.keybindings || {}, keybindings );
		
	}
	
	/*===================================================
    
    controls
    
    =====================================================*/
	
	function allow_control () {
		
		// signals
		
		shared.signals.onGamePointerMoved.add( trigger_key, this );
		shared.signals.onGamePointerTapped.add( trigger_key, this );
		shared.signals.onGamePointerDoubleTapped.add( trigger_key, this );
		shared.signals.onGamePointerHeld.add( trigger_key, this );
		shared.signals.onGamePointerDragStarted.add( trigger_key, this );
		shared.signals.onGamePointerDragged.add( trigger_key, this );
		shared.signals.onGamePointerDragEnded.add( trigger_key, this );
		shared.signals.onGamePointerWheel.add( trigger_key, this );
		
		shared.signals.onKeyPressed.add( trigger_key, this );
		shared.signals.onKeyReleased.add( trigger_key, this );
		
	}
	
	function remove_control () {
		
		// signals
		
		shared.signals.onGamePointerMoved.remove( trigger_key, this );
		shared.signals.onGamePointerTapped.remove( trigger_key, this );
		shared.signals.onGamePointerDoubleTapped.remove( trigger_key, this );
		shared.signals.onGamePointerHeld.remove( trigger_key, this );
		shared.signals.onGamePointerDragStarted.remove( trigger_key, this );
		shared.signals.onGamePointerDragged.remove( trigger_key, this );
		shared.signals.onGamePointerDragEnded.remove( trigger_key, this );
		shared.signals.onGamePointerWheel.remove( trigger_key, this );
		
		shared.signals.onKeyPressed.remove( trigger_key, this );
		shared.signals.onKeyReleased.remove( trigger_key, this );
		
		// clear keys
		
		this.actions.clear_active();
		
	}
	
	function trigger_key ( e ) {
		
		var kbMap = this.keybindings,
			keyCode,
			keyName,
			keyNameActual,
			state,
			type,
			isAlwaysAvailable,
			cameraRotated;
		
		// check for meta keys
		
		if ( e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ) {
			return;
		}
		
		// handle by type
		
		type = ( e.type + '' );
		
		// special cases for pointer / mouse
		
		if ( type === 'tap' || type === 'doubletap' || type === 'hold' || type === 'dragstart' || type === 'drag' || type === 'dragend' || type === 'mousemove' ) {
			
			keyName = 'pointer';
			state = type;
			
		}
		else if ( type === 'mousewheel' || type === 'DOMMouseScroll' ) {
			
			keyName = 'pointer';
			state = 'wheel';
			
		}
		// fallback to key press
		else {
			
			keyCode = ( ( e.which || e.key || e.keyCode ) + '' ).toLowerCase();
			keyName = _KeyHelper.key( keyCode );
			
			state = type.toLowerCase();
			state = state.replace( 'key', '' );
			
		}
		
		// get mapped key name
		
		keyNameActual = kbMap[ keyName ] || keyName;
		
		// if enabled or key is always available
		
		isAlwaysAvailable = main.index_of_value( kbMap.alwaysAvailable, keyNameActual ) !== -1;
		
		if ( this.state.enabled === true || isAlwaysAvailable ) {
			
			parameters = {
				event: e,
				allowDefault: isAlwaysAvailable || _Game.paused
			};
			
			// perform action
			
			this.actions.execute( keyNameActual, state, parameters );
			
		}
		
	}
	
	/*===================================================
    
    enable / disable
    
    =====================================================*/
	
	function enable () {
		
		this.state.enabled = true;
		
		this.allow_control();
		
		shared.signals.onGameUpdated.add( this.update, this );
		
	}
	
	function disable () {
		
		shared.signals.onGameUpdated.remove( this.update, this );
		
		this.remove_control();
		
		this.state.enabled = false;
		
	}
	
	/*===================================================
    
    update
    
    =====================================================*/
	
	function update ( timeDelta, timeDeltaMod ) {
		
		_Player.Instance.prototype.supr.update.apply( this, arguments );
		
		// TODO: update selected?
		
	}
	
} ( KAIOPUA ) );