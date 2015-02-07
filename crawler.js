var
    emitter = require('events').EventEmitter,
    util = require("util"); 
    

function spawn (config) {
    
    function Crawler (config) {
        
        //busy flag. 
        this.crawling = false;
        
        //build the queue. 
        this.queue = new Array();
        
        //raw config data.
        this.config = config; 
        
        //set the url
        this.url; 
        
        //set the search terms. 
        this.terms; 
        
        //set the stop words. 
        this.stopWords; 
         
        
        this.addUrl = function(url) {
        
            if(typeof url != 'string' || url == '')  {
    
                this.emit('error', Error('Invalid URL supplied'));
                
                return false;
            
            } else {
                
                this.queue.push(url);
                
                return true; 
            }
        }; 
        
        this.setTerms = function(args) {
            
            this.terms = args; 
        }; 
        
        this.setStopWords = function(args) {
            
            this.stopWords = args; 
        }; 
        
        this.setLimit = function(args) {
            
            this.limit = args; 
        }; 
        
        
        this.crawl = function() {
            var self = this;
            
            var http = require('http');
          
            if (this.queue.length > 0) {
                var url = this.queue.shift(); 
            } else {
                this.emit('error', Error('Method: Crawl() - Invalid URL'));
                
                return false; 
            }
            
            console.log('Crawling: ' + url);
            
            var req = http.get(url, function(res) {
                
                res.setEncoding('utf8');
                
                res.on('data', function (chunk) {
                    this.buffer += chunk;    
                });
                
                res.on('end', function() {
    
                    //call the crawlers transform method to parse the data. 
                    self.transform({status: res.statusCode,
                                                headers: JSON.stringify(res.headers),
                                                body: this.buffer}); 
                })
                
            });
            
            req.on('error', function(e) {
              console.log('problem with request: ' + e.message);
            });
        }; 
        
        this.transform = function(data) {
            
            
            self = this;
            
            //check that the data object has valid data. 
            if (data && data.status == 200 && data.body != '') {
                //var matches = data.body.match(/<a[^>]*href="([^"]*)"[^>]*>.*<\/a>/g);
                
                var terms = Array(); 
                
                // match the urls
                var urls = data.body.match(/href="([^"]*)"/g);
                
                /*
                 *process the urls and push them into the queue
                 */
                urls.forEach(function(val, index, arr) {
                    
                     
                    
                    var url = val.substring(6, val.indexOf('"', 6));
                    
                    /*check if the protocol is defined
                     *if so, the url is valid, so save it and return. 
                     *ex: http or https
                     */
                    if (url.substring(0, 4).toLowerCase() == 'http') {
                        self.addUrl(this,url);
                        
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
                            
                            self.addUrl('http' + url);    
                            break; 
                    }
               
                });
                
                console.log(this.queue); 
         
            }
                   
        }; 
        
        this.isValid = function(str){
            return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
        };
        
        this.addUrl(config.url); 
    }
     
    util.inherits(Crawler, emitter);
    
    
    return new Crawler(config); 
}

module.exports = spawn;

/** TEST CODE **/

function parse(data) {
    
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
}