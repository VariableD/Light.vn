
var getVariableValue = function( var_name )
{
    if( !gServices.SysVars.mUserVars.hasOwnProperty(var_name) )
    {
        return NHelper.LogError("[getVariableValue] ERROR: value:'%s' DOES NOT EXIST", var_name);
        //return; //this means undefined
    }
    return gServices.SysVars.mUserVars[ var_name ];
};

//ex. 変数 正解数 = 0
var ExecuteVar = function( parseTokens )
{
    if ( !gServices.SysVars.gameplaymode ) return;

    //variable assignment
    if ( parseTokens[2] == "=" )
    {
        //string assignment
        if ( parseTokens.length > 2 && parseTokens[3][0] == "'" )
        {
            var assignStr = "";
            for (  var i = 3; i < parseTokens.length; ++i )
            {
                assignStr = assignStr.concat( parseTokens[i] );
            }
            //cut off space on begin and ['] from start and end
            assignStr = assignStr.substring( 1, assignStr.length - 1 );
            gServices.SysVars.mUserVars[parseTokens[1]] = assignStr;
        }
        //number assignment
        else if ( NHelper.CheckStringsAreNumbers( [ parseTokens[3] ] ) )
        {
            gServices.SysVars.mUserVars[parseTokens[1]] = Number( parseTokens[3] );
        }
        //variable assignment (ex. var a = b)
        else
        {
            var value = getVariableValue( parseTokens[3] );
            if ( value === undefined )
                return NHelper.LogError("ERROR: (ExecuteVar) Invalid expression. var:'%s' does not exist",
                    parseTokens[3]);
            gServices.SysVars.mUserVars[parseTokens[1]] = value;
        }
    }
    //variable manipulation (ex. var Count += 1, var Count += Input_No)
    else
    {
        var secondValue;
        if ( NHelper.CheckStringsAreNumbers( [ parseTokens[3] ] ) )
        {
            secondValue = Number( parseTokens[3] );
        }
        else
        {
            secondValue = getVariableValue( parseTokens[3] );
            if ( secondValue === undefined )
                return NHelper.LogError("ERROR: (ExecuteVar) Invalid expression. var:'%s' does not exist",
                    parseTokens[3]);
        }

        //[GET VARIABLE CURRENT VALUE]
        var value = getVariableValue( parseTokens[1] );
        if ( value === undefined )
            return NHelper.LogError("ERROR: (ExecuteVar) Invalid expression. var:'%s' does not exist",
                parseTokens[1]);

        //[EXECUTE CALCULATIONS]
        if ( parseTokens[2] == ( "+=" ) )
            value += secondValue;
        else if ( parseTokens[2] == ( "-=" ) )
            value -= secondValue;
        else if ( parseTokens[2] == ( "*=" ) )
            value *= secondValue;
        else if ( parseTokens[2] == ( "/=" ) )
            value /= secondValue;

        gServices.SysVars.mUserVars[parseTokens[1]] = value;

        //[SAVE VALUE IN CONFIG IF GLOBAL VARIABLE]
    }
};

var ExecuteVarIf = function( parseTokens )
{
    if ( !gServices.SysVars.gameplaymode ) return;

    //note: if both variables don't exist, then jump to false dest
    //(handle undefined variables as false condition)
    var variablesExist = false;
    var conditionTrue = false;

    //[GET VARIABLE VALUES]
    var value1, value2;
    if ( (value1 = getVariableValue( parseTokens[1] )) )
    {
        //comparing with number
        if ( NHelper.CheckStringsAreNumbers( [ parseTokens[3] ] ) )
        {
            variablesExist = true;
            value2 = Number( parseTokens[3] );
        }
        //comparing with variable value
        else
        {
            if ( (value2 = getVariableValue( parseTokens[3] )) )
                variablesExist = true;
        }
    }

    //[CHECK CONDITION]
    if ( variablesExist )
    {
        if ( parseTokens[2] == ( "==" ) )
            conditionTrue = value1 == value2;
        else if ( parseTokens[2] == ( "!=" ) )
            conditionTrue = value1 != value2;
        else if ( parseTokens[2] == ( ">=" ) )
            conditionTrue = value1 >= value2;
        else if ( parseTokens[2] == ( ">" ) )
            conditionTrue = value1 > value2;
        else if ( parseTokens[2] == ( "<=" ) )
            conditionTrue = value1 <= value2;
        else if ( parseTokens[2] == ( "<" ) )
            conditionTrue = value1 < value2;
        else
        {
            NHelper.LogError( ( "[CmdHandlers::ExecuteVarIf] ERROR: condition:'%s' DOES NOT EXIST \n" ),
                parseTokens[2] );
            return;
        }
    }
    else if ( !variablesExist && parseTokens[2] == ( "!=" ) )
    {
        //var a != undefined => always true
        conditionTrue = true;
    }

    //[CONDITION BRANCH]
    if ( conditionTrue )
    {
        //[GO TO TRUE CONDITION DESTINATION]
        if ( parseTokens[4] == ( "here" ) )
            GotoBookmark( CurParser(), parseTokens[5] );
        else
            GoToScript( CurParser(), parseTokens[4], parseTokens[5] );
    }
    else //condition false
    {
        //[GO TO FALSE CONDITION DESTINATION]
        //ex. if Count == 1 here bookmark
        if ( parseTokens.length == 6 )
        {
            ParseScriptToLine( CurParser(), -1 );
            NHelper.Log( ( "[CmdHandlers::ExecuteVarIf] condition false: continue cur script. \n" ) );
        }
        //ex. if Count == 1 here bookmark else here bookmark
        else
        {
            if ( parseTokens[4] == ( "here" ) )
                GotoBookmark( CurParser(), parseTokens[8] );
            else
                GoToScript( CurParser(), parseTokens[7], parseTokens[8] );
        }
    }
};