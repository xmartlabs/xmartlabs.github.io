---
layout: post
title:  GitHub 2016 round up
date:   2017-01-01 08:00:00
author: Mathias Claassen
categories: Github, Data Analysis
author_id: mathias
markdown: redcarpet

---

# Analysis of 2016 Github commits, messages, stars and more

Welcome to the first Xmartlabs' data analysis post. We thought it would be interesting to study the use of one of the tools we use everyday which is Github. Xmartlabs has several open source projects so it seemed interesting to see some statistics about open source projects on Github. Luckily there is the [GitHub Archive] which records all the public activity on Github and can be accessed for free.
On the other hand we wanted to try and use some new technologies like Apache Spark on Databricks and Zeppelin. So we started a process in which we came to grips with these technologies and found out some interesting things.


<!-- what this is about and what we used to get the results -->

### What did we study and how

[GitHub Archive] can be accessed from GitHub's API directly. From there you can grab historical data of the activity registered on Github since 2/12/2011. This files are partitioned by hour and each of them has a size of 20-30 Mb when unzipped so that for one year this is a lot of data if you want to store and process it yourself (600Gb+). The archive is also published on [Google BigQuery](https://developers.google.com/bigquery/) as a public dataset, you just have to pay for the bytes you process.

We decided to study this data to get some interesting information. The archive consists of a series of events happening on GitHub like pushes, stars, comments, pull requests and much more. So we decided to analyse the commits and see where they come from, mapping them to the location of the committer. This work was inspired by a similar previous work by [Ramiro Gómez](http://geeksta.net/visualizations/github-commit-map/). We plotted the commits of a country scaled by the country's population and area. We also plotted the percentage of open source developers per million inhabitants for each country.

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
* **Messages with link to an issue or pull request**: These are messages containing references to GitHub's issues or pull request like `#xxx`. 
* **Messages shorter than 15 characters**: Following the good practices for commit messages posted on several sites like [OpenStack](https://wiki.openstack.org/wiki/GitCommitMessages#Information_in_commit_messages) we searched the commit message length to see how many are too short. It is not easy to specify a number of characters for which we say this is too short but in general commit messages should be descriptive of the solved problem or the new feature so that a message with less then 15 characters should not be a good message. We could also have tried a higher number than 15.
* **Average message length**: The average length of commit messages. To get an insight to how messages are structured for a repo in general.

We then chose some repositories with a lot of stars, from different programming languages and communities. So we chose Linux as one of the biggest repos as well as Bootstrap and JSON-Server which share a language but are maintained quite differently. We also compared this to the results of all the commit messages with some interesting results:


|   | Linux| Bootstrap | JSON-Server | Global |
|---|------|-----------|-------------|--------|
| Total messages | 6096 | 2464 | 67 | 131207466 | 
| Messages with 'fix' | 42% | 17% | 8% | 10% |
| Messages with link to issue or pull request | 2% | 37% | 16% | 8% |
| Messages shorter than 15 characters | <1% | 5% | 26% | 17% |
| Average message length | 664.7 | 82.4 | 37.5 | 60.3 |

##### What did we learn from this

The first thing that catched my eye was the high standards linux keep for their commit messages as not even 1 in 100 is shorter than 15 characters and that the average length exceeds 664 characters.This completely contrasts to the relatively high percentage of short commits in JSON-Server but also in general.

Not surprising is the fact that almost halve of the commits in Linux do `fix` something and that `fix` appears in those long and complete commit messages. 

There is also a  great difference between Bootstrap and Linux in terms of linking to issues and pull request as the Linux repo has issue reporting disabled on GitHub and does merge commits that do not always come from GitHub pull request but SCM. If that was not the case then low amount of links to issues or pull requests would mean a lot of direct pushes to master branch (as pull request merges would be caught by this rule).

### TODO: Stars per repo analysis (extra blog?)
	* Present results in tables
		* Top starred repos
		* Average stars per language
		* Others
		

[GitHub Archive]: https://www.githubarchive.org/