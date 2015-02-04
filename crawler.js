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
            
            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            
            res.setEncoding('utf8');
            
            res.on('data', function (chunk) {
                this.buffer += chunk;    
            });
            
            res.on('end', function() {

                //call the crawlers transform method to parse the data. 
                Crawler.prototype.transform({status: res.statusCode,
                                            headers: JSON.stringify(res.headers),
                                            body: this.buffer}); 
            })
            
        });
        
        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });
    }

    Crawler.prototype.transform = function(data) {
        
        //check that the data object has valid data. 
        if (data && data.status == 200 && data.body != '') {
            
            var parts = data.body.split(' ');
            
            var valid = Array();
            var links = Array(); 
            
            //loop and extract the clean terms
            parts.forEach(function(val, index, arr){
                //trim
                val.trim();
                
                
                 /*
                 *check if the value is an html anchor href attribute.
                 *a valid href would be at least 7 characters long.
                 *EX: href="" is 7 characters long.
                 */ 
                if (val.length > 7 && val.substring(0, 4).toLowerCase() == 'href') {
                    
                    /*
                     *extract the url path starting from the first none "
                     *character and going untill the closing ".
                     */ 
                    var url = val.substring(6, val.indexOf('"', 6));
                    
                    
                    /*check if the protocol is defined
                     *if so, the url is valid, so save it and return. 
                     *ex: http or https
                     */
                    if (url.substring(0, 4).toLowerCase() == 'http') {
                        links.push(url);
                        
                        return; 
                    }
                    
                    
                    /*check if the url is a current page anchor
                     *#local_anchor
                     *return
                     */ 
                    if (url.charAt(0) == '#' ) { return; }
                    
                    /*
                     *check if the string is a relative link or an external link
                     *relative link would begin with /
                     *external links would begin with //
                     */
                    var slashes = url.substring(0,2);
                    
                    switch (slashes) {
                        case '/':
                            console.log(url);
                            break; 
                        
                        case '//':
                            /*
                             *add the protocol to the url string and push it into the links array. 
                             *ex: http:
                             */
                            
                            links.push('http:' + url);    
                            break; 
                    }
        
                    //console.log(val); 
                }

            }); 
        }
        
        console.log(links); 
         
    }
    
    Crawler.prototype.isValid = function isValid(str){
        return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
    }   
    
    
    return new Crawler(url); 
}

module.exports = spawn; 