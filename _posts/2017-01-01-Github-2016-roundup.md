---
layout: post
title:  Github 2016 round up
date:   2017-01-01 08:00:00
author: Mathias Claassen
categories: Github, Data Analysis
author_id: mathias
markdown: redcarpet

---

### TODO: Write welcome message and motivation of this work




<!-- what this is about and what we used to get the results -->

### What did we study and how

[Github archive](https://www.githubarchive.org/) records all the public activity on Github. This archive can be accessed from [Google BigQuery](https://developers.google.com/bigquery/) as a public dataset. 

We decided to study these data to get some interesting information. The archive consists of a series of events happening on Github like pushes, stars, comments, pull requests and much more. So we decided to analyse the commits and see from where they come, mapping them to the location of the committer. This work was inspired by a similar previous work by [Ramiro Gómez](http://geeksta.net/visualizations/github-commit-map/). We plotted the commits of a country scaled by the country's population and area. We also plotted the percentage of open source developers per million inhabitants for each country.

We also queried the messages of these commits to extract some interesting statistics for certain repositories.

Last but not least we studied the most starred repositories and mapped these repositories to their languages comparing the average count of stars for each language.

To get hold of and study this data we used several platforms like running [Apache Zeppelin](https://zeppelin.apache.org/) on Amazon EMR querying data from S3 as well as querying Google BigQuery's data directly and processing it with a local Zeppelin instance.

### TODO: Commit maps: 
	* Show maps with dropdown to switch between them

	* Analyse results?
	
<div id="container" style="width:100%;height:500px"></div>
<script src="/js/datamaps/d3.min.js"></script>
<script src="/js/datamaps/topojson.min.js"></script>
<script src="/js/datamaps/datamaps.world.hires.min.js"></script>
<script src="/js/datamaps/main.js"></script>

### TODO: Commit message analysis
	* Motivation
	* Show results table
	* Some Conclusions
	
We also wanted to study the commit messages. For this we defined some metrics and compared the global values to those of some pretty much used repositories.

The metrics we took were the following:

* **Messages with 'fix'**: Messages that include the string `fix`. This commits should be a representation of bug fixing commits and not commits that change documentation or add a new feature.
* **Messages with link to issue or pull request**: These are messages containing references to Github's issues or pull request like `#xxx`. 
* **Messages shorter than 15 characters**: Following the good practices for commit messages posted on several sites like [OpenStack](https://wiki.openstack.org/wiki/GitCommitMessages#Information_in_commit_messages) we searched the commit message length to see how many are too short. It is not easy to specify a number of characters for which we say this is to short but in general commit messages should be descriptive of the solved problem or the new feature so that a message with less then 15 characters should not be a good message. We could also have tried a higher number than 15.
* **Average message length**: The average length of commit messages. To get an insight to how messages are structured for a repo in general.

And there were in fact some interesting results:


|   | Linux| Bootstrap | JSON-Server | Global |
|---|------|-----------|-------------|--------|
| Total messages | 6096 | 2464 | 67 | 131207466 | 
| Messages with 'fix' | 42% | 17% | 8% | 10% |
| Messages with link to issue or pull request | 2% | 37% | 16% | 8% |
| Messages shorter than 15 characters | <0.01% | 5% | 26% | 17% |
| Average message length | 664.7 | 82.4 | 37.5 | 60.3 |

### TODO Conclusions

### TODO: Stars per repo analysis (extra blog?)
	* Present results in tables
		* Top starred repos
		* Average stars per language
		* Others
		


[Ecno]:        https://github.com/xmartlabs/Ecno