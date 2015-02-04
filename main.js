var crawler = require('./crawler.js');

/*
var seedURL = ['http://en.wikipedia.org/wiki/Information_retrieval',
                'http://en.wikipedia.org/wiki/Information_retrieval_applications']; 
*/
var seedURL = ['http://en.wikipedia.org/wiki/Information_retrieval'];
var searchTerms = [];
var stopTerms = []; 

var swarm = new Array(); 



seedURL.forEach(function(val, index, arr) {
    swarm.push(crawler({'url': val}).on('error', function(err) {
        console.log(err); }).on('done', function(arg) {
            console.log('Finished Crawling'); 
        }).crawl()); 
    
});

    




