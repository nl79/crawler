var
    emitter = require('events').EventEmitter,
    util = require("util"), 
    fs = require('fs'),
    crypto = require('crypto'); 
    

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
        
        /*
         *match value controls the minimum number of terms to match
         *in the document in order to cache it localy.
         */ 
        this.match;
        
        /*
         *directoy to which the relevant documents will be cached.
         */
        this.cacheDir; 
         
        
        this.addUrl = function(url) {
        
            if(typeof url != 'string' || url == '')  {
    
                this.emit('error', Error('Invalid URL supplied: ' + url));
                
                return false;
            
            } else {
                
                this.queue.push(url);
                
                return true; 
            }
        };
        
        this.setCacheDir = function(args){
            this.cacheDir = args; 
        }
        
        this.setTerms = function(args) {
            
            this.terms = args; 
        }; 
        
        this.setStopWords = function(args) {
            
            this.stopWords = args; 
        }; 
        
        this.setLimit = function(args) {
            
            this.limit = args; 
        };
        
        this.setMatch = function(num){
            if (!isNaN(num)) {
                this.match = num;
                return true; 
            }
            
            return false; 
             
        }
        
        
        this.crawl = function() {
            var self = this;
            
            var http = require('http');
          
            if (this.queue.length > 0) {
                
                this.url = this.queue.shift();
                
            } else {
                this.emit('error', Error('Crawl() - Invalid URL: ' + url));
                
                return false; 
            }
            
            console.log('Crawling: ' + this.url);
            
            var req = http.get(this.url, function(res) {
                
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
                

                // url strings contained in the document. 
                var urls = data.body.match(/href="([^"]*)"/g);
                
                
                //check if relevant. If so save the page locally.
                if (this.isRelevant(data.body)) {
                    //store the document.
                    this.cacheDocument(data);  
                }
                
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
                        self.addUrl(url);
                        
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
                
                //console.log(this.queue);
            }        
        };
        
        /*
         *parse the string into words and keep track of word occurances.
         *compare to the supplies terms. 
         */
        this.isRelevant = function(str) {
                    
            //strip out the tags and split the data on empty space. 
            var parts = Crawler.prototype.stripTags(str).split(' ');
            
            //document index. 
            var collection = Object.create(null); 
            
            /*
             *loop thought the array and build an index.
             */
            parts.forEach(function(val, i, arr) {
                //clean the value
                var word = val.trim();
                
                //check if the value is valid
                if (Crawler.prototype.isValid(word)) {
                    
                    //console.log('-' +word.replace(/\W/g, ' ').split(' '));
                    
                    var result = word.replace(/\W/g, ' ').split(/\s+/);
                    
                    if(result instanceof Array) {
                        
                        result.forEach(function(val){
                            
                            //check if val is not empty
                            if (val !== "" && val.length > 2) {
                                
                                /*
                                 *if the value exists in the collection, increment its value by one
                                 *else add the value.
                                 */
                                if (collection[val]) {
                                     
                                    collection[val] = collection[val] + 1;
                                    
                                } else {
                                    
                                    collection[val] = 1; 
                                } 
                            }
                        }); 
                    }
                }
            });
            
            /*
             *loop through the provided search terms and compare to the
             *terms inside the collection.
             *Store matching values
             */
            //var matches = Object.create(null);
            var matches = new Array();
            
            this.terms.forEach(function(val, i, arr) {
                if(val in collection) {
                    matches.push(val);  
                }
            });
            
            /*
             *check matches length. If greater the nor equal to the
             *supplied minimum the document is relevant.
             */
            if (matches.length >= this.match) {
                
                return true;  
            }
            
            return false; 
        }
        
        this.cacheDocument = function(data) {
            
            //get the directory path
            var dir = this.cacheDir ? this.cacheDir : '/_cache-default';
            
            console.log(this.url);
            
            //hash the url. 
            var sha1 = crypto.createHash('sha1');
            sha1.update(this.url);
             
        
            //build the filepath
            var path = dir + '/' + sha1.digest('hex') + '.html';
            var body = data.body;
            
            /*
             *helper function: writefile.
             */
            var save = function() {
                fs.writeFile(path, body, function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("The file was saved!");
                    }
                });
            }
            
            //check if the directory exists.
            fs.stat(dir, function(err, data) {
                if (err) {
                    
                    //if the directory does not exists, create it. 
                    if(err.errno == 34) {
                        
                        fs.mkdir(dir, function(err){
                            
                            if (err) {
                                
                                console.log(err);
                                
                            } else {
                                
                                save(); 
                            }
                        })
                    }
                    
                } else {
                    
                    save(); 
                }
            }); 
        /*
            fs.writeFile(path, data.body, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("The file was saved!");
                }
            });
            */

        }
 
        this.addUrl(config.url);
        this.setTerms(config.terms);
        this.setCacheDir(config.cacheDir);
        this.setMatch(config.match); 
    }
    
    /*
     *inherit the event mitter in order to
     *provite for events.
     */ 
    util.inherits(Crawler, emitter);
    
    Crawler.prototype.isValid = function(str){
            return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
    };
    
    Crawler.prototype.stripTags = function (str){
            var rex = /(<([^>]+)>)/ig;
            return str.replace(rex , "");    
    }
    
    
    return new Crawler(config); 
}

module.exports = spawn;