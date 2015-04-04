
var summoningBacklog = false;

var InitInputs = function()
{
    gRenderLayer.m_scrolledDt = 0;
    gRenderLayer.schedule(function(dt){
        gRenderLayer.m_scrolledDt+= dt;
    });
    gRenderLayer.m_keyPressed = false;


    //[ KEYBOARD PRESS ]
    //: dev, app(desktop), app(editor)
    cc.eventManager.addListener({
        event: cc.EventListener.KEYBOARD,
        onKeyPressed: function(keyCode, event) {

            if ( !gRenderLayer.m_keyPressed )
            {
                NHelper.Log("\n[Services_Input] keyboard press. key:'%s'", keyCode.toString());
                gRenderLayer.m_keyPressed = true;

                //if enter or space
                if ( keyCode.toString() == 13 || keyCode.toString() == 32 )
                {
                    if ( gServices.SysVars.gameplaymode )
                        ParseScriptToLine( MainParser(), -1 );
                }
                if ( keyCode.toString() == 116 && gAppType == "dev" || gAppType == "editor" )
                {
                    ToggleTestPlay();
                }
            }

            return true;
        },
        onKeyReleased: function(keyCode, event) {
            gRenderLayer.m_keyPressed = false;
        }
    }, gRenderLayer);

    //[ MOUSE PRESS ]
    //: dev, app(desktop), app(editor)
    if (gAppType != "app(mobile)")
    {
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseDown:  function(event) {
                NHelper.Log("\n[Services_Input] mouse press. key:'%d'", event.getButton());
                //ParseScript(that);

                //left click
                if ( event.getButton() == 0 )
                {
                    if ( gServices.SysVars.gameplaymode )
                    {
                        var a = event.getLocation();
                        if ( JSON.stringify(event.getLocation()) != JSON.stringify(curClickedLocation) )
                            ParseScriptToLine( MainParser(), -1 );
                        else
                            NHelper.Log("[Services_Input] preventing mouse click double processing");
                    }
                }
                //right click
                else if ( event.getButton() == 2 )
                {
                    //[EXECUTE TRIGGER IF EXISTING]
                    if ( gServices.SysVars.gameplaymode )
                    {
                        var keyTriggerRef = gServices.SysVars.mouseTriggerRefs["r.click"];
                        if ( keyTriggerRef && keyTriggerRef.trigger_function != "" )
                        {
                            if ( keyTriggerRef.triggerLine <= MainParser().m_readlineno )
                            {
                                NHelper.Log("[Services_Input] trigger:'%s' exists. trigger-line:%d execute.", "r.click", keyTriggerRef.triggerLine);
                                TriggerParseExec( keyTriggerRef.trigger_function );
                            }
                        }
                    }
                }
                return true;

            },
            onMouseScroll: function(event) {
                if ( gRenderLayer.m_scrolledDt > 0.2 )
                {
                    NHelper.Log("\n[Services_Input] mouse scroll. " + event.getScrollY() + " dt:" + gRenderLayer.m_scrolledDt);

                    if ( event.getScrollY() <= -120 )
                    {
                        NHelper.Log("[Services_Input] mouse scroll down");
                        if ( gServices.SysVars.gameplaymode )
                        {
                            //backlog showing
                            if ( NBacklog.m_nTextbox && NBacklog.m_nTextbox.getOpacity() != 0 )
                            {
                                return;
                                //scroll backlog down
                                {
                                    var scrollView = gRenderLayer.getChildByName( "NBacklog" );
                                    var pos = scrollView.getInnerContainer().getPosition();
                                    var destPoint = cc.p(pos.x, pos.y - 50);

                                    var innerSize = scrollView.getInnerContainerSize();
                                    var yPercent = Math.abs( destPoint.y ) / innerSize.height * 100;
                                    //scrollView.jumpToPercentVertical( Math.abs( destPoint.y ) / innerSize.height * 100 ); //jump to destination
                                    //scrollView.jumpToPercentVertical(100);

                                    scrollView.scrollToPercentVertical(100, 0.3);
                                }
                                //if ( CurParser().m_ParserState != ParserState.PARSE_FIN )
                                //    CurParser().m_ParserState = ParserState.PARSE_CONT;
                            }
                            else
                            {
                                ParseScriptToLine( MainParser(), -1 );
                            }
                        }
                    }
                    else if ( event.getScrollY() >= -120 )
                    {
                        NHelper.Log("[Services_Input] mouse scroll up");
                        if ( gServices.SysVars.gameplaymode && !summoningBacklog )
                        {
                            if ( NBacklog.m_nTextbox && NBacklog.m_nTextbox.getOpacity() != 0 )
                            {
                                return;
                                //scroll backlog up
                                {
                                    var scrollView = gRenderLayer.getChildByName( "NBacklog" );
                                    var pos = scrollView.getInnerContainer().getPosition();
                                    var destPosY = pos.y + 50;

                                    var innerSize = scrollView.getInnerContainerSize();
                                    scrollView.jumpToPercentVertical(Math.abs(destPosY) / innerSize.height * 100); //jumpt to destination
                                }
                            }
                            else
                            {
                                summoningBacklog = true;
                                var keyTriggerRef = gServices.SysVars.mouseTriggerRefs["wheel.up"];
                                if ( keyTriggerRef && keyTriggerRef.trigger_function != "" )
                                {
                                    if ( keyTriggerRef.triggerLine <= MainParser().m_readlineno )
                                    {
                                        NHelper.Log("[Services_Input] trigger:'%s' exists. trigger-line:%d execute.", "r.click", keyTriggerRef.triggerLine);
                                        TriggerParseExec( keyTriggerRef.trigger_function );
                                    }
                                }
                            }
                        }
                    }
                }
                else
                {
                    //user still scrolling
                }
                gRenderLayer.m_scrolledDt = 0;
                return true;
            }
        }, gRenderLayer);
    }

    //[ TOUCH ]
    //: app(mobile)
    if (gAppType == "app(mobile)")
    {
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            //swallowTouches: true,
            onTouchBegan: function (touch, event) {
                //do something
                NHelper.Log("\ntouch began");
                ParseScriptToLine( MainParser(), -1 );
                return true;
            }
        }, gRenderLayer);
    }
};