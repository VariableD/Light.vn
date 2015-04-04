
////////////////////////////////////////////////////////////////////////////////////////////////////

var Parser = function() {
    return {
        m_scriptName: "",       //Script Filename
        m_script: "",               //Script Text Content (lines)
        m_parserIdx: -1,         //Script Index within NParser
        m_readlineno: 0,
        m_scriptLength: 0,

        m_ParserState: ParserState.PARSE_FIN,
        m_curParsingScenarioLine: false,

        m_curLineTokens: [],

        SetScriptLines: function( ScriptText )
        {
            //there are these weird cases where the \n is set on to the end of the line
            //when it should be turned into a new line,
            //hence take this into account and create script lines
            var textLines = ScriptText.split("\r\n");
            var textLinesActual = [];
            var curParsingScenarioLine = false;

            for ( var i = 0; i < textLines.length; ++i )
            {
                //check whether currently parsing script line or scenario line
                if ( textLines[i].length > 0 )
                {
                    if ( ( textLines[i].length >= 1 && textLines[i][0] == '"' ) || ( textLines[i].length >= 2 && textLines[i][0] == '-"' ) )
                    {
                        curParsingScenarioLine = true;
                    }
                    else if ( textLines[i].length >= 1 && textLines[i][0] == '~' )
                    {
                        curParsingScenarioLine = false;
                    }
                }

                //newline char in this case will come at the end of the line
                //(newline chars within the line should not trigger this)
                var prevNewLineIdx = 0;
                var newLineIdx = 0;
                while( ( newLineIdx = textLines[i].indexOf("\n", prevNewLineIdx) ) != -1  )
                {
                    //trim: removes whitespaces from start and end of string
                    if ( curParsingScenarioLine )
                        textLinesActual.push( textLines[i].substring(prevNewLineIdx, newLineIdx) );
                    else
                        textLinesActual.push( textLines[i].substring(prevNewLineIdx, newLineIdx).trim() );
                    prevNewLineIdx = newLineIdx + 1;
                }
                if ( curParsingScenarioLine )
                    textLinesActual.push( textLines[i].substring(prevNewLineIdx) );
                else
                    textLinesActual.push( textLines[i].substring(prevNewLineIdx).trim() );
            }
            this.m_script = textLinesActual;
        },
        CalculateScriptLength: function()
        {
            //var textLines = this.m_script.split("\r\n");
            this.m_scriptLength =  this.m_script.length; //textLines.length;
        },
        /** @return bool */
        IsScriptEOF: function()
        {
            return this.m_scriptLength <= this.m_readlineno;
        },
        AutoContScript_ifNeeded: function()
        {
            if ( this.m_ParserState == ParserState.WAIT_CMDFIN )
            {
                //var curTime = new Date();
                //if ( curTime - this.m_script_startTime >= this.m_script_delayTime )
                //{
                //    cc.log("[AutoContScript_ifNeeded] SYNC_EXEC COMPLETE. duration:%ims", this.m_script_delayTime );
                //
                //    this.m_ParserState = ParserState.PARSE_CONT;
                //    this.m_script_startTime = curTime;
                //    this.m_script_delayTime = 0;
                //}
            }

            if ( this.m_ParserState == ParserState.PARSE_CONT )
            {
                NHelper.Log("[AutoContScript_ifNeeded] PARSE_CONT: AUTO CONTINUE SCRIPT. start_readlineno:%i",
                    CurParser().m_readlineno );
                ParseScriptToLine( this, -1 );
            }
        }
    }
};

var SetScript = function( scriptText, scriptTitle )
{
    //[ERROR CHECK]
    if ( scriptTitle == "" ) { console.log("[SetScript] scriptTitle == ''!" ) }
    //NParser.pop_to_MainParser();

    //[MAKE SURE THAT NPARSER HAS BEEN INITIALISED]
    if ( NParser.m_parserDeque.length == 0 )
    {
        NParser.initWithScript( scriptTitle, scriptText );
    }
    else
    {
        MainParser().m_scriptName = scriptTitle;
        MainParser().SetScriptLines( scriptText );
    }
    MainParser().m_ParserState = ParserState.PARSE_CONT;
    var a = 3;
};

////////////////////////////////////////////////////////////////////////////////////////////////////

var ReadScript_Prep = function( parser )
{
    if ( !gServices.SysVars.gameplaymode && parser.m_ParserState != ParserState.PARSE_FIN )
    {
        switch( parser.m_ParserState )
        {
            case ParserState.WAIT_CMDFIN:
            case ParserState.WAIT_BTNSEL:
            case ParserState.WAIT_MSGBOXSEL:
            case ParserState.WAIT_MOVIEFIN:
            case ParserState.PARSE_SCRIPT_FIN:
                parser.m_ParserState = ParserState.PARSE_CONT;
                break;
            default:
        }
    }
    else if ( parser.m_ParserState == ParserState.PARSE_FIN )
    {
        parser.m_ParserState = ParserState.PARSE_CONT;
    }
};

/** @return bool */
var ReadScriptBreak = function( parser, textLines, lineToParseUntil )
{
    //break condition: higher idx script is still parsing
    if ( parser.m_parserIdx != -1 && NParser.m_parserDeque.length > parser.m_parserIdx + 1 )
    {
        return true;
    }
    //break condition: end of file || !parse state (ex. wait_cmdfin, etc.)
    else if ( parser.m_readlineno > textLines.length || parser.m_ParserState != ParserState.PARSE_CONT )
    {
        if ( parser.m_ParserState == ParserState.PARSE_FIN )
            NHelper.Log("[Parser::ReadScriptBreak] PARSE_FIN ");
        else
            NHelper.Log("[Parser::ReadScriptBreak] m_infile.eof() || m_ParserState != PARSE_CONT. m_ParserState:%d",
                parser.m_ParserState );
        return true;
    }
    //break condition: "script_fin"
    else if ( parser.m_parserIdx != 0 && parser.m_curLineTokens.length > 0 && parser.m_curLineTokens[0] == "script_fin" )
    {
        parser.m_ParserState = ParserState.PARSE_SCRIPT_FIN;
        return true;
    }
    //break condition: (editing-mode) m_readlineno > lineno(dest.line)
    else if ( lineToParseUntil != -1 && parser.m_readlineno > lineToParseUntil )
    {
        return true;
    }
    return false;
};

//note: m_readlineno: 1~
//note: editor line: 1~
var ParseScriptToLine = function( parser, lineToParseUntil )
{
    //[RESET SCRIPT AND READ FROM FIRST LINE IF NEEDED (EDITOR)]
    if ( lineToParseUntil != -1 && parser.m_parserIdx == 0 && lineToParseUntil <= parser.m_readlineno )
    {
        //reset and read from beginning of script
        gRenderLayer.removeAllChildren();
        parser.m_readlineno = 0;
        parser.m_curParsingScenarioLine = false;
    }

    //[START READING FROM NEXT LINE AFTER PREVIOUS]
    ReadScript_Prep( parser );
    ++parser.m_readlineno;

    //[PARSE TEXT]
    if ( parser.m_script == "" )
    {
        NHelper.LogError( "ERROR: [ParseScriptToLine] Parser.m_script == ''" );
        return;
    }
    //var textLines = parser.m_script.split("\r\n");
    {
        for ( ; !ReadScriptBreak(parser, parser.m_script, lineToParseUntil); ++parser.m_readlineno )
        {
            //note: text is an array from 0~ (while m_readlineno: 1~)
            parser.m_curLineTokens = parser.m_script[parser.m_readlineno-1].split( /[ 　]+/); //split upon space(' ') or wide space ('　')
            if ( parser.m_curLineTokens[ parser.m_curLineTokens.length - 1 ] == "" )
                parser.m_curLineTokens.pop();

            //parser.m_curLineTokens = textLines[parser.m_readlineno-1].match(/\S+/g);

            //execute parsed tokens
            Parser_Parse( parser, gRenderLayer, parser.m_curLineTokens, parser.m_script[parser.m_readlineno-1] );
        }
    }

    //[ADJUST READLINENO TO REFLECT LINE READ UP TO]
    --parser.m_readlineno;
    NHelper.Log("[ParseScriptToLine] read up until: %d (%s)", parser.m_readlineno, parser.m_scriptName);

    //[SCRIPT PARSING COMPLETE]
    if ( parser.m_ParserState == ParserState.PARSE_CONT )
        parser.m_ParserState = ParserState.PARSE_FIN;
};