
var gui = cc._isNodeJs ? require('nw.gui') : null;

//[GAME STARTING SCRIPT IS '!main(cocos).js']

//note: global vars are set in [!vars(editor).js and !vars(app).js]
var gScene;
var gRenderLayer;

var menuShowing = false;

var UpdateFunction = function()
{
    //execute gameover mechanics
    if ( gServices.SysVars.gameover )
    {
        if ( gAppType == "app(desktop)" && gui )
        {
            var win = gui.Window.get();
            if ( win )
                win.close();
        }
    }
    //update buttonAliveRegion
    if ( btnAliveRegion != "" )
    {
        var btnAliveRegionExists = false;
        for ( var i = 0; i < NParser.m_parserDeque.length; ++i)
        {
            if ( NParser.m_parserDeque[i].m_scriptName == btnAliveRegion )
                btnAliveRegionExists = true;
        }
        if ( !btnAliveRegionExists )
            btnAliveRegion = "";
    }

    UpdateMedia();

    AutoContScript_ifNeeded();
};

var RenderLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {

        //////////////////////////////
        // 1. super init first
        this._super();
		var that = this;
        gRenderLayer = that;

        cc.log( "\nAPP TYPE: %s\n", gAppType );

        //[SETUP CAMERA]
        {
            nCamera = new NCamera();
            nCamera.ResetCamera();
        }

        //add camera, etc. to render layer
        ReAddSystemEntities();

        //[SETUP KEYBOARD / MOUSE INPUTS]
        InitInputs();

        //[ASSIGN UPDATE FUNCTION]
        gRenderLayer.schedule( UpdateFunction );

        //[PARSE TO SCRIPT 1ST LINE]
        if ( gAppType == "app(desktop)" || gAppType == "app(mobile)" )
        {
            gServices.SysVars.gameplaymode = true;
            NParser.PushNewParserWithScriptTitle( initialScript );
            ParseScriptToLine( MainParser(), -1 );
        }
        else //dev, app(editor)
        {
            ParseScriptToLine( MainParser(), 1);
        }

//        /////////////////////////////
//        // 2. add a menu item with "X" image, which is clicked to quit the program
//        //    you may modify it.
//        // ask director the window size
//        var size = cc.director.getWinSize();
//
//        // add a "close" icon to exit the progress. it's an autorelease object
//        var closeItem = cc.MenuItemImage.create(
//            res.CloseNormal_png,
//            res.CloseSelected_png,
//            function () {
//                cc.log("Menu is clicked!");
//            }, this);
//        closeItem.attr({
//            x: size.width - 20,
//            y: 20,
//            anchorX: 0.5,
//            anchorY: 0.5
//        });
//
//        var menu = cc.Menu.create(closeItem);
//        menu.x = 0;
//        menu.y = 0;
//        this.addChild(menu, 1);
//
//        /////////////////////////////
//        // 3. add your codes below...
//        // add a label shows "Hello World"
//        // create and initialize a label
//        var helloLabel = cc.LabelTTF.create("Hello World", "Arial", 38);
//        // position the label on the center of the screen
//        helloLabel.x = size.width / 2;
//        helloLabel.y = 0;
//        // add the label as a child to this layer
//        this.addChild(helloLabel, 5);
//
//        // add "HelloWorld" splash screen"
//        this.sprite = cc.Sprite.create(res.HelloWorld_png);
//        this.sprite.attr({
//            x: size.width / 2,
//            y: size.height / 2,
//            scale: 0.5,
//            rotation: 180
//        });
//        this.addChild(this.sprite, 0);
//
//        var rotateToA = cc.RotateTo.create(2, 0);
//        var scaleToA = cc.ScaleTo.create(2, 1, 1);
//
//        this.sprite.runAction(cc.Sequence.create(rotateToA, scaleToA));
//        helloLabel.runAction(cc.Spawn.create(cc.MoveBy.create(2.5, cc.p(0, size.height - 40)),cc.TintTo.create(2.5,255,125,0)));
        return true;
    },
	onPlay : function(){
		cc.log("==onplay clicked");
	}
});

var LightScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var that = this;
        gScene = that;

        var layer = new RenderLayer();
        this.addChild(layer);
    }
});

