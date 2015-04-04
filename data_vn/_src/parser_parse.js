
//top left point
function tlPoint( xPos, yPos )
{
	var winsize = cc.director.getWinSize();
	return cc.p(parseInt(xPos), winsize.height - parseInt(yPos));
}

function Parser_Parse( parser, layer, parseTokens, fullLine, forceParseAsScriptCmd )
{
    if ( forceParseAsScriptCmd === undefined  ) forceParseAsScriptCmd = false;
    var syncCmd = false;
    var syncDuration = 0;

	if ( parseTokens.length > 0 )
	{
        //check if text line or script cmd
        if ( parseTokens[0].length > 0 && parseTokens[0][0] == "~" )
        {
            parser.m_curParsingScenarioLine = false;

            //remove '~' from tokens and line
            parseTokens[0] = parseTokens[0].substr(1);
            fullLine = fullLine.substr(1);
        }

        ///////////////////////////////////////
        //[TEXT LINE: JUST APPEND NEW TEXT]
        ///////////////////////////////////////

        if ( parser.m_curParsingScenarioLine && !forceParseAsScriptCmd )
        {
            if ( parseTokens[0][0] == "\"" ) //new paragraph
            {
                ExecuteLine( parser, fullLine, true );
            }
            else if ( parseTokens[0][0] == "-\"" ) //continue line
            {
                ExecuteLine( parser, fullLine, false );
            }
            else if ( fullLine.length >= 2 )
            {
                ExecuteLine( parser, "-\"" + fullLine, false );
            }
            return;
        }

        ///////////////////////////////////////
        //[SCRIPT CMD LINE: CHECKS]
        ///////////////////////////////////////
        {
            //check for sync cmd
            if ( parseTokens[0].length > 0 && parseTokens[0][0] == "." )
            {
                syncCmd = true;

                //remove '.' from tokens and line
                parseTokens[0] = parseTokens[0].substr(1);
                fullLine = fullLine.substr(1);
            }

            //check if comment
            if ( fullLine.indexOf("//") == 0 )
            {
                var a = 0;
                return;
            }

            //remove '\n' at end of script line if exists
            var lastToken = parseTokens[parseTokens.length-1];
            if (  lastToken.indexOf("\n") > 0  )
            {
                parseTokens[parseTokens.length-1] = lastToken.substring(0, lastToken.indexOf("\n"));
            }
        }

        ///////////////////////////////////////
        //[SCRIPT CMD LINE: PARSE AND EXECUTE]
        ///////////////////////////////////////
        {
            ////////////////////////////
            //[ CG RELATED CMDS ]
            ////////////////////////////
            if ( parseTokens[0] == "背景" )
            {
                ExecuteBG(parseTokens);
            }
            else if ( parseTokens[0] == "絵" )
            {
                ExecuteCG(parseTokens);
            }
            else if ( parseTokens[0] == "クリア" )
            {
                ExecuteClear(parseTokens);
            }

            ////////////////////////////
            //[ AUDIO RELATED CMDS ]
            ////////////////////////////
            else if ( parseTokens[0] == "背景音" )
            {
                ExecuteMusic( parseTokens );

                //this.scheduleUpdate();
            }

            ////////////////////////////
            //[ TEXT RELATED CMDS ]
            ////////////////////////////
            else if ( parseTokens[0].indexOf("\"") == 0 )
            {
                ExecuteLine(parser, fullLine, true);
            }
            else if ( parseTokens[0].indexOf("-\"") == 0 )
            {
                ExecuteLine(parser, fullLine, false);
            }
            else if ( parseTokens[0] == "文字窓" )
            {
                ExecuteTextbox(parseTokens);
            }
            else if ( parseTokens[0] == "使用文字窓" )
            {
                ExecuteUseTextbox(parseTokens);
            }
            else if ( parseTokens[0] == "文字フォント" )
            {
                ExecuteTextFont(parseTokens);
            }
            else if ( parseTokens[0] == "文字サイズ" )
            {
                ExecuteTextSize(parseTokens);
            }
            else if ( parseTokens[0] == "文字行サイズ" )
            {
                ExecuteTextLineSize(parseTokens);
            }
            else if ( parseTokens[0] == "文字色" )
            {
                ExecuteTextColour(parseTokens);
            }
            else if ( parseTokens[0] == "文字ボールド" )
            {
                ExecuteTextBold(parseTokens);
            }
            else if ( parseTokens[0] == "文字陰" )
            {
                ExecuteTextShadow(parseTokens);
            }
            else if ( parseTokens[0] == "文字整列" )
            {
                ExecuteTextAlign(parseTokens);
            }
            else if ( parseTokens[0] == "文字窓スキン" )
            {
                ExecuteTextboxSkin(parseTokens);
            }
            else if ( parseTokens[0] == "文字" )
            {
                ExecuteLabel(parseTokens);
            }
            else if ( parseTokens[0] == "バックログ設定" )
            {
                ExecuteBacklogConfig(parseTokens);
            }

            ////////////////////////////
            //[ SCRIPT RELATED CMDS ]
            ////////////////////////////
            else if ( parseTokens[0] == "ジャンプ" )
            {
                ExecuteJump(parseTokens);
            }
            else if ( parseTokens[0] == "スクリプト" )
            {
                ExecuteScript(parseTokens, ParseScript.EXTERN_SCRIPT);
            }
            else if ( parseTokens[0] == "キートリガー" )
            {
                ExecuteKeyTrigger(parseTokens);
            }
            else if ( parseTokens[0] == "待機" )
            {
                syncDuration = ExecuteWait(parseTokens);
                syncCmd = syncDuration != -1;
            }

            ////////////////////////////
            //[ TWEEN RELATED CMDS ]
            ////////////////////////////
            //note: cocos2d uses secs for duration, not ms

            else if ( parseTokens[0] == "イン" )
            {
                syncDuration = ExecuteFadein(parseTokens, syncCmd);
            }
            else if ( parseTokens[0] == "アウト" )
            {
                syncDuration = ExecuteFadeout(parseTokens, syncCmd);
            }
            else if ( parseTokens[0] == "移動" )
            {
                syncDuration = ExecuteMove(parseTokens, syncCmd);
            }
            else if ( parseTokens[0] == "拡大" )
            {
                syncDuration = ExecuteScale(parseTokens, syncCmd);
            }
            else if ( parseTokens[0] == "回転" )
            {
                syncDuration = ExecuteRotate(parseTokens, syncCmd);
            }
            //alpha
            //layer
            //image
            //rgb
            //inverse
            //roll In (alpha fade in)
            //roll out (alpha fade out)

            ////////////////////////////
            //[ BUTTON RELATED CMDS ]
            ////////////////////////////]
            else if ( parseTokens[0] == "ボタン基本資料" )
            {
                ExecuteButtonBasicRes(parseTokens);
            }
            else if ( parseTokens[0] == "ボタン" || parseTokens[0] == "シスボタン" )
            {
                ExecuteButton(parseTokens);
            }
            else if ( parseTokens[0] == "ボタン文字" )
            {
                ExecuteButtonText(parseTokens);
            }
            else if ( parseTokens[0] == "ボタン活性領域" )
            {
                ExecuteBtnAliveRegion(parseTokens);
            }

            ////////////////////////////////////
            //[VARIABLE RELATED FUNCTIONS]
            ////////////////////////////////////
            else if ( parseTokens[0] == "変数" )
            {
                ExecuteVar(parseTokens);
            }
            else if ( parseTokens[0] == "もし" )
            {
                ExecuteVarIf(parseTokens);
            }

            ////////////////////////////////////
            //[SYSTEM RELATED FUNCTIONS]
            ////////////////////////////////////
            else if ( parseTokens[0] == "ゲームエンド" )
            {
                ExecuteEndGame(parseTokens);
            }

            else
            {
                NHelper.LogError("ERROR: (Parser_Parse) line:'%s' cannot be parsed", fullLine);
            }
        }

        //Note: wait_cmd shouldn't be happening upon skip mode
        if ( gServices.SysVars.gameplaymode && syncCmd && syncDuration > 1 )
        {
            parser.m_ParserState = ParserState.WAIT_CMDFIN;
        }
	}
}