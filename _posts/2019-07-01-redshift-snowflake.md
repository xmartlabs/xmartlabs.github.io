---
layout: post
title: "Put your data to work: Amazon Redshift vs Snowflake"
date: 2019-06-03 17:00:00
author: Rodrigo Baya
categories: Data analysis, Data warehouse, 
author_id: pbt
featured_position: 1
featured_image: /images/redshift-snowflake/data_center_cloud.jpg
---

Well-informed, objective decisions have always been a key aspect of every successful business.
Nowadays, lots of companies gather a huge amount of data as a result of different processes, i.e, marketing campaign results, web site analytics or customer information on their product databases such as usage history or demographics.
Once you have this input, a key component in today's data-driven company is the data warehouse.
There, a consolidated view of all the convenient business information is stored in one place and can be queried in-depth for complex analysis.

Cloud Data warehouses are a popular choice among today's options. 
This type of warehouses are easy-to-scale, highly performant and cheaper than their in-house counterparts, as companies don't need to buy and maintain dedicated hardware nor hire highly specialized personnel.
On this ecosystem of providing a data warehouse as a service, there are two solutions that you must have heard about, especially if you prefer AWS platform, [Amazon Redshift](https://aws.amazon.com/redshift/) and [Snowflake](https://www.snowflake.com/). 
With Columnar storage and massively parallel processing (MPP) infrastructure, integrated with many Business Intelligence solutions and flexible pricing, this two solutions will definitely meet most of your requirements to analyze your business data today and in the future to come.

However, choosing the right option for your company sometimes is not about if the solution will successfully complete a task but what is the most suitable option for your data strategy.
Following, we describe some aspects that are different between these two solutions and you should have in mind when choosing your data warehouse.

## Pricing

One of the questions that may arise when selecting a warehouse is, what will I pay for?
The Snowflake approach for pricing is essentially paying for what you use, [splitting the billing on computing and storage](https://www.snowflake.com/pricing/).
Regarding the first part, Snowflake offers a compute resource called Warehouse, [which comes in seven different sizes](https://docs.snowflake.net/manuals/user-guide/warehouses-overview.html#warehouse-size).
For a certain warehouse, the billing is done with a per-second granularity, with the ability to automatically stop and resume the warehouse if it is not in use.
An important detail on this matter is that a warehouse consumes credits, and the price of these credits will depend on [one of the five plans](https://www.snowflake.com/pricing/) that Snowflake offers.
Regarding storage, this solution offers both, an on-demand approach and a pay-up-front option, charging a fixed value on a per-TB/per-Month basis.

The pricing on Redshift [is more coupled](https://aws.amazon.com/redshift/pricing/).
On the current generation, you can choose between two different "dense compute" or "dense storage" clusters, which have certain fixed characteristics and are priced per-hour of usage.
For each of these options, you can choose between an on-demand plan or an up-front payment, obtaining interesting savings if you choose the latter option.
Moving towards a more dynamic environment, Redshift now provides a Concurrency Scaling option, where you can add to your cluster more computing power on-demand, priced on a per-second rate.
Additionally, Amazon now provides [Redshift Spectrum](https://aws.amazon.com/blogs/big-data/amazon-redshift-spectrum-extends-data-warehousing-out-to-exabytes-no-loading-required/), which allows the user to run queries over S3 storage data.
This way, you can pay for your storage and compute capabilities more independently.

## Security

If you manage sensitive information, for example, Protected Health Information (PHI), one of your top concerns must be to have an infrastructure that correctly protects your data and complies to the highest standards.

Redshift provides robust and customizable end-to-end encryption, network isolation using VPCs and audit options through CloudTrail integration, among other features.
Also, AWS services comply with [several programs](https://aws.amazon.com/compliance/programs/), meaning you can configure your cluster to satisfy well-known regulations.

Snowflake also takes security seriously and provides always-on encryption on both your in-transit and at-rest data, VPN network isolation and also complies with security regulations. 
The important detail here is that these security options will depend on the [plan you selected](https://www.snowflake.com/pricing/), so you should take extra care when selecting the plan that fits your needs best.
For example, if some of the data you want to analyze are PHIs, you must at least have an "Enterprise for Sensitive Data" plan, which is the first level that provides HIPAA support.

## Performance

A desirable feature for your data warehouse is the ability to scale up or down the compute capacity as your needs change.
On Snowflake, this process is as easy as [altering your warehouse](https://docs.snowflake.net/manuals/user-guide/warehouses-tasks.html#resizing-a-warehouse) and select a new size, taking virtually no time.
On redshift, you have [two different options to re-scale a cluster](https://docs.aws.amazon.com/redshift/latest/mgmt/rs-resize-tutorial.html).
You either change the number of nodes on it, called Elastic resize, or you change the type of the nodes (and the amount if you want), called Classic resize.
If you choose an Elastic resize, the process takes just a few minutes to change the number of nodes and redistribute the data among them.
However, if you choose a Classic resize, a new cluster is created and your data is copied to it, taking a few hours to complete.
Redshift recommends to follow the approach "Snapshot, Restore, and Resize" when doing a Classic resize, to avoid downtimes during this process.

Another topic to consider is how to manage the query load on your data warehouse, in order to deliver the needed information for every report in a reasonable time.
On Redshift, all the user that wants to analyze data on the cluster shares the compute resources, so if there are a lot of user running a bunch of queries, they will definitely compete for them.
The solution that Redshift provides to control this concurrency problem is to configure [WLM Queue Assignment Rules](https://docs.aws.amazon.com/redshift/latest/dg/cm-c-wlm-queue-assignment-rules.html) to give priority on the cluster usage.
On Snowflake, the solution is much simpler, as the data and compute layers are independent.
On this platform, you can create different warehouses for different proposes and give each one different compute capacities if needed. This way, different queries to different warehouses won't compete, as they have separated resources.

## Semi-Structured data

Nowadays, it is more and more common to have information on a semi-structured format, for example, a JSON report from 3rd party API like Google Analytics Reporting API or exports from a NoSQL database like MongoDB.
If this is the case and you want to extract and correlate this data with other sources, Snowflake provides [out-of-the-box datatypes and a query syntax](https://docs.snowflake.net/manuals/sql-reference/data-types-semistructured.html) that allow you to transverse your JSON data.
Redshift also provides this feature through Spectrum, but it needs [some previous configuration](https://docs.aws.amazon.com/redshift/latest/dg/c-getting-started-using-spectrum.html) to work properly, like creating external schemas and tables.


Summarizing, both of these cloud data warehouse options are powerful and flexible solutions that are constantly improving to help companies to focus on what's important, get data-supported insights that will make their business successful.