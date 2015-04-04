
var ExecuteEndGame = function( parseTokens )
{
    if ( gServices.SysVars.gameplaymode )
    {
        NHelper.Log("[ExecuteEndGame] APPLICATION MODE) endGame. \n");
        gServices.SysVars.gameover = true;
    }
    else
        NHelper.Log("[ExecuteEndGame] EDITOR MODE) IGNORING CMD: endGame. \n");
};