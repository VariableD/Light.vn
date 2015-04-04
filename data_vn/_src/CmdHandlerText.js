
var LogTextboxNotExisting = function()
{
    NHelper.LogError( "ERROR: trying to use text command without valid textbox" );
};

//return: formatted text
var StringFormat = function( originalText )
{
    if ( !gServices.SysVars.gameplaymode ) return originalText;

    var searchStartIdx = 0;
    var var_start_idx = 0;
    var var_end_idx = 0;
    var var_name = "";
    var var_val = "";
    var formattedText = "";
    while ( (var_start_idx = originalText.indexOf( "{{", searchStartIdx )) != -1 )
    {
        var_start_idx = var_start_idx + 2; //since var name starts right after brackets

        //[FIND END OF VARIABLE NAME]
        {
            var_end_idx = originalText.indexOf( "}}", var_start_idx );
            if ( var_end_idx == -1  ) return originalText;
        }
        //[INSERT VARIABLE VALUE INTO POSITION]
        //note: mUserVars[var_name]
        {
            //parse out variable name and remove all whitespaces
            var_name = originalText.substring( var_start_idx, var_end_idx );
            var_name = var_name.replace(/\s+/g, '');

            //get variable value
            var_val = gServices.SysVars.mUserVars[var_name];

            //amend string to display variable value
            formattedText += originalText.substring( searchStartIdx, var_start_idx-2 ) + var_val;
        }

        //increment pos to find new "{{
        searchStartIdx = var_end_idx+2;
    }
    if ( var_end_idx != 0 )
        formattedText += originalText.substring( var_end_idx + 2 );

    return formattedText === "" ? originalText : formattedText;
};

var ExecuteLine = function( parser, completeLine, newline )
{
    parser.m_curParsingScenarioLine = true;

    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    {
        if ( foundTextbox == null )
        {
            return LogTextboxNotExisting();
        }
        else
        {
            NHelper.Log("reusing textbox");
        }
    }

    //[TEXT MODIFICATION]
    {
        //newline: " / contline: -"
        completeLine = newline ? completeLine.substr(1) : completeLine.substr(2);

        //'.': newline symbol (if at start of line)
        //note: each '.' at start of line denotes number of times to newline
        {
            var newlines = 0;
            while ( completeLine[newlines] == '.' && newlines < completeLine.length )
            {
                ++newlines;
            }
            //remove '.'s
            completeLine = completeLine.substr( newlines );

            for ( var idx = 0; idx < newlines; ++idx )
            {
                completeLine = "\n" + completeLine;
            }

            //completeLine = "\n\n\n\n" + completeLine;
        }

        //'\n': newline symbol (replace \\n with \n)
        var newlineIdx = completeLine.indexOf("\\n");
        if ( newlineIdx !== -1 )
        {
            completeLine = completeLine.replace(/\\n/g, "\n");
        }

        //'\w': wait parser after adding current line
        var waitIdx = completeLine.indexOf("\\w");
        if ( waitIdx !== -1 )
        {
            completeLine = completeLine.substr(0, waitIdx);

            if ( gServices.SysVars.gameplaymode )
                parser.m_ParserState = ParserState.PARSE_FIN;
        }
    }

    var formattedText = StringFormat( completeLine );

    //[PUSH TEXT]
    {
        if ( newline )
        {
            foundTextbox.setText( formattedText );
            if ( NBacklog.m_nTextbox )
                NBacklog.m_nTextbox.setString( NBacklog.m_nTextbox.getString() + "\n\n" + formattedText );
        }
        else
        {
            var asdf = foundTextbox.getString() + formattedText;
            foundTextbox.appendText( formattedText );
            if ( NBacklog.m_nTextbox )
                NBacklog.m_nTextbox.setString( NBacklog.m_nTextbox.getString() + formattedText );
        }
        //update backlog length
        if ( NBacklog.m_nTextbox )
        {
            var backlogScrollView = gRenderLayer.getChildByName( "NBacklog" );
            if ( backlogScrollView )
            {
                backlogScrollView.setInnerContainerSize(cc.size(
                    NBacklog.m_nTextbox.boundingWidth,
                    Math.max( NBacklog.m_nTextbox.getContentSize().height, 500 ) ));
                NBacklog.m_nTextbox.y = backlogScrollView.getInnerContainerSize().height - 10;
            }
        }
    }
};

//文字 t_mVol 100 225 106  r-mplus-1c-m.ttf 24 カメラ無視 'Master Volume
//ex. text label1 0(x) 400(y) 81(layer) font size (incamera) "text to display
var ExecuteLabel = function( parseTokens )
{
    var strStartIdx = 7;
    var inCamera = false;

    if ( parseTokens.length >= 8 && parseTokens[7] == "カメラ無視" )
    {
        strStartIdx = 8;
        inCamera = true;
    }

    //get string (should start with " ' "
    if ( parseTokens[strStartIdx][0] != "'" ) return;
    var textStr = "";
    {
        for ( var i = strStartIdx; i < parseTokens.length; ++i )
        {
            textStr += " " + parseTokens[i];
        }
        //remove " " from start, and  " ' " from start and end
        textStr = textStr.substring( 2, textStr[ textStr.length - 1 ] == "'" ? textStr.length - 1 : textStr.length );
        textStr = StringFormat( textStr );
    }

    ExecuteTextbox(
        [ "text", parseTokens[1], parseTokens[2], parseTokens[3], parseTokens[4], 1000, 1000,
        parseTokens[5], parseTokens[6], inCamera ? parseTokens[7] : "" ]
    );

    var createdText = gRenderLayer.getChildByName( parseTokens[1] );
    if ( createdText )
        createdText.setString( textStr );

};

//文字窓 textbox0 60 350 89 824 0 r-mplus-1c-m.ttf 24 カメラ無視
//ex. textbox textbox1 0(x) 400(y) 81(layer) 800(width) 200(height) fontname fontsize (nocamera)
var ExecuteTextbox = function( parseTokens )
{
    var foundEntity = gRenderLayer.getChildByName( parseTokens[1] );
    var nTextbox;

    var fontSize = parseInt(parseTokens[8]);
    if ( foundEntity == null )
    {
        var size = cc.director.getWinSize();
        nTextbox = new NTextbox("", gAppDir + "Fonts/"+parseTokens[7], fontSize);
        gRenderLayer.addChild(nTextbox,  parseInt(parseTokens[4]), parseTokens[1]);
    }
    else
        nTextbox = foundEntity;

    //make sure textbox and skin continues to live
    {
        nTextbox.stopAllActions();
        nTextbox.setOpacity(255);

        var nSkin = gRenderLayer.getChildByName( parseTokens[1]+"-skin" );
        if ( nSkin )
        {
            nSkin.stopAllActions();
            nSkin.setOpacity(255);
        }
    }

    //apply settings
    {
        nTextbox.setPosition(tlPoint(parseTokens[2], parseTokens[3]));
        nTextbox.setAnchorPoint(0,1);
        nTextbox.boundingWidth =  parseInt(parseTokens[5]);
        nTextbox.boundingHeight =  parseInt(parseTokens[6]);
        nTextbox.setFontSize( fontSize );
        nTextbox.setLineHeight( fontSize * 1.5 );
        cc.LabelTTF.wrapInspection = false;

        nTextbox.scheduleUpdate();

        //outline
        //helloLabel._shadowColorStr = "rgba(0, 0, 0, 1)";
        //helloLabel.enableShadow(-2, -2, 1, 0);
        nTextbox.enableStroke( cc.color(0, 0, 0, 30), 2.0);
        //aLabel._setFontStyle("italic");
        nTextbox._setFontWeight("bold");
    }
};

//使用文字窓 textbox0
var ExecuteUseTextbox = function( parseTokens )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( parseTokens[1] );
    if ( !foundTextbox )
    {
        return NHelper.LogError("WARNING. (ExecuteUseTextbox) entity:'%s' does not exist or not a textbox", parseTokens[1]);
    }

    gServices.SysVars.curUseTextboxName = parseTokens[1];
};

//文字フォント r-mplus-1c-m.ttf
var ExecuteTextFont = function( parseTokens )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    if ( !foundTextbox ) return LogTextboxNotExisting();

    foundTextbox.setFontName( parseTokens[1] );
};

//文字サイズ 40
var ExecuteTextSize = function( parseTokens )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    if ( !foundTextbox ) return LogTextboxNotExisting();

    var fontSize = parseInt(parseTokens[1]);
    foundTextbox.setFontSize( fontSize );
    foundTextbox.setLineHeight( fontSize * 1.5 );
};

//文字行サイズ 70
var ExecuteTextLineSize = function( parseTokens )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    if ( !foundTextbox ) return LogTextboxNotExisting();

    foundTextbox.setLineHeight( parseTokens[1] );
};

//文字色 [r:0-255] [g:0-255] [b:0-255]
var ExecuteTextColour = function( parseTokens )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    if ( !foundTextbox ) return LogTextboxNotExisting();

    foundTextbox.setFontFillColor(
        new cc.Color( parseInt(parseTokens[1]), parseInt(parseTokens[2]), parseInt(parseTokens[3]) ) );
};

var ExecuteTextBold = function( parseTokens )
{

};

//文字陰 0/1 (0: nothing, 1: outline)
var ExecuteTextShadow = function( parseTokens )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    if ( !foundTextbox ) return LogTextboxNotExisting();

    if ( parseTokens[1] == "1" )
        foundTextbox.enableStroke( cc.color(0, 0, 0, 30), 2.0);
    else if ( parseTokens[1] == "0" )
        foundTextbox.disableStroke();
};

var ExecuteTextSpeed = function( parseTokens )
{

};

//文字整列 左
var ExecuteTextAlign = function(parseTokens  )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    if ( !foundTextbox ) return LogTextboxNotExisting();

    if ( parseTokens[1] == "左" )
        foundTextbox.setHorizontalAlignment( cc.TEXT_ALIGNMENT_LEFT );
    else if ( parseTokens[1] == "中央" )
        foundTextbox.setHorizontalAlignment( cc.TEXT_ALIGNMENT_CENTER );
    else if ( parseTokens[1] == "右" )
        foundTextbox.setHorizontalAlignment( cc.TEXT_ALIGNMENT_RIGHT );
};

//文字窓スキン textbar0.png 0 335
var ExecuteTextboxSkin = function( parseTokens )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    if ( !foundTextbox ) return LogTextboxNotExisting();

    var foundTextboxSkin = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName+"-skin" );
    if ( foundTextboxSkin == null )
    {
        foundTextboxSkin = new cc.Sprite(gAppDir + "Images/" + parseTokens[1]);
        gRenderLayer.addChild(foundTextboxSkin, foundTextbox.getLocalZOrder() - 1,
            gServices.SysVars.curUseTextboxName+"-skin"); //child, zOrder, tag (tagging with 'textboxName-skin'
    }

    //apply settings
    foundTextboxSkin.setTexture(gAppDir + "Images/" + parseTokens[1]);
    foundTextboxSkin.setPosition( tlPoint(parseTokens[2], parseTokens[3]) );
    foundTextboxSkin.setAnchorPoint(0,1);
};

//バックログ設定 backlog_textbox
var ExecuteBacklogConfig = function( parseTokens )
{
    //[GET TEXTBOX]
    var foundTextbox = gRenderLayer.getChildByName( gServices.SysVars.curUseTextboxName );
    if ( !foundTextbox ) return LogTextboxNotExisting();

    NBacklog.m_nTextbox = foundTextbox;
    foundTextbox.m_nType = NType.sysBacklog;
    foundTextbox.setOpacity(0);
    var layerNo = NBacklog.m_nTextbox.getLocalZOrder();

    gRenderLayer.removeChild(foundTextbox);

    // Create the scrollview
    var scrollView = new ccui.ScrollView();
    {
        scrollView.setDirection(ccui.ScrollView.DIR_VERTICAL);
        scrollView.setTouchEnabled(true);

        scrollView.setContentSize(cc.size(foundTextbox.boundingWidth+10, foundTextbox.boundingHeight));
        foundTextbox.boundingHeight = 0;

        var winsize = cc.director.getWinSize();
        scrollView.x = foundTextbox.getPositionX();
        scrollView.y = winsize.height - foundTextbox.getPositionY();
        scrollView.setInnerContainerSize(cc.size(
            foundTextbox.boundingWidth+10,
            Math.max( foundTextbox.getContentSize().height, 500 ) )); //foundTextbox.boundingHeight + 10

        foundTextbox.x = 0;
        foundTextbox.y = scrollView.getInnerContainerSize().height - 10;
        scrollView.addChild(foundTextbox);
    }

    gRenderLayer.addChild(scrollView, layerNo, "NBacklog");
};