var crawler = require('./crawler.js');

/*
var seedURL = ['http://en.wikipedia.org/wiki/Information_retrieval',
                'http://en.wikipedia.org/wiki/Information_retrieval_applications']; 
*/
var seedURL = ['http://en.wikipedia.org/wiki/Data_structure',
               'http://en.wikipedia.org/wiki/Algorithm']; 
//var seedURL = ['http://en.wikipedia.org/wiki/Information_retrieval'];

var searchTerms = ['computer',
                   'programming',
                   'language',
                   'structure',
                   'data',
                   'algorithm',
                   'schema',
                   'processing',
                   'design',
                   'pattern'];

var stopTerms = ['and','or','the','an'];
var cacheDir = '/cache'; 

var swarm = new Array(); 



seedURL.forEach(function(val, index, arr) {
    swarm.push(crawler({'url': val,
                       'limit': 500,
                       'terms': searchTerms,
                       'stopTerms': stopTerms,
                       'cacheDir': cacheDir,
                       'match': 2}).on('error', function(err) {
        console.log(err); }).on('done', function(arg) {
            console.log('Finished Crawling'); 
        }).crawl()); 
    
});

    




