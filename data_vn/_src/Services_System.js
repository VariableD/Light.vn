
var SaveFile = function()
{
    var texture = cc.RenderTexture.create(winSize.width, winSize.width);
    if (!texture)
        return;

    //to render on RenderTexture, just call .vist() on any layer / objects that need rendering
    texture.begin();
    gRenderLayer.visit();
    texture.end();

    var sprite = cc.Sprite.create(texture.getSprite().texture);

    sprite.x = winSize.width/2;
    sprite.y = winSize.width/2;
};