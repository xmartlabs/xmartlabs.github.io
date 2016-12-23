---
layout: post
title:  GitHub 2016 round up
date:   2017-01-01 08:00:00
author: Mathias Claassen
categories: GitHub, Data Analysis
author_id: mathias
markdown: redcarpet

---

# Analysis of 2016 GitHub commits, messages, stars and more

Welcome to the first Xmartlabs' data analysis post. We thought it would be interesting to study the use of one of the tools we use everyday which is GitHub. Xmartlabs has several open source projects so it seemed interesting to see some statistics about open source projects on GitHub. Luckily there is the [GitHub Archive] which records all the public activity on GitHub and can be accessed for free.
On the other hand we wanted to try and use some new technologies like Apache Spark on Databricks and Zeppelin. So we started a process in which we came to grips with these technologies and found out some interesting things.

<!-- what this is about and what we used to get the results -->

## What did we study

[GitHub Archive] can be accessed from its website directly. From there you can grab historical data of the activity registered on GitHub since 2/12/2011. These files are partitioned by hour, each with an average size of over 80Mb when unzipped, so that for one year this is a lot of data if you want to store and process it yourself (700Gb+). The archive is also published on [Google BigQuery](https://developers.google.com/bigquery/) as a public dataset, you just have to pay for the bytes you process.

We decided to study this data to get some interesting information. The archive consists of a series of events happening on GitHub like pushes, stars, comments, pull requests and much more. So we decided to analyze the commits and see where they come from, mapping them to the location of the committer. This work was inspired by a similar previous work by [Ramiro Gómez](http://geeksta.net/visualizations/GitHub-commit-map/). We plotted the commits from the users of a country scaled by the country's population and area. We also plotted the percentage of open source developers per million inhabitants for each country.

We also queried the messages of these commits to extract some interesting statistics for certain repositories.

Last but not least we studied the most starred repositories and mapped these repositories to their languages comparing the average count of stars for each language.

## Maps

<select id="dropdownselect" onchange="selectedMapType();">
  <option value="commitsPop">Commits per 100k inhabitants</option>
  <option value="commitsArea">Commits per 1000 square km</option>
  <option value="devPerMil">Developers per Million inhabitants</option>
</select>

<div id="container" style="width:100%;height:500px"></div>

<script src="/datamaps/js/d3.min.js"></script>
<script src="/datamaps/js/topojson.min.js"></script>
<script src="/datamaps/js/datamaps.world.hires.min.js"></script>
<script src="/datamaps/js/main.js"></script>
<link rel="stylesheet" href="/datamaps/css/styles.css">

TODO: Analyse results?

## TODO: Commit message analysis
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


|                                               | Linux  | Bootstrap  |  JSON-Server |   Global    |
| --------------------------------------------- | ------ | ---------- | ------------ | ----------- |
| Total messages                                | 12,192 | 4,928      | 136          | 262,414,932 |
| Messages with 'fix'                           | 42%    | 17%        | 8%           | 10%         |
| Messages with link to issue or pull request   | 2%     | 37%        | 16%          | 8%          |
| Messages shorter than 15 characters           | <1%    | 5%         | 26%          | 17%         |
| Average message length                        | 664.7  | 82.4       | 37.5         | 60.3        |


### What we learn from this

The first thing that caught my eye was the high standards Linux keep for their commit messages as not even 1 in 100 is shorter than 15 characters and that the average length exceeds 664 characters.This completely contrasts to the relatively high percentage of short commits in JSON-Server but also in general.

Not surprising is the fact that almost half of the commits in Linux do `fix` something and that `fix` appears in those long and complete commit messages.

There is also a  great difference between Bootstrap and Linux in terms of linking to issues and pull request as the Linux repo has issue reporting disabled on GitHub and does merge commits that do not always come from GitHub pull request but SCM. If that was not the case then low amount of links to issues or pull requests would mean a lot of direct pushes to master branch (as pull request merges would be caught by this rule).

## Stars per repo analysis

And this is the top 20 repos in stars received in 2016:

|                   repo                    |  stars  |
| ----------------------------------------- | ------- |
| FreeCodeCamp/FreeCodeCamp                 | 181,529 |
| jwasham/google-interview-university       |  28,824 |
| vuejs/vue                                 |  28,231 |
| tensorflow/tensorflow                     |  27,857 |
| vhf/free-programming-books                |  27,239 |
| facebook/react                            |  25,814 |
| getify/You-Dont-Know-JS                   |  24,517 |
| sindresorhus/awesome                      |  24,441 |
| chrislgarry/Apollo-11                     |  23,553 |
| yarnpkg/yarn                              |  21,202 |
| facebook/react-native                     |  19,787 |
| twbs/bootstrap                            |  19,232 |
| airbnb/javascript                         |  19,008 |
| joshbuchea/HEAD                           |  18,804 |
| firehol/netdata                           |  18,562 |
| facebookincubator/create-react-app        |  17,738 |
| robbyrussell/oh-my-zsh                    |  17,200 |
| FallibleInc/security-guide-for-developers	|  15,843 |
| open-guides/og-aws                        |  15,512 |
| github/gitignore                          |  15,137 |

We can see that Free Code Camp still gains lots of attraction! It currently has 211,340 stars, so most of them (86%!) were achieved this year. However this outlier can be explained taking into account that the number of people interested in programming increase in large quantities every year, that Free Code Camp is the mainstream entry point for it and that one of the first tasks asks for starring their repo.

Incredibly the second place is for google-interview-university that reached this position even though it's way younger that the others. It's interesting to see how certain repos that have been around for some time are still among the most attracted, like Twitter Boostrap, gitignore from GitHub and free-programming-books.

Additionally, there are repos related to JavaScript and Web Development such as vue, react, You-Dont-Know-JS, yarn, react-native, boostrap, a JavaScript style guide from Airbnb, HEAD, create-react-app,

| Language   | Sum of stars  |
| ---------- | ------------- |
|	JavaScript | 186219        |
|	Shell      | 121161        |
| HTML       | 120659        |
| CSS        | 115067        |
| Python     | 104823        |
| Ruby       | 66218         |
| Java       | 61409         |
| C          | 60201         |
| Makefile   | 54238         |
| C++        | 53854	       |

TODO
		* Top starred repos
		* Average stars per language

## The platforms we used
To get hold of and study this data we used several platforms like running [Apache Zeppelin](https://zeppelin.apache.org/) on Amazon EMR querying data from S3 as well as querying Google BigQuery's data directly and processing it with a local Zeppelin instance.

We wanted to use Spark as a tool to make distributed computations on our data. There are several ways to use it but it is common to use Spark through Databricks or Apache Zeppelin as they provide a graphic interface in the form of notebooks similar to Jupyter notebooks.
Databricks and Apache Zeppelin are quite similar but there are some minor differences as Databricks is more straightforward and lets you start working immediately while Zeppelin requires a bit more configuration but this does also mean that it is more flexible.
Another big difference is that while Databricks is a proprietary online platform, Zeppelin is open source and you can run it on your own machine. Zeppelin is also available to use on Amazon EMR and many other cloud platforms.

At first we considered using Databricks which has some nice UI features and you can use it for free if you use the community edition. The main disadvantage with Databricks was that it allows no Javascript or HTML code, which Zeppelin does.
So we then decided to go with Zeppelin on Amazon EMR getting data from S3. The transfer between S3 and a cluster on EMR in the same region of Amazon is free but you have to pay for storage and the hours of the clusters you use.

To get the data from the GitHub Archive we used [Scrapy](https://github.com/scrapy/scrapy), which is a Python crawler that allows us to throttle the request rate to stay inside GitHub's rate limits, among many other things. The code that does this can be found at [this GitHub repo](https://github.com/xmartlabs/gh2s3).

As there is a lot of data to store we decided that in the long term the best form to analyze GitHub data is to query it from Google BigQuery as we don't have to pay for its storage. We just needed to store some extra tables to map each user to his country.

### Mapping GitHub user locations to countries

For this task we used a script that is based on the work of [Ramiro Gómez] with some minor [modifications](https://github.com/xmartlabs/gh-commit-locations). This script basically reads JSON files with the user information from GitHub, takes the users location string and tries to map it to a country. As this location is just a string and can be anything (like 'Earth', 'localhost' or 'Milky Way' for example) it is not always mappable to a country. The script tries to find the name of a country or city in the location string and can map this to a country in more than 96% of the cases where the location is not empty. This is a pretty impressive result.

[Ramiro Gómez]: (http://geeksta.net/visualizations/github-commit-map/)
[GitHub Archive]: https://www.githubarchive.org/
