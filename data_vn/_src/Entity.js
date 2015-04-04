
/////////////////////////
//[NSPRITE]
/////////////////////////

var NSprite = cc.Sprite.extend({
    ctor: function (fileName, rect, rotated) {
        this._super(fileName, rect, rotated);
    },
    //m_this: this,
    m_nType: NType.character,
    m_inCamera: true,
    m_textureName: "",
    m_isTextureSet: false,
    update : function(dt) {
        var size = this.getContentSize();
        if ( !this.m_isTextureSet && size.width != 0 && size.height != 0 && this.getNumberOfRunningActions() == 0 )
        {
            //if background, first need to scale to screen size
            if ( this.m_nType == NType.background )
            {
                //get the screen size of your game canvas
                var winsize = cc.director.getWinSize();
                this.setScale( winsize.width / size.width, winsize.height / size.height );
            }
            //set focus to center of sprite not top/left
            //(should only occur once upon sprite texture load)
            {
                size = this.getContentSize();
                var tween = cc.sequence(
                    cc.moveBy( 1/1000, size.width / 2 * this.getScaleX(), -size.height / 2 * this.getScaleY()  ),
                    cc.callFunc(function(){
                        this.m_isTextureSet = true;
                        this.setAnchorPoint(0.5,0.5);
                        if ( this.getOpacity() == 0 )
                            this.setOpacity(255);
                    }, this));
                this.runAction(tween);
            }
        }
        //set camera
        if ( this.m_isTextureSet && this.m_inCamera )
        {
            this.setAdditionalTransform( nCamera.getNodeToParentTransform() );
        }
    }
});

/////////////////////////
//[NTEXT]
/////////////////////////

//cocos implementation
var FlowLabel = cc.LabelTTF.extend({
    _flowText: null,
    ctor: function (textSpeed, text, fontName, fontSize, dimensions, hAlignment, vAlignment) {
        this._textSpeed = textSpeed;
        this._super('', fontName, fontSize, dimensions, hAlignment, vAlignment);
        this.setString(text);
    },
    setString: function(text){
        this._flowText = text;

        //duration, key, from, to
        this.runAction(cc.actionTween(this._flowText.length * this._textSpeed * 0.001, "flowOffset", 0, this._flowText.length));
    },
    updateTweenAction: function(value, key){
        if(key == 'flowOffset'){
            cc.LabelTTF.prototype.setString.call(this, this._flowText.substring(0, value));
        }
    }
});

//my implementation
var NTextbox = cc.LabelTTF.extend({
    ctor: function(text, font, size){
        this._super(text, font, size);
        //possibly do other stuff here if necesary
    },
    m_nType: NType.textbox,
    m_WholeText: "",
    m_flowing: false,
    m_passedTime: 0,
    m_textSpeed: 13, //ms (0.013s)

    getText: function() {
        return this.m_WholeText;
    },
    setText: function( text ) {
        this.m_WholeText = text;

        if ( gServices.SysVars.gameplaymode )
            this.triggerFlow();
        else
            this.setString(this.m_WholeText);
    },
    appendText: function( text ) {

        //this.m_passedTime = this.m_WholeText.length * this.m_textSpeed;
        this.m_WholeText += text;

        if ( gServices.SysVars.gameplaymode)
        {
            if ( !this.m_flowing )
            {
                //note: The previous m_passedTime still exists
                //(which infers the number of printed letters currently on screen)
                //hence, I only need to just trigger to continue the flow
                this.m_flowing = true;
            }
        }
        else
            this.setString(this.m_WholeText);
    },
    triggerFlow: function() {
        this.m_passedTime = 0;
        this.m_flowing = true;
    },
    update : function(dt) {
        var that = this;

        if ( that.m_flowing )
        {
            //update total time passed
            that.m_passedTime += dt*1000;

            //calculate substring to display
            //note: total string requires m_textSpeed * number_of_letters to completely show
            {
                var totalStrLength = that.getText().length;
                var totalTimeRequired = totalStrLength * that.m_textSpeed;
                var curNumberLettersToDisplay = Math.floor( totalStrLength * (that.m_passedTime / totalTimeRequired) );

                if ( curNumberLettersToDisplay > totalStrLength )
                {
                    that.setString( that.getText() );
                    that.m_flowing = false;
                    return;
                }

                var displaySubstr = that.getText().substr(0, curNumberLettersToDisplay);
                that.setString( displaySubstr );
            }

        }
    }
});

/////////////////////////
//[NTEXT]
/////////////////////////

var NBacklog =
{
    m_nTextbox: null,
    m_backLogLines: []
};

/////////////////////////
//[NBUTTON]
/////////////////////////

var btnAliveRegion = "";
var btnBasicRes =
{
    normalImg: "",
    touchImg: "",
    clickImg: ""
};
var BtnTriggerType =
{
    TRIGGER_NONE: 0,
    TRIGGER_SAVESLOT: 1,
    TRIGGER_LOADSLOT: 2,
    TRIGGER_SAVEDELETE: 3,
    TRIGGER_WINDOWMODE: 4,
    TRIGGER_MESSAGEBOX_VAR: 5,
    TRIGGER_TEXTREAD_METHOD: 6,
    TRIGGER_TEXTSKIP_MODE: 7,
    TRIGGER_PARSE_EXEC: 8
};
var NButton = cc.Sprite.extend({
    m_nType: NType.undefined,
    m_CreatedScriptName: "",
    m_imageVec: [],

    m_triggerType: BtnTriggerType.TRIGGER_NONE,
    m_completeExecLine: "",

    m_btnWidth: 0,
    m_btnHeight: 0,
    m_lastClickedTime: 0,

    //[TRIGGER_SAVESLOT / TRIGGER_LOADSLOT]
    m_savedata_exists: false,
    m_saveload_slot_number: -1,

    //
    setSaveLoadSlotNumber: function( number )
    {
        this.m_saveload_slot_number = number;
    },

    //[CLICK FUNCTIONS]
    executeLClick: function() //left click function (bool return: did trigger function execute/exist)
    {
        if ( this.m_triggerType == BtnTriggerType.TRIGGER_SAVESLOT ) {
            this.execSave();
        }
        else if ( this.m_triggerType == BtnTriggerType.TRIGGER_LOADSLOT ) {
            //don't want AutoContScript_ifNeeded triggered if messagebox confirm yes (on load trigger)
            //if AutoContScript_ifNeeded is triggered, script continues (sys_msg.txt)
            //and messagebox confirm message disappears (looks weird)
            this.execLoad();
        }
        else if ( this.m_triggerType == BtnTriggerType.TRIGGER_SAVEDELETE ) {
            this.execSaveDelete();
        }
        else if ( this.m_triggerType == BtnTriggerType.TRIGGER_PARSE_EXEC || this.m_triggerType == BtnTriggerType.TRIGGER_TEXTREAD_METHOD ) {
            TriggerParseExec( this.m_completeExecLine );
        }
        else
            return false;

        return true;
    },
    executeRClick: function()
    {},
    execSave: function()
    {
        //[SAVE CURRENT STATE]
        alert( "まだ実装されておりません" );
        return;

        //[CAPTURE SCREEN : should complete in Update()]
        {
            var ss = new cc.RenderTexture( 400, 400 );
            {
                ss.begin();
                gRenderLayer.visit();
                ss.end();

                //ss.begin();
                //var entities = gRenderLayer.getChildren();
                //for ( var i = 0; i < entities.length; ++i )
                //{
                //    entities[i].visit();
                //}
                //ss.end();
            }
            ss.setPosition( 300, 300 );
            gScene.addChild( ss, 200, "" );
        }
    },
    execLoad: function()
    {

    },
    execSaveDelete: function()
    {

    }
});

/////////////////////////
//[NCAMERA]
/////////////////////////
var NCamera = cc.Sprite.extend({
    m_nType: NType.sysCamera,
    ResetCamera: function()
    {
        var size = cc.director.getWinSizeInPixels();
        this.setContentSize( size );
        this.setAnchorPoint( 0.5, 0.5 );
        //this.setPosition( tlPoint( 0, 0 ) );
        this.setPosition( size.width / 2, size.height / 2 );
    },
    update : function(dt) {
        var a = this.getNumberOfRunningActions();
        if (  a != 0  )
        {
            var c = 3;
        }
        var b = 3;
    }
});
var nCamera; //constructed in app.js