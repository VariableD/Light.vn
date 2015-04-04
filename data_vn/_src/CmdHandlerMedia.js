
//背景音 eok.ogg 反復
var ExecuteMusic = function( parseTokens )
{
    var loopTF = parseTokens[2] == "反復";
    musicLines.push({
        line: MainParser().m_readlineno,
        filename: parseTokens[1],
        repeat: loopTF
    });
    cc.audioEngine.playMusic( gAppDir+ "BGM/" + parseTokens[1], loopTF );
};