var docRef=documents[0]

app.activeDocument = docRef;

var text_layer = docRef.layers["token"].name;
var text = text_layer.ArtLayer().textItem;
text.contents = "test";