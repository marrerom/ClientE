# Client Example (ClientE) to work with the Academic Platform for ONline Experiments (APONE)

*ClientE* is a static web project that serves as an example of a typical client for the [Academic Platform for Online Experiments (APONE)](https://marrerom.github.io/APONE), with the purpose of running online A/B experiments. 

The client offers a typical search web site powered by [ElasticSearch](https://www.elastic.co/), and serves as an example for three different experiments:
- Color: according to the parameter linkColor, set the color of the search results to blue (control) or green (treatment).
- Ranking: according to the parameter rankingAlg, set the ranking algorithm used to the ElasticSearch default algorithm (control) or the BM25 implementation (treatment).
- Color+Ranking: full-factorial experiment with all the combinations of linkColor and rankingAlg.

The first two experiments define different URLs per variant. The last experiment make use of a PlanOut script instead. In all the cases, the parameters are received from the URL and the client changes the experience of the user according to them. The queries issued, the search pages loaded and the documents where the user clicked, are registered as events by calling web services offered by APONE. 

It is assumed that there is an instance of the platform running at [http://ireplatform.ewi.tudelft.nl:8080/APONE](http://ireplatform.ewi.tudelft.nl:8080/APONE), with those experiments defined. The instance of ElasticSearch used is running on the same server, and has the Cranfield documents indexed for demonstration purposes. Three instances of ClientE running in the same server serve as clients for those experiments. 

The [platform user guide](https://marrerom.github.io/APONE/docs/APONEUserGuide.md) shows step by step how to set up the three experiments locally with the remote platform and ClientE installed locally, and contains additional information about the services provided by APONE. 

APONE may also be installed locally. The [installations guide](https://marrerom.github.io/APONE/docs/installation.md) describes the process. 