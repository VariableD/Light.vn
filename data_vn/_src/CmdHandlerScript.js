
//ex. wait [option] (option: ex. buttonSelect, 1500(ms))
/** @return number */
var ExecuteWait = function( parseTokens )
{
    if ( !gServices.SysVars.gameplaymode ) return -1;

    var validWait = false;
    if ( parseTokens.length == 2 && parseTokens[1] == "ボタン選択" )
    {
        validWait = true;
        CurParser().m_ParserState = ParserState.WAIT_BTNSEL;
    }
    //ex. wait 1300
    else if ( parseTokens.length == 2 && NHelper.CheckStringsAreNumbers( [ parseTokens[1] ] ) )
    {
        var duration =  parseInt(parseTokens[1]);
        var tween = cc.sequence(
            cc.delayTime( duration / 1000 ),
            cc.callFunc(function(){ //continue script upon sync cmd finish
                if ( CurParser().m_ParserState == ParserState.WAIT_CMDFIN )
                    CurParser().m_ParserState = ParserState.PARSE_CONT;
            }, gRenderLayer));
        gRenderLayer.runAction(tween);
        return duration;
    }
    else //ex. wait
    {
        CurParser().m_ParserState = ParserState.PARSE_FIN;
    }

    if ( validWait )
        NHelper.Log("[ExecuteWait] WAIT for: %s", parseTokens[1]);

    return -1;
};

//ex. script textbox.txt (bookmark)
//ex. script textbox.txt bookmark:fadein var1:_char_name, var2:_char_im
var ExecuteScript = function( parseTokens )
{
    //[SETUP NEW PARSER FOR SCRIPT WANTING TO LOAD]
    {
        if ( !NParser.PushNewParserWithScriptTitle( parseTokens[1] ) )
        {
            NHelper.LogCurrentStack();
            NHelper.Log("[ExecuteScript] LOADING NEW SCRIPT:%s FAILED!", parseTokens[1]);
            return;
        }
        NHelper.Log("[ExecuteScript] LOADING NEW SCRIPT:%s ", parseTokens[1]);
    }

    //[JUMP TO BOOKMARK WITHIN LOADED SCRIPT IF NEEDED]
    if ( parseTokens.length >= 3 && parseTokens[2] != "" )
    {
        var bookmarkLine = GotoBookmark( CurParser(), parseTokens[2] );
        if ( bookmarkLine == -1 )
        {
            NHelper.LogError("ERROR: (ExecuteScript) TRIED TO JUMP TO INVALID BOOKMARK: %s", parseTokens[2]);
            NParser.PopBackParser();
            return;
        }
        else
        {

        }
    }

    //[READ LOADED SCRIPT: POP NEWPARSER AFTER IF PARSING NORMALLY FINISHED]
    {
        CurParser().m_ParserState = ParserState.PARSE_CONT;
        ParseScriptToLine( CurParser(), -1 );
        var parserState = CurParser().m_ParserState;

        if ( parserState == ParserState.PARSE_SCRIPT_FIN || CurParser().IsScriptEOF() )
        {
            NParser.PopBackParser();
            NHelper.Log("[ExecuteScript] UNLOADING NEW SCRIPT:%s ", parseTokens[1]);
        }
        else
        {
            NHelper.Log("[ExecuteScript] LOADED SCRIPT STILL LIVING:%s ", parseTokens[1]);
        }
    }
};

/** @return number */
var ExecuteJump = function( parseTokens )
{
    if ( !gServices.SysVars.gameplaymode ) return 0;

    //ex. jump script1.txt bookmark1 / jump script1.txt
    if ( parseTokens[1].indexOf(".txt") >= 0  )
    {
        var filename = parseTokens[1];
        var targetParser = CurParser();

        if ( parseTokens[1][0] == '*' )
        {
            //note: jumps script has '*' prefix: should reset parser count back to 1
            //(since I don't want to jump to a new script inside an external script parser)
            //(ex. return to title)
            filename = filename.substr(1);
            NParser.pop_to_MainParser();
            targetParser = MainParser();
        }

        if ( parseTokens.length == 3 )
            GoToScript( targetParser, parseTokens[1], parseTokens[2] );
        else
            GoToScript( targetParser, parseTokens[1], "" );

        targetParser.m_ParserState = ParserState.PARSE_CONT;
    }
    //ex. jump bookmark1
    else
    {
        var bookmarkLine = GotoBookmark( CurParser(), parseTokens[1] );
        if ( bookmarkLine == -1 )
        {
            NHelper.LogError("[ExecuteJump] searched bookmark: '%s' does not exist. restored script.", parseTokens[1]);
        }
        else
        {
            NHelper.Log("[ExecuteJump] searched bookmark: '%s' found at line: %i", parseTokens[1]. bookmarkLine);
            CurParser().m_ParserState = ParserState.PARSE_CONT;

            ParseScriptToLine( CurParser(), -1 );

            return bookmarkLine;
        }
    }

    //note: need to return wanted bookmark line
    //reason: the script line after wanted bookmark line has to be read next
    return 0; //no change in ine
};

//ex. keyTrigger r.click (execute_command)
//キートリガー r.click スクリプト system\sys_menu.txt menu_show
var ExecuteKeyTrigger = function( parseTokens )
{
    var triggerRef = new KeyTriggerRef();
    triggerRef.triggerLine = MainParser().m_readlineno;

    //save trigger function
    if ( parseTokens.length > 2 )
    {
        var trigger_function = "";
        for (var i = 2; i < parseTokens.length; ++i) {
            trigger_function += " " + parseTokens[i];
        }
        triggerRef.trigger_function = trigger_function.substr(1); //remove first space
    }
    else //ex. keyTrigger r.click => do nothing.
    {
        triggerRef.trigger_function = "";
    }

    //save trigger
    {
        var triggerKey = parseTokens[1];
        if ( triggerKey == "r.click" || triggerKey == "wheel.up" )
        {
            gServices.SysVars.mouseTriggerRefs[ triggerKey ] = triggerRef;
        }
    }

    NHelper.Log("[ExecuteKeyTrigger] TRIGGER SAVED. key:%s trigger_func:%s",
        parseTokens[1], triggerRef.trigger_function);
};