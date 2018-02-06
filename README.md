
# Client Example (ClientE) to work with the Academic Platform for ONline Experiments (APONE)

*ClientE* is a static web project that serves as an example of a typical client for the [Academic Platform for Online Experiments (APONE)](https://github.com/marrerom/APONE), with the purpose of running online A/B experiments. 

The client offers a typical search web site powered by [ElasticSearch](https://www.elastic.co/). This client serves as an example for two different experiments:
- Color: according to the parameter linkColor, set the color of the search results to blue (control) or green (treatment).
- Ranking: according to the parameter rankingAlg, set the ranking algorithm used to the ElasticSearch default algorithm (control) or the BM25 implementation (treatment).

The parameters are received from the URL and the client changes the experience of the user according to them. The queries issued, the search pages loaded and the documents where the user clicked, are registered as events by calling web services offered by APONE. It is assumed that there is an instance of the platform running at http://ireplatform.ewi.tudelft.nl:8080/APONE. The instance of ElasticSearch used is running on the same server, and has the Cranfield documents indexed for demonstration purposes. Both services, APONE and ElasticSearch, may also be installed locally.

The [platform user guide](https://github.com/marrerom/APONE/userguide.pdf) shows step by step how to set up a complete experiment with the platform and this client, and contains additional information about the services provided by APONE.