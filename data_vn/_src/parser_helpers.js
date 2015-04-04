
/** @return number */
var GotoBookmark = function( parser, bookmark )
{
    var textLines = parser.m_script; //.split("\r\n");
    var curParsingScenarioLine = false;
    var lineTokens;

    for ( var lineIdx = 1; lineIdx <= textLines.length; ++lineIdx )
    {
        lineTokens = textLines[lineIdx-1].split( " " );

        //update m_curParsingScenarioLine
        if ( lineTokens.length > 0 )
        {
            if ( ( lineTokens[0].length >= 1 && lineTokens[0][0] == '"' ) || ( lineTokens[0].length >= 2 && lineTokens[0][0] == '-"' ) )
            {
                curParsingScenarioLine = true;
            }
            else if ( lineTokens[0].length >= 1 && lineTokens[0][0] == '~' )
            {
                curParsingScenarioLine = false;
            }
        }

        //bookmark found
        if ( lineTokens.length >= 2 && lineTokens[0].indexOf("栞") != -1 && lineTokens[1] == bookmark )
        {
            NHelper.Log("[GotoBookmark] jumping from line:%d to found bookmark:'%s' (line:%d)",
                parser.m_readlineno, bookmark, lineIdx);
            parser.m_readlineno = lineIdx;
            parser.m_curParsingScenarioLine = curParsingScenarioLine;
            return lineIdx;
        }
    }
    NHelper.LogError("[GotoBookmark] ERROR. BOOKMARK:'%s' DOES NOT EXIST. restoring script to previous state",
        bookmark);
    return -1;
};

var GoToScript = function( parser, scriptTitle, bookmarkName )
{
    //[READ IN SCRIPT TEXT]
    var scriptText = cc.loader._loadTxtSync( gAppDir + "Scripts/" + scriptTitle );
    if ( ! scriptText )
    {
        NHelper.AlertMissingFileError( "Scripts/" + scriptTitle );
        return;
    }

    //adjust settings
    {
        parser.m_scriptName = scriptTitle;
        parser.SetScriptLines( scriptText );
        parser.CalculateScriptLength();
        parser.m_readlineno = 0;
    }

    //bookmark jump if wanted
    var bookmarkline = -1;
    if ( bookmarkName !=  "" )
    {
        bookmarkline = GotoBookmark( parser, bookmarkName );
        if ( bookmarkline != -1 )
        {
            NHelper.Log("[GoToScript] script jump complete. current_script:'%s', bookmark:'%s'", scriptTitle, bookmarkName);
        }
    }
    else
        NHelper.Log("[GoToScript] script jump complete. current_script:'%s'", scriptTitle);
};