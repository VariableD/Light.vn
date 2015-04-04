var curClickedLocation;

//ボタン活性領域
var ExecuteBtnAliveRegion = function( parseTokens )
{
    btnAliveRegion = CurParser().m_scriptName;
};

//[ボタン基本資料 btn_sel.png btn_sel@.png btn_sel.png]
var ExecuteButtonBasicRes = function( parseTokens )
{
    btnBasicRes.normalImg = parseTokens[1];
    btnBasicRes.touchImg = parseTokens[2];
    btnBasicRes.clickImg = parseTokens[3];
};

//ex. button button1 300(x) 400(y) layer_no (nocamera) [btn cmd / EXEC LINE ...]
//ex. button button1 (untouched-img.png) 300(x) 400(y) layer_no (nocamera) [btn cmd / EXEC LINE ...]
//ex. button button1 (untouched-img.png) (touched-img.png) 300(x) 400(y) layer_no (nocamera) [btn cmd / EXEC LINE ...]
//ex. button button1 (untouched-img.png) (touched-img.png) (clicked-img.png) 300(x) 400(y) layer_no (nocamera) [btn cmd / EXEC LINE ...]
var ExecuteButton = function( parseTokens )
{
    var xPosIdx = 0;
    for ( var i = 1; i < parseTokens.length; ++i )
    {
        if ( !isNaN( parseTokens[i] ) )
        {
            xPosIdx = i;
            break;
        }
    }
    var isSysBtn = parseTokens[0] == NType.sysButton;

    //init / get button
    var nButton = gRenderLayer.getChildByName( parseTokens[1] );
    var preExists = true;
    if ( nButton == null )
    {
        nButton = new NButton();
        preExists = false;
    }
    //set type
    nButton.m_nType = parseTokens[0] == "ボタン" ? NType.button : NType.sysButton;

    //update sprite texture, x/y coordinates, opacity
    {
        //disallow no specification of images
        if ( parseTokens[2] == "none" || btnBasicRes.normalImg == "none" )
        {
            NHelper.LogCurrentStack();
            return;
        }
        nButton.setTexture(gAppDir + "Images/" + (xPosIdx == 2 ? btnBasicRes.normalImg : parseTokens[2]) );

        //set image vector
        if ( xPosIdx == 2 )
             nButton.m_imageVec = [ btnBasicRes.normalImg, btnBasicRes.touchImg, btnBasicRes.clickImg ];
        else
            nButton.m_imageVec = [ /*normal*/parseTokens[2], /*touch*/parseTokens[3], /*click*/parseTokens[4] ];
    }

    nButton.m_CreatedScriptName = CurParser().m_scriptName;
    nButton.setPosition( tlPoint(parseTokens[xPosIdx], parseTokens[xPosIdx+1]) );
    nButton.setAnchorPoint(0,1);
    nButton.setOpacity(255);

    //[CHANGE IMAGE FOR NORMAL, TOUCH, CLICK]
    cc.eventManager.removeListeners(nButton);
    {
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseMove:  function(event)
            {
                if ( btnAliveRegion == "" || btnAliveRegion == nButton.m_CreatedScriptName )
                {
                    //TOUCH: touch image (inside touch area)
                    if (isCurTargetTouched(event))
                    {
                        //console.log("touched");
                        nButton.setTexture( gAppDir + "Images/" + nButton.m_imageVec[1] );
                        return true;
                    }
                    //NORMAL: normal image
                    else
                    {
                        nButton.setTexture( gAppDir + "Images/" + nButton.m_imageVec[0] );
                        return true;
                    }
                }
                return false;
            },
            onMouseDown:  function(event)
            {
                if ( btnAliveRegion == "" || btnAliveRegion == nButton.m_CreatedScriptName )
                {
                    //left click
                    if ( event.getButton() == 0 )
                    {
                        if ( gServices.SysVars.gameplaymode && isCurTargetTouched(event) )
                        {
                            //don't allow multiple clicks of button within 500ms
                            if ( Date.now() - nButton.m_lastClickedTime >= 500 )
                            {
                                NHelper.Log("\n button clicked");
                                curClickedLocation = event.getLocation();

                                if ( !isSysBtn && CurParser().m_ParserState == ParserState.WAIT_BTNSEL )
                                {
                                    CurParser().m_ParserState = ParserState.PARSE_CONT;
                                }

                                if ( !nButton.executeLClick() )
                                {
                                }

                                nButton.m_lastClickedTime = Date.now();
                            }
                        }
                    }
                }
            }
        }, nButton);
    }

    //[SET INCAMERA PROPERTY]
    var execCmdStartIdx = xPosIdx + 3;
    if ( parseTokens[xPosIdx+3] == "カメラ無視" )
    {
        ++execCmdStartIdx;
    }

    //[HANDLE BUTTON TRIGGER TYPES]
    {
        if ( !SetButtonTriggerTypes( nButton, parseTokens, execCmdStartIdx ) )
        {
            NHelper.LogError("ERROR: (ExecuteButton) button trigger type does not exist");
            return;
        }
    }

    //addChild:node, localZOrder, name
    if ( !preExists )
        gRenderLayer.addChild(nButton, parseInt(parseTokens[xPosIdx+2]), parseTokens[1]);

    //todo) I should be updating the zOrder of the entity if it was previously created
};

var SetButtonTriggerTypes = function( nButton, parseTokens, execCmdStartIdx )
{
    var btnType = parseTokens.length == execCmdStartIdx ? "" : parseTokens[execCmdStartIdx];

    if ( parseTokens.length == execCmdStartIdx )
    {
        nButton.m_triggerType = BtnTriggerType.TRIGGER_NONE;
    }
    //ex. saveslot 1 / loadslot 1
    else if ( btnType == "saveslot" || btnType == "loadslot" || btnType == "savedelete" )
    {
        if ( parseTokens.length < execCmdStartIdx + 2 )
        {
            NHelper.LogCurrentStack();
            return false;
        }

        if ( btnType == "saveslot" )
            nButton.m_triggerType = BtnTriggerType.TRIGGER_SAVESLOT;
        else if ( btnType == "loadslot" )
            nButton.m_triggerType = BtnTriggerType.TRIGGER_LOADSLOT;
        else if ( btnType == "savedelete" )
            nButton.m_triggerType = BtnTriggerType.TRIGGER_SAVEDELETE;

        nButton.setSaveLoadSlotNumber( parseTokens[execCmdStartIdx + 1] )
    }
    //ex. screen 0
    else if ( btnType == "screen" )
    {

    }
    //ex. textSkip 0
    else if ( btnType == "textSkip" )
    {

    }
    //ex. msgvar yes/no
    else if ( btnType == "msgvar" )
    {

    }
    //ex. TRIGGER_PARSE_EXEC
    //not a button specific cmd token: need to parse with Parser
    else
    {
        nButton.m_triggerType = BtnTriggerType.TRIGGER_PARSE_EXEC;

        //get complete exec line
        //ex. button jump_txt 262 80 90 jump tut_text.txt tut_start
        //m_completeExecLine: jump tut_text.txt tut_start
        {
            var completeExecLine = "";
            for (var i = execCmdStartIdx; i < parseTokens.length; ++i) {
                completeExecLine += " " + parseTokens[i];
            }
            nButton.m_completeExecLine = completeExecLine.substr(1); //no need for space at start
        }

        //note: take special care of textProgress 0/1/2
    }
    return true;
};

var isCurTargetTouched = function(event)
{
    // event.getCurrentTarget() returns the *listener's* sceneGraphPriority node.
    var target = event.getCurrentTarget();

    //Get the position of the current point relative to the button
    var locationInNode = target.convertToNodeSpace(event.getLocation());
    var s = target.getContentSize();
    var rect = cc.rect(0, 0, s.width, s.height);

    return cc.rectContainsPoint(rect, locationInNode);
};

//ボタン文字 jump_var r-mplus-1c-m.ttf 24 "変数操作 例
var ExecuteButtonText = function( parseTokens )
{
    //[GET TARGET BUTTON]
    var nButton = gRenderLayer.getChildByName( parseTokens[1] );
    if ( !nButton )
    {
        NHelper.LogError("ERROR: (ExecuteButtonText) button:'%s' does not exist", parseTokens[1]);
        return;
    }

    //check if previous text exists
    var text = gRenderLayer.getChildByName( parseTokens[1]+"-text" );
    var preExists = true;
    if ( text == null )
    {
        text = new cc.LabelTTF();
        preExists = false;
    }

    //[SET TEXT]
    {
        //text = cc.LabelTTF.create("", gAppDir + "Fonts/"+parseTokens[2], parseInt(parseTokens[3]));
        text.setFontName("Fonts/"+parseTokens[2]);
        text.setFontSize(parseTokens[3]);
        text.setAnchorPoint(0,1);
        text.enableStroke( cc.color(0, 0, 0, 30), 2.0);
        text._setFontWeight("bold");
        text.setAnchorPoint(0,1);
    }
    //create string
    {
        var str = "";
        for ( var i = 4; i < parseTokens.length; ++i )
        {
            str += parseTokens[i];
        }
        str = ( str[0] == " " ? str.substr(2) : str.substr(1) ); //remove " from start of string
        text.setString( str );
    }
    //[TEXT POSITIONING (CENTERING)]
    {
        text.schedule(function(dt)
        {
            var btnSize = nButton.getContentSize();
            if ( btnSize.width != 0 && btnSize.height != 0 )
            {
                var textSize = text.getContentSize();
                var btnPos = nButton.getPosition();
                text.setPosition(
                    ( btnPos.x + (btnSize.width - textSize.width) / 2 ),
                    ( btnPos.y - (btnSize.height - textSize.height) / 2 ) );
                text.setOpacity( nButton.getOpacity() );
            }
            else
            {
                text.setOpacity( 0 );
            }
        });
    }

    //gRenderLayer.addChild(text, 500, parseTokens[1]+"-text");
    gRenderLayer.draw();

    if ( !preExists )
       gRenderLayer.addChild(text, nButton.getLocalZOrder() + 1, parseTokens[1]+"-text");
};