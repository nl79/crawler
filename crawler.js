var
    emitter = require('events').EventEmitter,
    util = require("util"); 
    

function spawn (config) {
    
    //Url array of seed urls. 
    var url = typeof config.url == 'string' ?  config.url :  "";
    
    function Crawler (url) {
        //busy flag. 
        this.crawling = false;
          
        this.url = url; 
    }
 
 
    util.inherits(Crawler, emitter);
 
   
    Crawler.prototype.crawl = function() {
        var self = this;
        
        if(typeof url != 'string' || url == '')  {
            
            self.emit('error', Error('Invalid URL supplied'));
            return false; 
        }
        
        var http = require('http');
        
        var req = http.get(this.url, function(res) {
            
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            
            res.setEncoding('utf8');
            
            
            
            res.on('data', function (chunk) {
                this.buffer += chunk;    
            });
            
            res.on('end', function() {
                
                console.log(this.buffer);
                 
                self.emit('done'); 
            })
            
        });
        
        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });
    }

    return new Crawler(url); 
}

module.exports = spawn; 