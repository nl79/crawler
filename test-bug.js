var http = require('http');

var url = 'http://nist.gov/dads/';

var req = http.get(url, function(res) {
                  
    res.setEncoding('utf8');
    
    res.on('data', function (chunk) {
        this.buffer += chunk;    
    });
    
    res.on('end', function() {
        
        //check if buffer is undefined
        console.log(this.buffer);
        console.log(res.statusCode);
        console.log(res.headers);
        
        if (!this.buffer || res.statusCode != 200) {
            
            console.log('here'); 
            
        }
        /*
        //call the crawlers transform method to parse the data. 
        self.transform({status: res.statusCode,
                                    headers: JSON.stringify(res.headers),
                                    body: this.buffer});
                                    */
    })
    
    res.on('error', function(err, data) {
        console.log(err); 
    }); 
    
});