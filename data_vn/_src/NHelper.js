
var NHelper = {
    CheckStringsAreNumbers: function ( tokenArray )
    {
      for ( var i = 0; i < tokenArray.length; ++i )
      {
          if ( isNaN( tokenArray[i] ) )
              return false;
      }
      return true;
    },
    AlertMissingFileError: function ( filePath )
    {
        if ( gServices.SysVars.gameplaymode )
            alert("[ERROR] File:'" + filePath + "' does not exist!");

        this.LogError("[ERROR] File:'%s' does not exist!", filePath);
    },
    LogCurrentStack: function()
    {
        var curParser = CurParser();
        if ( curParser )
        {
            console.log("\n[Light.vn] possible error: LogCurrentStack. CurFile:'" + curParser.m_scriptName + "' line:" + curParser.m_readlineno);
        }
        else
        {
            console.log("\n[Light.vn] cur parser does not even exist");
        }
    },
    LogError: function()
    {
        this.LogCurrentStack();

        //arguments: special variable referring to all arguments passed into a function
        //.apply: is a javascript concept
        console.log( cc.formatStr.apply(cc, arguments) );
    },
    Log: function()
    {
        console.log( cc.formatStr.apply(cc, arguments) );
    }

};