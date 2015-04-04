
var gServices = {
    SysVars: {
        //[KEYTRIGGER REFS]
        keyTriggerRefs: {},
        mouseTriggerRefs: {},

        //[GLOBAL SETTINGS]
        gameover: false,
        gameplaymode: false,

        gameStartReadlineno: 0,
        gameStartParserState: ParserState.PARSE_FIN,
        gameStartParserScriptTItle: "",

        //[TRACK VARS]
        curUseTextboxName: "",

        //[USER-MANIPULATION VARS]
        mUserVars: {}
    }
};

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////[ EDITOR RELATED ]//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

var editorModeStr = "ノベル状態: 編集（F5を押すとテストプレイが開始します）";

var DisplayFPS = function( display )
{
    cc.director.setDisplayStats(display);
};

var ToggleTestPlay = function()
{
    gServices.SysVars.gameplaymode = !gServices.SysVars.gameplaymode;
    NHelper.Log("[ToggleTestPlay] test play: %b", gServices.SysVars.gameplaymode);

    //[UPDATE EDITOR MESSAGE]
    {
        var scope = angular.element(document.querySelector('#editorCol')).scope();
        scope.$apply(function(){
            if ( gServices.SysVars.gameplaymode )
                scope.strTestPlayInfo = "ノベル状態: " + "テストプレイ（現在行："+MainParser().m_readlineno+"。スクリプト編集は適用されません）";
            else
                scope.strTestPlayInfo = editorModeStr;
        });
    }

    //[UPDATE GAME STATE]
    if ( gServices.SysVars.gameplaymode ) //edit->play
    {
        gServices.SysVars.gameStartReadlineno = MainParser().m_readlineno;
        gServices.SysVars.gameStartParserState = MainParser().m_ParserState;
        gServices.SysVars.gameStartParserScriptTItle = MainParser().m_scriptName;
        ParseScriptToLine( MainParser(), -1);
    }
    else //play->edit
    {
        NParser.initWithScript(gServices.SysVars.gameStartParserScriptTItle, "");
        ParseScriptToLine( MainParser(), gServices.SysVars.gameStartReadlineno );
        MainParser().m_ParserState = gServices.SysVars.gameStartParserState;
        gServices.SysVars.gameStartReadlineno = 0;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////[ NPARSER ]//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

var NParser = {
    m_parserDeque: [],
    initWithScript: function( ScriptTitle, ScriptText )
    {
        this.m_parserDeque.length = 0; //clear all previous scripts
        if ( ScriptText === "" )
        {
            ScriptText = cc.loader._loadTxtSync( gAppDir + "Scripts/" + ScriptTitle );
            if ( ScriptText === "" )
            {
                NHelper.AlertMissingFileError( "Scripts/" + ScriptTitle );
                return;
            }
        }

        var MainParser = new Parser();
        MainParser.m_scriptName = ScriptTitle;
        MainParser.SetScriptLines(ScriptText ); //ScriptText;
        MainParser.m_parserIdx = 0;
        MainParser.CalculateScriptLength();
        this.m_parserDeque.push( MainParser );
    },
    /** @return bool */
    PushNewParserWithScriptTitle: function( ScriptTitle )
    {
        var scriptText = cc.loader._loadTxtSync( gAppDir + "Scripts/" + ScriptTitle );
        if ( ! scriptText )
        {
            NHelper.AlertMissingFileError( "Scripts/" + ScriptTitle );
            return false;
        }
        var newParser = new Parser();
        newParser.m_scriptName = ScriptTitle;
        newParser.SetScriptLines( scriptText );
        this.m_parserDeque.push( newParser );
        newParser.m_parserIdx = this.m_parserDeque.length - 1;
        newParser.CalculateScriptLength();
        return true;
    },
    PopBackParser: function()
    {
        this.m_parserDeque.pop();
    },
    pop_to_MainParser: function()
    {
        while( this.m_parserDeque.length > 1 )
        {
            this.m_parserDeque.pop();
        }
    }
};

var CurParser = function()
{
    if ( NParser.m_parserDeque.length < 1 ) return;
    return NParser.m_parserDeque[NParser.m_parserDeque.length - 1];
};

var MainParser = function()
{
    return NParser.m_parserDeque[0];
};

var TriggerParseExec = function( execCompleteLine )
{
    var tokens =execCompleteLine.split( " " );
    //CurParser().m_curLineTokens = tokens;

    Parser_Parse( CurParser(), gRenderLayer, tokens, execCompleteLine, true );
};

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////[ SERVICES ]//////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

var ReAddSystemEntities = function()
{
    nCamera.ResetCamera();
    nCamera.scheduleUpdate();
    gRenderLayer.addChild(nCamera, -1, "sysCamera"); //child, zOrder, tag
};

var AutoContScript_ifNeeded = function()
{
    if ( gServices.SysVars.gameplaymode )
    {
        CurParser().AutoContScript_ifNeeded();
    }

    //continue if external script reached script_fin or external script reached end of file.
    if ( NParser.m_parserDeque.length != 1 && ( CurParser().m_ParserState == ParserState.PARSE_SCRIPT_FIN || CurParser().IsScriptEOF() ) )
    {
        NHelper.Log("AutoContScript_ifNeeded(start): CurParser(not main) finished normally: pop ");
        NParser.PopBackParser();
        NHelper.Log("AutoContScript_ifNeeded(fin): cur pushed parser count:%i", NParser.m_parserDeque.length);
    }
};

var musicLines = [];

var UpdateMedia = function()
{
    if ( gServices.SysVars.gameplaymode ) return;

    //editor: only play music that should be playing in current script line
    for ( var i = 0; i < musicLines.length; ++i )
    {
        if ( MainParser().m_readlineno < musicLines[i].line )
        {
            musicLines.length = i; //reset internal BGM tracker
            cc.audioEngine.stopMusic();
            if ( i > 0 )
            {
                cc.audioEngine.playMusic( gAppDir+ "BGM/" + musicLines[i - 1].filename, musicLines[i - 1].repeat );
            }
            return;
        }
    }
};