var char_set="0123456789";
for(var j=0; j<10; j++) {
	var token = "";
	for(var i=0; i <6; i++) {
		var rnum= Math.floor(Math.random()*char_set.length);
		token+= char_set.substring(rnum,rnum+1);
	}
	db.token.save({"token": token, "users": ["4faefe16dd19995229000003"]});
};	
	